import { mapValues } from 'lodash'
import { merge, Observable, Subject, Subscription, NEVER } from 'rxjs'
import { catchError } from 'rxjs/operators'

import {
  EffectAction,
  OriginalEffectActions,
  OriginalReducerActions,
  OriginalDefineActions,
  TriggerActions,
} from './types'
import { Ayanami } from './ayanami'
import { BasicState, getOriginalFunctions } from './utils'

interface Config<State> {
  defaultState: State
  effects: OriginalEffectActions<State>
  reducers: OriginalReducerActions<State>
  defineActions: OriginalDefineActions
}

const ikariSymbol = Symbol('ikari')

function catchRxError() {
  return catchError<any, any>((err) => {
    console.error(err)

    return NEVER
  })
}

export function combineWithIkari<S>(ayanami: Ayanami<S>): Ikari<S> {
  const ikari = Ikari.getFrom(ayanami)

  if (ikari) {
    return ikari
  } else {
    const { effects, reducers, defineActions } = getOriginalFunctions(ayanami)

    Object.assign(ayanami, mapValues(defineActions, ({ observable }) => observable))

    return Ikari.createAt(ayanami, {
      defaultState: ayanami.defaultState,
      effects,
      reducers,
      defineActions,
    })
  }
}

export function destroyIkariFrom<S>(ayanami: Ayanami<S>): void {
  const ikari = Ikari.getFrom(ayanami)

  if (ikari) {
    ikari.destroy()
    Reflect.deleteMetadata(ikariSymbol, ayanami)
  }
}

export class Ikari<State> {
  static createAt<S>(target: { defaultState: S }, config: Config<S>): Ikari<S> {
    const createdIkari = this.getFrom(target)

    if (createdIkari) {
      return createdIkari
    } else {
      const ikari = new Ikari(config)
      ikari.setup()
      Reflect.defineMetadata(ikariSymbol, ikari, target)
      return ikari
    }
  }

  static getFrom<S>(target: { defaultState: S }): Ikari<S> | undefined {
    return Reflect.getMetadata(ikariSymbol, target)
  }

  state: BasicState<State>

  triggerActions: TriggerActions = {}

  private subscription = new Subscription()

  private isSetup: boolean = false

  constructor(private readonly config: Readonly<Config<State>>) {
    this.state = new BasicState<State>(config.defaultState)
  }

  setup() {
    if (this.isSetup) {
      return
    }

    const [effectActions$, effectActions] = setupEffectActions(
      this.config.effects,
      this.state.state$,
    )

    const [reducerActions$, reducerActions] = setupReducerActions(
      this.config.reducers,
      this.state.getState,
    )

    this.triggerActions = {
      ...effectActions,
      ...reducerActions,
      ...mapValues(this.config.defineActions, ({ next }) => next),
    }

    this.subscription.add(
      effectActions$.subscribe(({ ayanami, params, actionName }) => {
        combineWithIkari(ayanami).triggerActions[actionName](params)
      }),
    )

    this.subscription.add(
      reducerActions$.subscribe((state) => {
        this.state.setState(state)
      }),
    )

    this.isSetup = true
  }

  destroy() {
    this.subscription.unsubscribe()
    this.triggerActions = {}
  }
}

function setupEffectActions<State>(
  effectActions: OriginalEffectActions<State>,
  state$: Observable<State>,
): [Observable<EffectAction>, TriggerActions] {
  const actions: TriggerActions = {}
  const effects: Observable<EffectAction>[] = []

  Object.keys(effectActions).forEach((actionName) => {
    const payload$ = new Subject<any>()
    actions[actionName] = (payload: any) => payload$.next(payload)

    const effect$: Observable<EffectAction> = effectActions[actionName](payload$, state$)
    effects.push(effect$.pipe(catchRxError()))
  })

  return [merge(...effects), actions]
}

function setupReducerActions<State>(
  reducerActions: OriginalReducerActions<State>,
  getState: () => State,
): [Observable<Partial<State>>, TriggerActions] {
  const actions: TriggerActions = {}
  const reducers: Observable<Partial<State>>[] = []

  Object.keys(reducerActions).forEach((actionName) => {
    const reducer$ = new Subject<Partial<State>>()
    reducers.push(reducer$)

    const reducer = reducerActions[actionName]
    actions[actionName] = (payload: any) => reducer$.next(reducer(payload, getState()))
  })

  return [merge(...reducers), actions]
}

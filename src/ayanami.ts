import 'reflect-metadata'
import { BehaviorSubject, Observable, merge, NEVER } from 'rxjs'
import { distinctUntilChanged, scan, tap, share } from 'rxjs/operators'
import shallowequal from 'shallowequal'

import { EffectAction, ConstructorOf, ActionOfAyanami } from './types'
import { useAyanami } from './hooks'
import {
  setupEffectActions,
  setupReducerActions,
  getAllActionFactories,
  effectSymbols,
} from './actions'

type ConstructorOfAyanami<M extends Ayanami<S>, S> = ConstructorOf<M> & typeof Ayanami

export abstract class Ayanami<State> {
  static useHooks<M extends Ayanami<S>, S>(this: ConstructorOf<M>) {
    const sharedInstance = (this as ConstructorOfAyanami<M, S>).shared()
    return useAyanami<M>(sharedInstance)
  }

  static shared<M extends Ayanami<any>>(this: ConstructorOf<M>): M {
    const THIS = this as ConstructorOfAyanami<M, any>
    const ayanami = THIS.getInstance()

    THIS.shared = () => ayanami
    ayanami.setup()

    return ayanami
  }

  static getInstance<M extends Ayanami<S>, S>(this: ConstructorOf<M>): M {
    return new this()
  }

  abstract defaultState: State

  readonly state$: Observable<Readonly<State>> = NEVER

  getState(): Readonly<State> {
    throw new Error(`Get state failed. call ${this.constructor.name}'s .setup(defaultState) first`)
  }

  getActions<M extends Ayanami<any>>(
    this: M,
  ): M extends Ayanami<infer S> ? ActionOfAyanami<M, S> : never {
    return getAllActionFactories(this)
  }

  protected setup() {
    const { state$: internalState$, getState, setState } = createState(this.defaultState)

    const effect$ = setupEffectActions(this, internalState$)
    const reducer$ = setupReducerActions(this, getState)

    const state$ = merge(effect$, reducer$).pipe(
      scan<Partial<State>, State>(
        (state, nextState) => ({ ...state, ...nextState }),
        this.defaultState,
      ),
      distinctUntilChanged(shallowequal),
      tap(setState),
      share(),
    )

    Object.defineProperty(this, 'state$', { value: state$ })
    Object.defineProperty(this, 'getState', { value: getState })

    this.setup = () => {}
  }

  protected setStateAction(state: Partial<State>): EffectAction<this> {
    return {
      ayanami: this,
      actionName: effectSymbols.setStateAction,
      params: state,
    }
  }
}

function createState<State>(defaultState: State) {
  const state$ = new BehaviorSubject<State>(defaultState)

  const setState = (state: State) => {
    state$.next(state)
  }

  const getState = () => state$.getValue()

  return {
    state$: state$.asObservable(),
    setState,
    getState,
  }
}

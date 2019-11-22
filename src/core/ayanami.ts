import { noop, Observable, merge } from 'rxjs'
import { map, filter } from 'rxjs/operators'
import { Reducer } from 'react'
import produce, { Draft } from 'immer'

import { moduleNameKey, globalKey } from '../ssr/ssr-module'
import { isSSREnabled } from '../ssr/flag'
import { createState, Action, Epic, StateCreator } from './state'
import {
  EFFECT_DECORATOR_SYMBOL,
  REDUCER_DECORATOR_SYMBOL,
  EFFECT_ACTION_SYMBOL,
  IMMER_REDUCER_DECORATOR_SYMBOL,
} from './symbols'

type Effect<T, State> = ((
  payload$: Observable<T>,
  state$?: Observable<State>,
) => Observable<Action<unknown>>) & {
  [EFFECT_ACTION_SYMBOL]: string
}

type ImmerReducer<S, T> = (prevState: Draft<S>, action: Action<T>) => void

// cast to string to match the shape of action
const NOOP_ACTION_TYPE = (Symbol('NOOP_ACTION') as unknown) as string

const globalScope =
  typeof self !== 'undefined'
    ? self
    : typeof window !== 'undefined'
    ? window
    : typeof global !== 'undefined'
    ? global
    : {}

export abstract class Ayanami<S> {
  private static ayanamiInstanceNames?: Set<string>

  abstract readonly defaultState: S

  // @internal
  ssrLoadKey = Symbol('SSR_LOADED')

  // @internal
  scopeName!: string

  // @internal
  nameForDebug?: string

  stateCreator!: StateCreator<S>

  constructor() {
    if (!isSSREnabled()) {
      const name = Object.getPrototypeOf(this)[moduleNameKey]
      if (!name) {
        return
      }
      // @ts-ignore
      const globalCache = globalScope[globalKey]

      if (globalCache) {
        const moduleCache = globalCache[name]
        if (moduleCache) {
          Reflect.defineMetadata(this.ssrLoadKey, true, this)
          Object.defineProperty(this, 'defaultState', {
            get: () => moduleCache[this.scopeName],
            set: noop,
          })
        }
      }
    }

    const effect = this.combineEffects()
    const reducer = this.combineReducers()

    if (process.env.NODE_ENV !== 'production') {
      this.nameForDebug = this.constructor.name
      if (Ayanami.ayanamiInstanceNames!.has(this.nameForDebug)) {
        throw new TypeError(`There are already a Ayanami instance named ${this.nameForDebug}`)
      }
    }

    this.stateCreator = createState((this as Ayanami<S>).defaultState, reducer, effect)
  }

  protected createNoopAction(): Action<null> {
    return {
      type: NOOP_ACTION_TYPE,
      payload: null,
    }
  }

  private combineEffects(): Epic<unknown, S> {
    const effects: Effect<unknown, S>[] = (
      (Reflect.getMetadata(EFFECT_DECORATOR_SYMBOL, this.constructor) as string[]) || []
    ).map((property) => (this as any)[property].bind(this))
    return (action$: Observable<Action<unknown>>, state$: Observable<S>) => {
      return merge(
        ...effects.map((effect) => {
          const payload$ = action$.pipe(
            filter(({ type }) => type === effect[EFFECT_ACTION_SYMBOL]),
            map(({ payload }) => payload),
          )
          return effect(payload$, state$)
        }),
      )
    }
  }

  private combineReducers(): Reducer<S, Action<unknown>> {
    const reducers = (
      (Reflect.getMetadata(REDUCER_DECORATOR_SYMBOL, this.constructor) as string[]) || []
    )
      .map((property) => (this as any)[property].bind(this))
      .reduce((acc, property) => {
        acc[property] = (this as any)[property].bind(this)
        return acc
      }, {} as { [index: string]: Reducer<S, Action<unknown>> })
    const immerReducers = (
      (Reflect.getMetadata(IMMER_REDUCER_DECORATOR_SYMBOL, this.constructor) as string[]) || []
    ).reduce((acc, property) => {
      acc[property] = (this as any)[property].bind(this)
      return acc
    }, {} as { [index: string]: ImmerReducer<S, unknown> })

    return (prevState, action) => {
      const { type } = action
      if (reducers[type]) {
        return reducers[type](prevState, action)
      } else if (immerReducers[type]) {
        return produce(prevState, (draft) => immerReducers[type](draft, action))
      }
      return prevState
    }
  }
}

if (process.env.NODE_ENV !== 'production') {
  ;(Ayanami as any).ayanamiInstanceNames = new Set()
}

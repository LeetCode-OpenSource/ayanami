import { Observable, noop } from 'rxjs'

import { ActionOfAyanami } from './types'
import { combineWithIkari, destroyIkariFrom } from './ikari'
import { moduleNameKey, globalKey } from '../ssr/ssr-module'
import { isSSREnabled } from '../ssr/flag'

const globalScope =
  typeof self !== 'undefined'
    ? self
    : typeof window !== 'undefined'
    ? window
    : typeof global !== 'undefined'
    ? global
    : {}

export abstract class Ayanami<State> {
  abstract defaultState: State

  // @internal
  ssrLoadKey = Symbol('SSR_LOADED')

  // @internal
  scopeName!: string

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
  }

  destroy(): void {
    destroyIkariFrom(this)
  }

  getState$<M extends Ayanami<State>>(
    this: M,
  ): M extends Ayanami<infer S> ? Observable<Readonly<S>> : Observable<Readonly<State>> {
    return combineWithIkari(this).state.state$ as any
  }

  getState<M extends Ayanami<State>>(
    this: M,
  ): M extends Ayanami<infer S> ? Readonly<S> : Readonly<State> {
    return combineWithIkari(this).state.getState() as any
  }

  getActions<M extends Ayanami<State>>(
    this: M,
  ): M extends Ayanami<infer S> ? ActionOfAyanami<M, S> : ActionOfAyanami<M, State> {
    return combineWithIkari(this).effectActionFactories as any
  }
}

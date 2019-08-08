import { Observable, noop } from 'rxjs'

import { ActionOfAyanami } from './types'
import { combineWithIkari, destroyIkariFrom } from './ikari'
import { moduleNameKey, globalKey } from '../ssr/ssr-module'
import { SSREnabled } from '../ssr/flag'

export abstract class Ayanami<State> {
  abstract defaultState: State

  // @internal
  ssrLoadKey = Symbol('SSR_LOADED')

  constructor() {
    if (!SSREnabled) {
      const name = Object.getPrototypeOf(this)[moduleNameKey]
      if (!name) {
        return
      }
      const globalCache = window[globalKey as any] as any
      if (globalCache) {
        const moduleCache = globalCache[name]
        if (moduleCache) {
          Reflect.defineMetadata(this.ssrLoadKey, true, this)
          Object.defineProperty(this, 'defaultState', {
            get: () => moduleCache,
            set: noop,
          })
        }
      }
    }
  }

  destroy() {
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

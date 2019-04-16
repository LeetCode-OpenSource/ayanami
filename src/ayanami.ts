import * as React from 'react'
import { Observable } from 'rxjs'

import { ConstructorOf, ActionOfAyanami, ConstructorOfAyanami } from './types'
import {
  getAllActionFactories,
  useAyanami,
  connectAyanami,
  getAyanamiInstance,
  HooksResult,
  ComponentConnectedWithAyanami,
} from './utils'
import { combineWithIkari, destroyIkariFrom } from './ikari'

export abstract class Ayanami<State> {
  static connect<M extends Ayanami<State>, State, P>(
    this: ConstructorOf<M>,
    Component: React.ComponentType<P>,
  ) {
    return connectAyanami(this, Component) as M extends Ayanami<infer S>
      ? ComponentConnectedWithAyanami<M, S, P>
      : ComponentConnectedWithAyanami<M, State, P>
  }

  static useHooks<M extends Ayanami<State>, State>(this: ConstructorOf<M>) {
    const ayanami = React.useMemo(
      () => (this as ConstructorOfAyanami<M, State>).getInstance<M>(),
      [],
    )

    return useAyanami(ayanami) as M extends Ayanami<infer S>
      ? HooksResult<M, S>
      : HooksResult<M, State>
  }

  static getInstance<M extends Ayanami<any>>(this: ConstructorOf<M>): M {
    return getAyanamiInstance(this)
  }

  abstract defaultState: State

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
    return getAllActionFactories(this)
  }
}

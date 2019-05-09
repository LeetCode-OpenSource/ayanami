import * as React from 'react'
import { Observable } from 'rxjs'

import { ConstructorOf, ActionOfAyanami } from './types'
import { getEffectActionFactories } from './utils'
import { connectAyanami, ComponentConnectedWithAyanami } from './connect'
import { combineWithIkari, destroyIkariFrom } from './ikari'

export abstract class Ayanami<State> {
  static connect<M extends Ayanami<S>, S, P>(
    this: ConstructorOf<M>,
    Component: React.ComponentType<P>,
  ): M extends Ayanami<infer SS>
    ? ComponentConnectedWithAyanami<M, SS, P>
    : ComponentConnectedWithAyanami<M, S, P> {
    return connectAyanami<M, S, P>(this, Component) as any
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
    return getEffectActionFactories(this)
  }
}

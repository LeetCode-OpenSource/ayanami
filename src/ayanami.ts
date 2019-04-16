import { ComponentType } from 'react'
import { Observable } from 'rxjs'

import { ConstructorOf, ActionOfAyanami } from './types'
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
  static connect<M extends Ayanami<any>, P>(this: ConstructorOf<M>, Component: ComponentType<P>) {
    return getAyanamiInstance(this).connect(Component)
  }

  static useHooks<M extends Ayanami<any>>(this: ConstructorOf<M>) {
    return getAyanamiInstance(this).useHooks()
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

  useHooks<M extends Ayanami<State>>(
    this: M,
  ): M extends Ayanami<infer S> ? HooksResult<M, S> : HooksResult<M, State> {
    return useAyanami(this) as any
  }

  connect<M extends Ayanami<State>, P>(
    this: M,
    Component: ComponentType<P>,
  ): M extends Ayanami<infer S>
    ? ComponentConnectedWithAyanami<M, S, P>
    : ComponentConnectedWithAyanami<M, State, P> {
    return connectAyanami(this, Component) as any
  }
}

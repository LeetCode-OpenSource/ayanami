import 'reflect-metadata'
import { ComponentType } from 'react'
import { Observable } from 'rxjs'
import { InjectableFactory } from '@asuka/di'

import { ConstructorOf, ActionOfAyanami } from './types'
import {
  getAllActionFactories,
  useAyanami,
  connectAyanami,
  setup,
  HooksResult,
  ComponentConnectedWithAyanami,
} from './utils'

export abstract class Ayanami<State> {
  static connect<M extends Ayanami<any>, P>(this: ConstructorOf<M>, Component: ComponentType<P>) {
    return InjectableFactory.getInstance(this).connect(Component)
  }

  static useHooks<M extends Ayanami<any>>(this: ConstructorOf<M>) {
    return InjectableFactory.getInstance(this).useHooks()
  }

  static getState<M extends Ayanami<S>, S>(this: ConstructorOf<M>) {
    return InjectableFactory.getInstance(this).getState<M>()
  }

  static getState$<M extends Ayanami<S>, S>(this: ConstructorOf<M>) {
    return InjectableFactory.getInstance(this).getState$<M>()
  }

  static getActions<M extends Ayanami<S>, S>(this: ConstructorOf<M>) {
    return InjectableFactory.getInstance(this).getActions<M>()
  }

  abstract defaultState: State

  getState$!: <M extends Ayanami<State>>(
    this: M,
  ) => M extends Ayanami<infer S> ? Observable<Readonly<S>> : Observable<Readonly<State>>

  getState!: <M extends Ayanami<State>>(
    this: M,
  ) => M extends Ayanami<infer S> ? Readonly<S> : Readonly<State>

  getActions<M extends Ayanami<State>>(
    this: M,
  ): M extends Ayanami<infer S> ? ActionOfAyanami<M, S> : ActionOfAyanami<M, State> {
    setup(this)
    return getAllActionFactories(this)
  }

  useHooks<M extends Ayanami<State>>(
    this: M,
  ): M extends Ayanami<infer S> ? HooksResult<M, S> : HooksResult<M, State> {
    setup(this)
    return useAyanami(this) as any
  }

  connect<M extends Ayanami<State>, P>(
    this: M,
    Component: ComponentType<P>,
  ): M extends Ayanami<infer S>
    ? ComponentConnectedWithAyanami<M, S, P>
    : ComponentConnectedWithAyanami<M, State, P> {
    setup(this)
    return connectAyanami(this, Component) as any
  }
}

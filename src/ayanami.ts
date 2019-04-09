import 'reflect-metadata'
import { ComponentType } from 'react'
import { Observable } from 'rxjs'

import { ConstructorOf, ActionOfAyanami } from './types'
import {
  sharedAyanami,
  getAllActionFactories,
  useAyanami,
  connectAyanami,
  HooksResult,
  ComponentConnectedWithAyanami,
} from './utils'

export abstract class Ayanami<State> {
  static connect<M extends Ayanami<any>, P>(this: ConstructorOf<M>, Component: ComponentType<P>) {
    return sharedAyanami(this).connect(Component)
  }

  static useHooks<M extends Ayanami<any>>(this: ConstructorOf<M>) {
    return sharedAyanami(this).useHooks()
  }

  static getState<M extends Ayanami<S>, S>(this: ConstructorOf<M>) {
    return sharedAyanami(this).getState<M>()
  }

  static getState$<M extends Ayanami<S>, S>(this: ConstructorOf<M>) {
    return sharedAyanami(this).getState$<M>()
  }

  static getActions<M extends Ayanami<S>, S>(this: ConstructorOf<M>) {
    return sharedAyanami(this).getActions<M>()
  }

  static getInstance<M extends Ayanami<S>, S>(this: ConstructorOf<M>): M {
    return new this()
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
    return getAllActionFactories(this)
  }

  useHooks<M extends Ayanami<State>>(this: M) {
    return useAyanami(this) as M extends Ayanami<infer S>
      ? HooksResult<M, S>
      : HooksResult<M, State>
  }

  connect<M extends Ayanami<State>, P>(this: M, Component: ComponentType<P>) {
    return connectAyanami(this, Component) as M extends Ayanami<infer S>
      ? ComponentConnectedWithAyanami<M, S, P>
      : ComponentConnectedWithAyanami<M, State, P>
  }
}

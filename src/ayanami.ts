import 'reflect-metadata'
import { ComponentType } from 'react'
import { Observable } from 'rxjs'

import { ConstructorOf, ActionOfAyanami } from './types'
import { sharedAyanami, getAllActionFactories } from './utils'
import { HooksResult, useAyanami } from './hooks'
import { ComponentConnectedWithAyanami, connectAyanami } from './connect'

export abstract class Ayanami<State> {
  static connect<M extends Ayanami<any>, P>(this: ConstructorOf<M>, Component: ComponentType<P>) {
    return connectAyanami(this, Component) as M extends Ayanami<infer S>
      ? ComponentConnectedWithAyanami<M, S, P>
      : never
  }

  static useHooks<M extends Ayanami<any>>(this: ConstructorOf<M>) {
    return useAyanami(this) as M extends Ayanami<infer S> ? HooksResult<M, S> : never
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
}

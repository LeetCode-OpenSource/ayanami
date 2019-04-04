import 'reflect-metadata'
import { Observable } from 'rxjs'

import { ConstructorOf, ActionOfAyanami, StateOfAyanami } from './types'
import { useAyanami } from './hooks'
import { shared, getAllActionFactories } from './utils'

export abstract class Ayanami<State> {
  static useHooks<M extends Ayanami<any>>(this: ConstructorOf<M>) {
    return useAyanami<M, StateOfAyanami<M>>(this)
  }

  static getState<M extends Ayanami<any>>(this: ConstructorOf<M>) {
    return shared(this).getState<M, StateOfAyanami<M>>()
  }

  static getState$<M extends Ayanami<any>>(this: ConstructorOf<M>) {
    return shared(this).getState$<M, StateOfAyanami<M>>()
  }

  static getActions<M extends Ayanami<any>>(this: ConstructorOf<M>) {
    return shared(this).getActions<M, StateOfAyanami<M>>()
  }

  static getInstance<M extends Ayanami<S>, S>(this: ConstructorOf<M>): M {
    return new this()
  }

  abstract defaultState: State

  getState$!: <M extends Ayanami<S>, S>(this: M) => Observable<Readonly<S>>

  getState!: <M extends Ayanami<S>, S>(this: M) => Readonly<S>

  getActions<M extends Ayanami<S>, S>(this: M): ActionOfAyanami<M, S> {
    return getAllActionFactories(this)
  }
}

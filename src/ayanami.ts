import 'reflect-metadata'
import { Observable } from 'rxjs'

import { ConstructorOf, ActionOfAyanami, ConstructorOfAyanami } from './types'
import { createState } from './state'
import { useAyanami } from './hooks'
import { setupEffectActions, setupReducerActions, getAllActionFactories } from './actions'

const createSetupError = (className: string) =>
  new Error(`Get state failed. call ${className}'s .setup(defaultState) first`)

export abstract class Ayanami<State> {
  static useHooks<M extends Ayanami<S>, S>(this: ConstructorOf<M>) {
    const sharedInstance = (this as ConstructorOfAyanami<M, S>).shared()
    return useAyanami<M>(sharedInstance)
  }

  static shared<M extends Ayanami<any>>(this: ConstructorOf<M>): M {
    const THIS = this as ConstructorOfAyanami<M, any>
    const ayanami = THIS.getInstance()

    THIS.shared = () => ayanami
    ayanami.setup()

    return ayanami
  }

  static getInstance<M extends Ayanami<S>, S>(this: ConstructorOf<M>): M {
    return new this()
  }

  abstract defaultState: State

  get state$(): Observable<Readonly<State>> {
    return new Observable((observer) => {
      observer.error(createSetupError(this.constructor.name))
    })
  }

  getState(): Readonly<State> {
    throw createSetupError(this.constructor.name)
  }

  getActions<M extends Ayanami<any>>(
    this: M,
  ): M extends Ayanami<infer S> ? ActionOfAyanami<M, S> : never {
    return getAllActionFactories(this)
  }

  setup() {
    const basicState = createState(this.defaultState)

    setupEffectActions(this, basicState)
    setupReducerActions(this, basicState)

    Object.defineProperty(this, 'state$', { value: basicState.state$ })
    Object.defineProperty(this, 'getState', { value: basicState.getState })

    this.setup = () => {}
  }
}

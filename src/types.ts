import { Observable } from 'rxjs'

import { Ayanami } from './ayanami'

export type ActionMethod<T, R = void> = (params: T) => R

export interface ConstructorOf<T> {
  new (...args: any[]): T
}

export type ConstructorOfAyanami<M extends Ayanami<S>, S> = ConstructorOf<M> & typeof Ayanami

export type Omit<T, K> = Pick<T, Exclude<keyof T, K>>

export interface EffectAction<M = Ayanami<any>> {
  readonly ayanami: M
  readonly actionName: string | Symbol
  readonly params: any
}

type UnpackPayload<F, S> = F extends () => Partial<S>
  ? void
  : F extends (payload: infer OP) => any
  ? OP extends Observable<infer P>
    ? P
    : OP
  : F extends (payload: infer P, state: S) => any
  ? P
  : F extends (payload$: infer OP, state$: infer OS) => any
  ? OP extends Observable<infer P>
    ? OS extends Observable<S>
      ? P
      : never
    : never
  : never

export type ActionMethodOfAyanami<M, S> = {
  [key in Exclude<keyof M, keyof Ayanami<S>>]: UnpackPayload<M[key], S> extends never
    ? never
    : ActionMethod<UnpackPayload<M[key], S>>
}

export type ActionOfAyanami<M, S> = {
  [key in Exclude<keyof M, keyof Ayanami<S>>]: UnpackPayload<M[key], S> extends never
    ? never
    : ActionMethod<UnpackPayload<M[key], S>, EffectAction<M>>
}

export type StateOfAyanami<M> = M extends Ayanami<infer State> ? State : never

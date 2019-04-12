import { Observable } from 'rxjs'

import { Ayanami } from './ayanami'

// https://stackoverflow.com/questions/55541275/typescript-check-for-the-any-type
type IfAny<T, Y, N> = 0 extends (1 & T) ? Y : N

type IsAny<T> = IfAny<T, true, false>

type IsVoid<T> = IsAny<T> extends true ? false : [T] extends [void] ? true : false

export type ActionMethod<T, R = void> = IsVoid<T> extends true ? () => R : (params: T) => R

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

type UnpackEffectPayload<Func, State> = Func extends () => Observable<EffectAction>
  ? void
  : Func extends (payload$: infer OP) => Observable<EffectAction>
  ? OP extends Observable<infer P>
    ? P
    : never
  : Func extends (payload$: infer OP, state$: infer OS) => Observable<EffectAction>
  ? OP extends Observable<infer P>
    ? OS extends Observable<infer S>
      ? S extends State
        ? P
        : never
      : never
    : never
  : never

type UnpackReducerPayload<Func, State> = Func extends () => Partial<State>
  ? void
  : Func extends (payload: infer P) => Partial<State>
  ? P
  : Func extends (payload: infer P, state: infer S) => Partial<State>
  ? S extends State
    ? P
    : never
  : never

type UnpackDefineActionPayload<OB> = OB extends Observable<infer P> ? P : never

type UnpackPayload<F, S> = UnpackEffectPayload<F, S> extends never
  ? UnpackReducerPayload<F, S> extends never
    ? UnpackDefineActionPayload<F>
    : UnpackReducerPayload<F, S>
  : UnpackEffectPayload<F, S>

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

import { Observable } from 'rxjs'
import { Draft } from 'immer'

import { Ayanami } from './ayanami'
import { Action } from './state'

export type InstanceActionMethod<T> = {
  0: () => Action<void>
  1: (payload: T) => Action<T>
  2: never
}[T extends never ? 2 : T extends void ? 0 : 1]

export type ActionMethod<T> = {
  0: () => void
  1: (payload: T) => void
  2: never
}[T extends never ? 2 : T extends void ? 0 : 1]

export interface ConstructorOf<T> {
  new (...args: any[]): T
}

export type Omit<T, K> = Pick<T, Exclude<keyof T, K>>

type UnpackEffectPayload<Func, S> = Func extends (
  action$: Observable<infer Payload>,
) => Observable<Action>
  ? Payload
  : Func extends (action$: Observable<infer Payload>, state$: Observable<S>) => Observable<Action>
  ? Payload
  : never

type UnpackReducerPayload<Func, S> = Func extends (state: S) => S
  ? void
  : Func extends (State: S, payload: infer Payload) => S
  ? Payload
  : never

type UnpackImmerReducerPayload<Func, S> = Func extends (state: Draft<S>) => void
  ? void
  : Func extends (state: Draft<S>, payload: infer Payload) => void
  ? Payload
  : never

type UnpackDefineActionPayload<OB> = OB extends Observable<infer P> ? P : never

type UnpackPayload<F, S> = UnpackEffectPayload<F, S> extends never
  ? UnpackImmerReducerPayload<F, S> extends never
    ? UnpackReducerPayload<F, S> extends never
      ? UnpackDefineActionPayload<F> extends never
        ? never
        : UnpackDefineActionPayload<F>
      : UnpackReducerPayload<F, S>
    : UnpackImmerReducerPayload<F, S>
  : UnpackEffectPayload<F, S>

export type ActionOfAyanami<M extends Ayanami<S>, S> = Omit<
  {
    [key in keyof M]: ActionMethod<UnpackPayload<M[key], S>>
  },
  keyof Ayanami<S>
>

export type InstanceActionOfAyanami<M extends Ayanami<S>, S> = Omit<
  {
    [key in keyof M]: InstanceActionMethod<UnpackPayload<M[key], S>>
  },
  keyof Ayanami<S>
>

export type ActionStreamOfAyanami<M extends Ayanami<S>, S> = Omit<
  {
    [key in keyof M]: Observable<UnpackPayload<M[key], S>>
  },
  keyof Ayanami<S>
>

import { Observable } from 'rxjs'
import { Draft } from 'immer'

import { Ayanami } from './ayanami'

// https://stackoverflow.com/questions/55541275/typescript-check-for-the-any-type
type IfAny<T, Y, N> = 0 extends (1 & T) ? Y : N

type IsAny<T> = IfAny<T, true, false>

// https://stackoverflow.com/questions/55542332/typescript-conditional-type-with-discriminated-union
type IsVoid<T> = IsAny<T> extends true ? false : [T] extends [void] ? true : false

// using class type to avoid conflict with user defined params
class ArgumentsType<_Arguments extends any[]> {}

export type ActionMethod<
  T extends ArgumentsType<any[]> | never,
  R = void
> = T extends ArgumentsType<infer Arguments>
  ? IsVoid<Arguments[0]> extends true
    ? () => R
    : Extract<Arguments[0], undefined> extends never
    ? (params: Arguments[0]) => R
    : (params?: Arguments[0]) => R
  : (params: T) => R

export interface ConstructorOf<T> {
  new (...args: any[]): T
}

export type Omit<T, K> = Pick<T, Exclude<keyof T, K>>

export interface EffectAction {
  readonly ayanami: Ayanami<any>
  readonly actionName: string
  readonly params: any
}

export interface ReducerAction<State> {
  readonly actionName: string
  readonly params: any
  readonly nextState: State
}

type UnpackEffectFunctionArguments<T extends Function> = T extends (
  ...payload: infer Arguments
) => Observable<EffectAction>
  ? Arguments[0] extends Observable<infer P>
    ? ArgumentsType<[P]>
    : never
  : never

type UnpackEffectPayload<Func, State> = Func extends () => Observable<EffectAction>
  ? UnpackEffectFunctionArguments<Func> extends never
    ? ArgumentsType<[void]>
    : UnpackEffectFunctionArguments<Func>
  : Func extends (payload$: Observable<any>) => Observable<EffectAction>
  ? UnpackEffectFunctionArguments<Func>
  : Func extends (payload$: Observable<any>, state$: Observable<State>) => Observable<EffectAction>
  ? UnpackEffectFunctionArguments<Func>
  : never

type UnpackReducerFunctionArguments<T extends Function> = T extends (
  state: any,
  ...payload: infer Arguments
) => any
  ? ArgumentsType<Arguments>
  : never

type UnpackReducerPayload<Func, State> = Func extends () => State
  ? UnpackReducerFunctionArguments<Func> extends never
    ? ArgumentsType<[void]>
    : UnpackReducerFunctionArguments<Func>
  : Func extends (state: State) => State
  ? UnpackReducerFunctionArguments<Func>
  : Func extends (state: State, payload: any) => State
  ? UnpackReducerFunctionArguments<Func>
  : never

type UnpackImmerReducerPayload<Func, State> = Func extends (state: Draft<State>) => void
  ? UnpackReducerFunctionArguments<Func>
  : Func extends (state: Draft<State>, payload: any) => void
  ? UnpackReducerFunctionArguments<Func>
  : never

type UnpackDefineActionPayload<OB> = OB extends Observable<infer P> ? ArgumentsType<[P]> : never

type UnpackPayload<F, S> = UnpackEffectPayload<F, S> extends never
  ? UnpackReducerPayload<F, S> extends never
    ? UnpackImmerReducerPayload<F, S> extends never
      ? UnpackDefineActionPayload<F>
      : UnpackImmerReducerPayload<F, S>
    : UnpackReducerPayload<F, S>
  : UnpackEffectPayload<F, S>

type PayloadMethodKeySet<M, S, SS extends keyof M> = {
  [key in SS]: M[key] extends
    | (() => Observable<EffectAction>)
    | ((payload$: Observable<any>) => Observable<EffectAction>)
    | ((payload$: Observable<any>, state$: Observable<S>) => Observable<EffectAction>)
    ? key
    : M[key] extends (() => S) | ((state: S) => S) | ((state: S, payload: any) => S)
    ? key
    : M[key] extends ((state: Draft<S>) => void) | ((state: Draft<S>, payload: any) => void)
    ? key
    : M[key] extends Observable<any>
    ? key
    : never
}[SS]

export type ActionMethodOfAyanami<M extends Ayanami<S>, S> = Pick<
  { [key in keyof M]: ActionMethod<UnpackPayload<M[key], S>> },
  PayloadMethodKeySet<M, S, Exclude<keyof M, keyof Ayanami<S>>>
>

export type ActionOfAyanami<M extends Ayanami<S>, S> = Pick<
  { [key in keyof M]: ActionMethod<UnpackPayload<M[key], S>, EffectAction> },
  PayloadMethodKeySet<M, S, Exclude<keyof M, keyof Ayanami<S>>>
>

export interface ObjectOf<T> {
  [key: string]: T
}

export type OriginalEffectActions<State> = ObjectOf<
  (payload$: Observable<any>, state: Observable<State>) => Observable<Readonly<EffectAction>>
>

export type OriginalReducerActions<State> = ObjectOf<
  (state: State, payload: any) => Readonly<State>
>

export type OriginalImmerReducerActions<State> = ObjectOf<
  (state: Draft<State>, payload: any) => void
>

export type OriginalDefineActions = ObjectOf<{
  next(params: any): void
  observable: Observable<any>
}>

export type TriggerActions = ObjectOf<ActionMethod<any>>

export type EffectActionFactories = ObjectOf<(params: any) => EffectAction>

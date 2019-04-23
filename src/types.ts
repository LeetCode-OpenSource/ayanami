import { Observable } from 'rxjs'

import { Ayanami } from './ayanami'

export enum Pattern {
  Singleton = 'Singleton',
  Transient = 'Transient',
}

// https://stackoverflow.com/questions/55541275/typescript-check-for-the-any-type
type IfAny<T, Y, N> = 0 extends (1 & T) ? Y : N

type IsAny<T> = IfAny<T, true, false>

// https://stackoverflow.com/questions/55542332/typescript-conditional-type-with-discriminated-union
type IsVoid<T> = IsAny<T> extends true ? false : [T] extends [void] ? true : false

// using class type to avoid conflict with user defined params
class ArgumentsType<_Arguments extends Array<any>> {}

export type ActionMethod<
  T extends ArgumentsType<any[]> | never,
  R = void
> = T extends ArgumentsType<infer Arguments>
  ? IsVoid<Arguments[0]> extends true
    ? () => R
    : (params: Arguments[0]) => R
  : (params: T) => R

export interface ConstructorOf<T> {
  new (...args: any[]): T
}

export type ConstructorOfAyanami<M extends Ayanami<any>> = ConstructorOf<M> & typeof Ayanami

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
  ...payload: infer Arguments
) => any
  ? ArgumentsType<Arguments>
  : never

type UnpackReducerPayload<Func, State> = Func extends () => Partial<State>
  ? UnpackReducerFunctionArguments<Func> extends never
    ? ArgumentsType<[void]>
    : UnpackReducerFunctionArguments<Func>
  : Func extends (payload: any) => Partial<State>
  ? UnpackReducerFunctionArguments<Func>
  : Func extends (payload: any, state: State) => Partial<State>
  ? UnpackReducerFunctionArguments<Func>
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
    : ActionMethod<UnpackPayload<M[key], S>, EffectAction>
}

export interface ObjectOf<T> {
  [key: string]: T
}

export type OriginalEffectActions<State> = ObjectOf<
  (payload$: Observable<any>, state: Observable<State>) => Observable<Readonly<EffectAction>>
>

export type OriginalReducerActions<State> = ObjectOf<
  (payload: any, state: Readonly<State>) => Readonly<Partial<State>>
>

export type OriginalDefineActions = ObjectOf<{
  next(params: any): void
  observable: Observable<any>
}>

export type TriggerActions = ObjectOf<ActionMethod<any>>

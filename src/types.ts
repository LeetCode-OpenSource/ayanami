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

export type ActionMethod<T, R = void> = IsVoid<T> extends true
  ? () => R
  : T extends ArgumentsType<infer Arguments>
  ? (params: Exclude<Arguments[0], undefined> extends never ? void : Arguments[0]) => R
  : (params: T) => R

export interface ConstructorOf<T> {
  new (...args: any[]): T
}

export type ConstructorOfAyanami<M extends Ayanami<S>, S> = ConstructorOf<M> & typeof Ayanami

export type Omit<T, K> = Pick<T, Exclude<keyof T, K>>

export interface EffectAction<M = Ayanami<any>> {
  readonly ayanami: M
  readonly actionName: string
  readonly params: any
}

export interface ReducerAction<State> {
  readonly actionName: string
  readonly params: any
  readonly nextState: State
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
  ? Func extends (...payload: infer Arguments) => Partial<State>
    ? ArgumentsType<Arguments> // using array type to avoid get `{}` when payload is undefined
    : void
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

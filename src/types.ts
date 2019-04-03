import { Observable } from 'rxjs'

import { Ayanami } from './ayanami'

export type ActionMethod<T, R = void> = (params: T) => R

export interface ConstructorOf<T> {
  new (...args: any[]): T
}

export type ConstructorOfAyanami<M extends Ayanami<S>, S> = ConstructorOf<M> & typeof Ayanami

export interface EffectAction<M = Ayanami<any>> {
  readonly ayanami: M
  readonly actionName: string | Symbol
  readonly params: any
}

type UnpackPayloadWithState<F, S> = F extends (
  payload: infer Payload,
  state: infer State,
) => infer ReturnState
  ? Payload extends Observable<infer P>
    ? (State extends Observable<S>
        ? (ReturnState extends Observable<EffectAction> ? P : never)
        : never)
    : (State extends S ? (ReturnState extends Partial<S> ? Payload : never) : never)
  : never

type UnpackPayloadWithoutState<F, S> = F extends (payload: infer Payload) => infer ReturnState
  ? Payload extends Observable<infer P>
    ? P
    : (ReturnState extends Partial<S> ? Payload : never)
  : never

type UnpackPayloadWithoutStateAndPayload<F, S> = F extends () => infer ReturnState
  ? (ReturnState extends Partial<S> ? void : never)
  : never

type UnpackPayload<F, S> = UnpackPayloadWithoutStateAndPayload<F, S> extends never
  ? UnpackPayloadWithoutState<F, S> extends never
    ? UnpackPayloadWithState<F, S>
    : UnpackPayloadWithoutState<F, S>
  : UnpackPayloadWithoutStateAndPayload<F, S>

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

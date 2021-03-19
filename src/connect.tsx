import * as React from 'react'

import { Ayanami, ActionMethodOfAyanami, ConstructorOf, Omit } from './core'
import { useAyanami } from './hooks'

type ConnectedComponent<P, S, A> = React.FunctionComponent<Omit<P, keyof S | keyof A>>

type ConnectComponent<S, A> = <P>(Component: React.ComponentType<P>) => ConnectedComponent<P, S, A>

export interface ComponentConnectedWithAyanami<M extends Ayanami<S>, S> {
  (): ConnectComponent<Record<string, unknown>, Record<string, unknown>>

  <MS>(mapStateToProps: (state: S) => MS): ConnectComponent<MS, Record<string, unknown>>

  <MS, MA>(
    mapStateToProps: (state: S) => MS,
    mapActionsToProps: (actions: ActionMethodOfAyanami<M, S>) => MA,
  ): ConnectComponent<MS, MA>

  <MA>(
    mapStateToProps: null,
    mapActionsToProps: (actions: ActionMethodOfAyanami<M, S>) => MA,
  ): ConnectComponent<Record<string, unknown>, MA>
}

export function connectAyanami<M extends Ayanami<S>, S>(
  AyanamiClass: ConstructorOf<M>,
): M extends Ayanami<infer SS>
  ? ComponentConnectedWithAyanami<M, SS>
  : ComponentConnectedWithAyanami<M, S> {
  return function connectMap<SP, AP>(
    mapStateToProps?: (props: S) => SP,
    mapActionsToProps?: (actions: ActionMethodOfAyanami<M, S>) => AP,
  ) {
    return function connectComponent<P>(Component: React.ComponentType<P>) {
      return function ConnectAyanami(props: P) {
        const [state, action] = useAyanami(AyanamiClass)
        const mappedState = mapStateToProps ? mapStateToProps(state) : {}
        const mappedAction = mapActionsToProps ? mapActionsToProps(action as any) : {}

        return <Component {...mappedState} {...mappedAction} {...props} />
      }
    }
  } as any
}

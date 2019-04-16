import * as React from 'react'

import { ActionMethodOfAyanami, ConstructorOf, ConstructorOfAyanami, Omit } from '../types'
import { Ayanami } from '../ayanami'

type ConnectedComponent<P, S, A> = React.FunctionComponent<Omit<P, keyof S | keyof A>>

export interface ComponentConnectedWithAyanami<M extends Ayanami<S>, S, P> {
  (): ConnectedComponent<P, S, ActionMethodOfAyanami<M, S>>

  <MS>(mapStateToProps: (state: S) => MS): ConnectedComponent<P, MS, ActionMethodOfAyanami<M, S>>

  <MS, MA>(
    mapStateToProps: (state: S) => MS,
    mapActionsToProps: (actions: ActionMethodOfAyanami<M, S>) => MA,
  ): ConnectedComponent<P, MS, MA>

  <MA>(
    mapStateToProps: null,
    mapActionsToProps: (actions: ActionMethodOfAyanami<M, S>) => MA,
  ): ConnectedComponent<P, S, MA>
}

export function connectAyanami<M extends Ayanami<S>, S, P>(
  ayanami: ConstructorOf<M>,
  Component: React.ComponentType<P>,
) {
  return ((
    mapStateToProps?: (props: S) => Partial<P>,
    mapActionsToProps?: (actions: ActionMethodOfAyanami<M, S>) => Partial<P>,
  ) => (props: P) => {
    const [state, action] = (ayanami as ConstructorOfAyanami<M, S>).useHooks<M, S>()
    const mappedState = mapStateToProps ? mapStateToProps(state) : state
    const mappedAction = mapActionsToProps ? mapActionsToProps(action as any) : action

    return <Component {...mappedState} {...mappedAction} {...props} />
  }) as ComponentConnectedWithAyanami<M, S, P>
}

import React, { useContext } from 'react'
import { InjectableFactory } from '@asuka/di'

import { Ayanami, ConstructorOf, ActionOfAyanami, State } from './core'
import { SSRContext } from './ssr/ssr-context'
import { SSRStates } from './ssr/ssr-states'
export type StateSelector<S, U> = {
  (state: S): U
}

export type StateSelectorConfig<S, U> = {
  selector?: StateSelector<S, U>
  defaultState?: S
}

function _useActionsCreator<M extends Ayanami<S>, S = any>(ayanami: M) {
  const appDispatcher = React.useMemo(() => {
    const state = ayanami.state!
    const actionsCreator = ayanami.getActions()
    return Object.keys(actionsCreator).reduce((acc, cur) => {
      acc[cur] = (payload: any) => {
        const action = (actionsCreator as any)[cur](payload)
        state.dispatch(action)
        return action
      }
      return acc
    }, {} as any)
  }, [ayanami])

  return appDispatcher
}

export function useActionsCreator<M extends Ayanami<S>, S = any, U = S>(
  A: ConstructorOf<M>,
  config?: StateSelectorConfig<S, U>,
): ActionOfAyanami<M, S> {
  const { ayanami } = _useState(A, config)
  return _useActionsCreator(ayanami)
}

function _useAyanamiState<S, U = S>(state: State<S>, selector?: StateSelector<S, U>): S | U {
  const [appState, setState] = React.useState(() => {
    const initialState = state.getState()
    return selector ? selector(initialState) : initialState
  })

  const stateObserver = React.useCallback((s: S) => setState(selector ? selector(s) : s), [
    selector,
  ])

  // https://reactjs.org/docs/hooks-faq.html#how-do-i-implement-getderivedstatefromprops
  // do not put subscribe in useEffect

  const subscribeFn = React.useCallback(() => {
    state.subscribeState(stateObserver)
  }, [state])
  React.useEffect(() => {
    return () => state.unsubscribe()
  }, [state])

  subscribeFn()
  return appState
}

export function useAyanamiState<S, U = S>(
  A: ConstructorOf<Ayanami<S>>,
  config?: StateSelectorConfig<S, U>,
): S {
  const { state } = _useState(A, config)
  return _useAyanamiState(state)
}

export function useAyanami<M extends Ayanami<S>, S = any>(
  A: ConstructorOf<M>,
): [S, ActionOfAyanami<M, S>]

export function useAyanami<M extends Ayanami<S>, S = any>(
  A: ConstructorOf<M>,
  config: {
    defaultState: S
  },
): [S, ActionOfAyanami<M, S>]

export function useAyanami<M extends Ayanami<S>, S = any, U = any>(
  A: ConstructorOf<M>,
  config: {
    selector: StateSelector<S, U>
  },
): [U, ActionOfAyanami<M, S>]

export function useAyanami<M extends Ayanami<S>, S = any, U = any>(
  A: ConstructorOf<M>,
  config: {
    defaultState: S
    selector: StateSelector<S, U>
  },
): [U, ActionOfAyanami<M, S>]

export function useAyanami<M extends Ayanami<S>, S, U>(
  A: ConstructorOf<M>,
  config?: StateSelectorConfig<S, U>,
): StateSelectorConfig<S, U>['selector'] extends StateSelector<S, infer NewState>
  ? [NewState, ActionOfAyanami<M, S>]
  : [S, ActionOfAyanami<M, S>] {
  const { ayanami, state } = _useState(A, config)
  const appState = _useAyanamiState(state)
  const appDispatcher = _useActionsCreator(ayanami)

  return [appState, appDispatcher]
}

function _useState<M extends Ayanami<S>, S = any, U = S>(
  A: ConstructorOf<M>,
  config?: StateSelectorConfig<S, U>,
): { ayanami: M; state: State<S> } {
  const ssrContext = useContext(SSRContext)
  const ayanami = React.useMemo(() => InjectableFactory.getInstance(A), [A])
  const state = React.useMemo(() => {
    return ssrContext && SSRStates.has(ssrContext)
      ? SSRStates.get(ssrContext)!
      : ayanami.createState()
  }, [ayanami, ssrContext, config?.defaultState])

  return { ayanami, state }
}

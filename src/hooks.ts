import React, { useContext } from 'react'
import { InjectableFactory } from '@asuka/di'

import { Ayanami, ConstructorOf, ActionOfAyanami, State } from './core'
import { SSRContext } from './ssr/ssr-context'
import { SSRStates } from './ssr/ssr-states'
import { SSR_LOADED_KEY } from './ssr/constants'
export type StateSelector<S, U> = {
  (state: S): U
}

export type StateSelectorConfig<S, U> = {
  selector?: StateSelector<S, U>
  defaultState?: (s: S) => S
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

function _useAyanamiState<S, U = S>(
  state: State<S>,
  selector?: StateSelector<S, U>,
  defaultState?: (s: S) => S,
): S | U {
  const [appState, setState] = React.useState(() => {
    let initialState = state.getState()
    if (typeof defaultState === 'function') {
      initialState = defaultState(initialState)
      state.state$.next(initialState)
    }
    return selector && !Reflect.getMetadata(SSR_LOADED_KEY, state)
      ? selector(initialState)
      : initialState
  })

  const stateObserver = React.useCallback((s: S) => {
    if (Reflect.getMetadata(SSR_LOADED_KEY, state)) {
      Reflect.deleteMetadata(SSR_LOADED_KEY, state)
    } else {
      setState(selector ? selector(s) : s)
    }
  }, [])

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

export function useAyanamiState<M extends Ayanami<any>>(
  A: ConstructorOf<M>,
): M extends Ayanami<infer State> ? State : never

export function useAyanamiState<M extends Ayanami<any>, U>(
  A: ConstructorOf<M>,
  config: M extends Ayanami<infer State>
    ? {
        defaultState?: (s: State) => State
        selector: StateSelector<State, U>
      }
    : never,
): M extends Ayanami<infer State>
  ? typeof config['selector'] extends StateSelector<State, infer NewState>
    ? NewState
    : never
  : never

export function useAyanamiState<M extends Ayanami<any>, U>(
  A: ConstructorOf<M>,
  config: M extends Ayanami<infer State>
    ? {
        defaultState: (s: State) => State
      }
    : never,
): M extends Ayanami<infer State> ? State : never

export function useAyanamiState<M extends Ayanami<any>, U>(
  A: ConstructorOf<M>,
  config?: M extends Ayanami<infer S> ? StateSelectorConfig<S, U> : never,
) {
  const { state } = _useState(A, config)
  return _useAyanamiState(state, config?.selector, config?.defaultState)
}

export function useAyanami<M extends Ayanami<any>>(
  A: ConstructorOf<M>,
): M extends Ayanami<infer State> ? [State, ActionOfAyanami<M, State>] : never

export function useAyanami<M extends Ayanami<any>, U>(
  A: ConstructorOf<M>,
  config: M extends Ayanami<infer State>
    ? {
        selector: StateSelector<State, U>
        defaultState?: (s: State) => State
      }
    : never,
): M extends Ayanami<infer State>
  ? typeof config['selector'] extends StateSelector<State, infer NewState>
    ? [NewState, ActionOfAyanami<M, State>]
    : never
  : never

export function useAyanami<M extends Ayanami<any>, U>(
  A: ConstructorOf<M>,
  config: M extends Ayanami<infer State>
    ? {
        defaultState: (s: State) => State
      }
    : never,
): M extends Ayanami<infer State> ? [State, ActionOfAyanami<M, State>] : never

export function useAyanami<M extends Ayanami<S>, U, S>(
  A: ConstructorOf<M>,
  config?: StateSelectorConfig<S, U>,
) {
  const { ayanami, state } = _useState(A, config)
  const appState = _useAyanamiState(state, config?.selector, config?.defaultState)
  const appDispatcher = _useActionsCreator(ayanami)

  return [appState, appDispatcher]
}

function _useState<M extends Ayanami<S>, S = any, U = S>(
  A: ConstructorOf<M>,
  _config?: StateSelectorConfig<S, U>,
): { ayanami: M; state: State<S> } {
  const ssrContext = useContext(SSRContext)
  const ayanami = React.useMemo(() => InjectableFactory.getInstance(A), [A])
  const state = React.useMemo(() => {
    return ssrContext && SSRStates.has(ssrContext)
      ? SSRStates.get(ssrContext)!
      : ayanami.createState()
  }, [ayanami, ssrContext])

  return { ayanami, state }
}

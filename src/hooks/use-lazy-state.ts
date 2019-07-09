import { useCallback, useMemo, useReducer, useRef, useState, Reducer } from 'react'

import { isStateNeedUpdate, observeStateUsage } from '../lazy-state'

export function useLazyState<T>(initialState: T | (() => T)): [T, (state: T) => void] {
  const [, forceUpdate] = useReducer<Reducer<number, void>>((x) => x + 1, 0)
  const [defaultState] = useState<T>(initialState)
  const stateRef = useRef<T>(defaultState)

  const [observedState, getUsedStatePaths] = useMemo(() => observeStateUsage<T>(stateRef.current), [
    stateRef.current,
  ])

  const setState = useCallback(
    (newState: T) => {
      if (isStateNeedUpdate(getUsedStatePaths(), newState, stateRef.current)) {
        forceUpdate()
      }

      stateRef.current = newState
    },
    [stateRef, getUsedStatePaths, forceUpdate],
  )

  return [observedState, setState]
}

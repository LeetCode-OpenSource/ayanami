import { Observable, Subject } from 'rxjs'
import { Reducer } from 'react'
import { map, filter, publishBehavior, refCount, share } from 'rxjs/operators'

export enum StateType {
  Singleton = 'Singleton',
  Transient = 'Transient',
  Scoped = 'Scoped',
}

const SingletonSymbol = Symbol('Singleton')

export type State<S> = {
  state$: Observable<S>
  getState: () => S
  dispatch: <T>(action: Action<T>) => void
  unsubscribe: () => void
}

export type StateCreator<S> = {
  (stateType: typeof StateType.Scoped, scopeKey: symbol, defaltState?: S): State<S>
  (stateType: typeof StateType.Singleton): State<S>
  (stateType: typeof StateType.Transient, defaltState?: S): State<S>
}

export interface Action<T> {
  type: string
  payload: T
}

export type Option<T> = T | undefined

export type Epic<T, State> = (
  action$: Observable<Action<T>>,
  state$: Observable<State>,
) => Observable<Action<unknown>>

function assertExist<S>(value: Option<symbol | S>, msg: string): asserts value is symbol {
  if (!value) {
    throw new TypeError(msg)
  }
}

export function createState<S>(
  defaltState: S,
  reducer: Reducer<S, Action<unknown>>,
  effect: Epic<unknown, S>,
): StateCreator<S> {
  const states = new Map<symbol, S>()
  const effects = new Map<symbol, Observable<Action<unknown>>>()
  const state$ = new Subject<{ scope: symbol; state: S }>()
  const action$ = new Subject<{ scope: symbol; action: Action<unknown> }>()

  const scoped: StateCreator<S> = (
    stateType: StateType,
    scopeKey?: symbol | S,
    stateToOverride?: S,
  ): State<S> => {
    let symbolKey: symbol
    switch (stateType) {
      case StateType.Singleton:
        symbolKey = SingletonSymbol
        break
      case StateType.Scoped:
        assertExist(scopeKey, 'scopeKey must exist when stateType is Scoped')
        symbolKey = scopeKey
        break
      case StateType.Transient:
        symbolKey = Symbol(StateType.Transient)
        stateToOverride = scopeKey as S | undefined
        break
    }
    const firstState = { ...(stateToOverride || defaltState) }
    if (!states.has(symbolKey)) {
      states.set(symbolKey, firstState)
    }

    function dispatch<T>(action: Action<T>) {
      const prevState: S = states.get(symbolKey)!
      const newState = reducer(prevState, action)
      if (newState !== prevState) {
        state$.next({ state: newState, scope: symbolKey })
      }
      states.set(symbolKey, newState)
      action$.next({ scope: symbolKey, action })
    }

    const _action$ = action$.pipe(
      filter(({ scope }) => scope === symbolKey),
      map(({ action }) => action),
      share(),
    )

    const _state$ = state$.pipe(
      filter(({ scope }) => scope === symbolKey),
      map(({ state }) => state),
      publishBehavior(firstState),
      refCount(),
    )
    let effect$: Observable<Action<unknown>>

    if (effects.has(symbolKey)) {
      effect$ = effects.get(symbolKey)!
    } else {
      effect$ = effect(_action$, _state$)
      effects.set(symbolKey, effect$)
    }

    const subscription = effect$.subscribe((action) => {
      dispatch(action)
    })

    return {
      state$: _state$,
      dispatch,
      getState: () => states.get(symbolKey)!,
      unsubscribe: () => subscription.unsubscribe(),
    }
  }
  return scoped
}

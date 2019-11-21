import { Observable, Subject } from 'rxjs'
import produce, { Draft } from 'immer'
import { map, filter, publishBehavior, refCount } from 'rxjs/operators'

export enum StateType {
  Singleton = 'Singleton',
  Transient = 'Transient',
  Scoped = 'Scoped',
}

const SingletonSymbol = Symbol('Singleton')

export type State<S> = {
  state$: Observable<S>
  dispatch: <T>(action: Action<T>) => void
}

export interface Action<T> {
  type: string | symbol
  payload: T
}

export type Option<T> = T | undefined

export type ImmerReducer<S, T> = (prevState: Draft<S>, action: Action<T>) => void

function assertExist<T>(value: Option<T>): asserts value is T {
  if (!value) {
    throw new TypeError('undefiend value')
  }
}

export function createState<S>(defaltState: S, reducer: ImmerReducer<S, unknown>, effect: (action$: Observable<unknown>, state$?: Observable<S>) => Observable<Action<unknown>>) {
  const states = new Map<symbol, S>()
  const state$ = new Subject<{ scope: symbol, state: S }>()
  const action$ = new Subject<{ scope: symbol, action: Action<unknown> }>()

  function scoped(stateType: typeof StateType.Scoped, scopeKey: symbol): State<S>
  function scoped(stateType: typeof StateType.Singleton): State<S>
  function scoped(stateType: typeof StateType.Transient): State<S>
  function scoped(stateType: StateType, scopeKey?: symbol): State<S> {
    let symbolKey: symbol
    const firstState = { ...defaltState }
    switch (stateType) {
      case StateType.Singleton:
        symbolKey = SingletonSymbol
        break
      case StateType.Scoped:
        assertExist(scopeKey)
        symbolKey = scopeKey
        break
      case StateType.Transient:
        symbolKey = Symbol(StateType.Transient)
        break
    }
    states.set(symbolKey, firstState)

    const payload$ = action$.pipe(
      filter(({ scope }) => scope === symbolKey),
      map(({ action }) => action.payload)
    )

    const _state$ = state$.pipe(
      filter(({ scope }) => scope === symbolKey),
      map(({ state }) => state),
      publishBehavior(firstState),
      refCount(),
    )

    const effect$ = effect(payload$, _state$)

    return {
      state$: _state$,
      dispatch: <T>(action: Action<T>) => {
        const prevState = states.get(symbolKey)!
        const newState = produce(prevState, (draft) => reducer(draft, action))
        state$.next({ state: newState, scope: symbolKey })
        action$.next({ scope: symbolKey, action })
      },
    }
  }
  return scoped
}

import { Observable, Subject, noop, BehaviorSubject } from 'rxjs'
import { Reducer } from 'react'

export type State<S> = {
  getState: () => S
  dispatch: <T>(action: Action<T>) => void
  // @internal
  action$: Subject<Action<unknown>>
  // @internal
  state$: Subject<S>
  fork: (defaltStateToOverride?: S) => State<S>
  subscribeState: (observer: (value: S) => void) => void
  subscribeAction: (observer: (action: Action<unknown>) => void) => void
  unsubscribe: () => void
}

export type StateCreator<S> = {
  (defaltState: S): State<S>
}

export interface Action<T = unknown> {
  readonly type: string | symbol
  readonly payload: T
}

export type Option<T> = T | undefined

export type Epic<T, S> = (
  action$: Observable<Action<T>>,
  state$: Observable<S>,
  state: State<S>,
) => Observable<Action<unknown>>

export function createState<S>(
  reducer: Reducer<S, Action<unknown>>,
  effect: Epic<unknown, S>,
): { stateCreator: StateCreator<S>; action$: Observable<Action<unknown>> } {
  const action$ = new Subject<Action<unknown>>()
  const _action$ = new Subject<Action<unknown>>()
  const stateObservers = new Set<(s: S) => void>()
  const actionObservers = new Set<(action: Action<unknown>) => void>()

  function stateCreator(defaltState: S): State<S> {
    const state$ = new BehaviorSubject<S>(defaltState)
    const state: State<S> = Object.create(null)

    function dispatch<T>(action: Action<T>) {
      const prevState: S = state$.getValue()
      const newState = reducer(prevState, action)
      if (newState !== prevState) {
        state$.next(newState)
      }
      action$.next(action)
      _action$.next(action)
    }

    const effect$: Observable<Action<unknown>> = effect(_action$, state$, state)

    const subscription = effect$.subscribe((action) => {
      dispatch(action)
    })

    subscription.add(
      action$.subscribe(
        (action) => {
          for (const observer of actionObservers) {
            observer(action)
          }
        },
        (err: any) => {
          _action$.error(err)
        },
        () => {
          _action$.complete()
        },
      ),
    )

    subscription.add(
      state$.subscribe((state) => {
        for (const observer of stateObservers) {
          observer(state)
        }
      }),
    )

    Object.assign(state, {
      dispatch,
      action$,
      state$,
      getState: () => state$.getValue(),
      fork: (defaltStateToOverride?: S) => {
        return createState(reducer, effect).stateCreator(defaltStateToOverride ?? state$.getValue())
      },
      subscribeState: (observer: (value: S) => void) => {
        stateObservers.add(observer)
      },
      subscribeAction: (observer: (action: Action<unknown>) => void) => {
        actionObservers.add(observer)
      },
      unsubscribe: () => {
        stateObservers.clear()
        actionObservers.clear()
      },
      dispose: () => {
        subscription.unsubscribe()
        state.dispatch = noop
      },
    })

    return state
  }
  return { stateCreator, action$ }
}

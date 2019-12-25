import { Observable, Subject, noop, ReplaySubject, Subscription, identity } from 'rxjs'
import { Reducer } from 'react'
import { TERMINATE_ACTION } from '../ssr/terminate'
import { logStateAction } from '../redux-devtools-extension'

export type State<S> = {
  getState: () => S
  dispatch: <T>(action: Action<T>) => void
  // @internal
  state$: Subject<S>
  subscribeState: (observer: (value: S) => void) => () => void
  subscribeAction: (observer: (action: Action<unknown>) => void) => () => void
  unsubscribe: () => void
}

export type StateCreator<S> = {
  (
    defaultState: S,
    middleware?: (effect$: Observable<Action<unknown>>) => Observable<Action<unknown>>,
    loadFromSSR?: boolean,
  ): // @internal
  State<S>
}

export interface Action<T = unknown> {
  readonly type: string | symbol
  readonly payload: T
  // @internal
  readonly state: State<any>
}

export type Option<T> = T | undefined

export type Epic<T> = (
  action$: Observable<Action<T>>,
  loadFromSSR: boolean,
) => Observable<Action<unknown>>

export function createState<S>(
  reducer: Reducer<S, Action<unknown>>,
  effect: Epic<unknown>,
): {
  stateCreator: StateCreator<S>
  action$: Observable<Action<unknown>>
  state$: ReplaySubject<S>
} {
  const action$ = new Subject<Action<unknown>>()
  const _action$ = new Subject<Action<unknown>>()
  const stateObservers = new Set<(s: S) => void>()
  const actionObservers = new Set<(action: Action<unknown>) => void>()
  const state$ = new ReplaySubject<S>(1)

  function stateCreator(
    defaultState: S,
    middleware: (effect$: Observable<Action<unknown>>) => Observable<Action<unknown>> = identity,
    loadFromSSR = false,
  ): State<S> {
    const state: State<S> = Object.create(null)
    let appState = defaultState

    function dispatch<T>(action: Action<T>) {
      if (action.state !== state && action.type !== TERMINATE_ACTION.type) {
        action.state.dispatch(action)
        return
      }
      const prevState: S = appState
      const newState = reducer(prevState, action)
      if (newState !== prevState) {
        state$.next(newState)
      }
      logStateAction(action)
      action$.next(action)
      _action$.next(action)
    }

    const effect$: Observable<Action<unknown>> = effect(_action$, loadFromSSR)

    const subscription = new Subscription()

    subscription.add(
      middleware(effect$).subscribe(
        (action) => {
          try {
            dispatch(action)
          } catch (e) {
            action$.error(e)
          }
        },
        (err) => {
          console.error(err)
        },
      ),
    )

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
        appState = state
        for (const observer of stateObservers) {
          observer(state)
        }
      }),
    )

    state$.next(defaultState)

    Object.assign(state, {
      dispatch,
      state$,
      getState: () => appState,
      subscribeState: (observer: (value: S) => void) => {
        stateObservers.add(observer)
        return () => stateObservers.delete(observer)
      },
      subscribeAction: (observer: (action: Action<unknown>) => void) => {
        actionObservers.add(observer)
        return () => actionObservers.delete(observer)
      },
      unsubscribe: () => {
        action$.complete()
        state$.complete()
        subscription.unsubscribe()
        state.dispatch = noop
        stateObservers.clear()
        actionObservers.clear()
      },
    })
    return state
  }
  return { stateCreator, action$, state$ }
}

import { BehaviorSubject, Observable } from 'rxjs'

export interface State<S> {
  getState(): S
  setState(state: S): void
  state$: Observable<S>
}

export function createState<S>(defaultState: S): State<S> {
  const _state$ = new BehaviorSubject<S>(defaultState)

  return {
    getState() {
      return _state$.getValue()
    },
    setState(state: S) {
      _state$.next(state)
    },
    state$: _state$.asObservable(),
  }
}

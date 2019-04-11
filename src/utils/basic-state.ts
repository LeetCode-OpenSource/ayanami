import { BehaviorSubject, Observable } from 'rxjs'

const shallowequal = require('shallowequal')

export class BasicState<S> {
  readonly state$: Observable<S>

  readonly getState: () => Readonly<S>

  readonly setState: (state: Partial<S>) => void

  constructor(defaultState: S) {
    const state$ = new BehaviorSubject<S>(defaultState)

    this.getState = () => state$.getValue()

    this.setState = (state: Partial<S>) => {
      const currentState = this.getState()
      const nextState = { ...currentState, ...state }

      if (!shallowequal(currentState, nextState)) {
        state$.next(nextState)
      }
    }

    this.state$ = state$.asObservable()
  }
}

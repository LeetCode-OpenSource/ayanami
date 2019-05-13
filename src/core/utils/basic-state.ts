import { BehaviorSubject, Observable } from 'rxjs'

const shallowequal = require('shallowequal')

export class BasicState<S> {
  readonly state$: Observable<S>

  readonly getState: () => Readonly<S>

  readonly setState: (state: Readonly<S>) => void

  constructor(defaultState: S) {
    const state$ = new BehaviorSubject<S>(defaultState)

    this.getState = () => state$.getValue()

    this.setState = (nextState: Readonly<S>) => {
      if (!shallowequal(this.getState(), nextState)) {
        state$.next(nextState)
      }
    }

    this.state$ = state$.asObservable()
  }
}

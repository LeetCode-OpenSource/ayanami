import { BehaviorSubject, Observable } from 'rxjs'
import { share, distinctUntilChanged } from 'rxjs/operators'
import shallowequal from 'shallowequal'

export class BasicState<S> {
  readonly state$: Observable<S>

  readonly getState: () => Readonly<S>

  readonly setState: (state: Partial<S>) => void

  constructor(defaultState: S) {
    const state$ = new BehaviorSubject<S>(defaultState)

    this.getState = () => state$.getValue()

    this.setState = (state: Partial<S>) => {
      state$.next({ ...this.getState(), ...state })
    }

    this.state$ = state$.pipe(
      distinctUntilChanged(shallowequal),
      share(),
    )
  }
}

export function createState<S>(defaultState: S) {
  return new BasicState(defaultState)
}

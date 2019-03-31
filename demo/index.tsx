import React from 'react'
import ReactDOM from 'react-dom'
import { Observable } from 'rxjs'
import { map, withLatestFrom } from 'rxjs/operators'

import { Ayanami, Effect, EffectAction, Reducer } from '../src'

interface State {
  count: number
}

class Count extends Ayanami<State> {
  defaultState = {
    count: 0,
  }

  @Reducer()
  add(count: number, state: State) {
    return { count: state.count + count }
  }

  @Effect()
  minus(count$: Observable<number>, state$: Observable<State>): Observable<EffectAction> {
    return count$.pipe(
      withLatestFrom(state$),
      map(([subCount, state]) => this.setStateAction({ count: state.count - subCount })),
    )
  }
}

function CountComponent() {
  const [state, actions] = Count.useHooks()

  const add = (count: number) => () => actions.add(count)
  const minus = (count: number) => () => actions.minus(count)

  return (
    <div>
      <p>
        current count is <span>{state.count}</span>
      </p>
      <button id="add" onClick={add(1)}>
        add one
      </button>
      <button id="minus" onClick={minus(1)}>
        minus one
      </button>
    </div>
  )
}

ReactDOM.render(<CountComponent />, document.querySelector('#app'))

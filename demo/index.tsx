import React from 'react'
import ReactDOM from 'react-dom'
import { Observable, of } from 'rxjs'
import { mergeMap } from 'rxjs/operators'

import { Ayanami, Effect, EffectAction, Reducer } from '../src'

interface State {
  count: number
}

interface TipsState {
  tips: string
}

class Tips extends Ayanami<TipsState> {
  defaultState = {
    tips: '',
  }

  @Reducer()
  showTips(tips: string) {
    return { tips }
  }
}

class Count extends Ayanami<State> {
  defaultState = {
    count: 0,
  }

  @Reducer()
  add(count: number, state: State) {
    return { count: state.count + count }
  }

  @Reducer()
  reset() {
    return { count: 0 }
  }

  @Effect()
  minus(count$: Observable<number>): Observable<EffectAction> {
    return count$.pipe(
      mergeMap((subCount) =>
        of(
          Count.getActions().add(-subCount),
          Tips.getActions().showTips(`click minus button at ${Date.now()}`),
        ),
      ),
    )
  }
}

function CountComponent() {
  const [{ count }, actions] = Count.useHooks()
  const [{ tips }] = Tips.useHooks()

  const add = (count: number) => () => actions.add(count)
  const minus = (count: number) => () => actions.minus(count)

  return (
    <div>
      <p>count: {count}</p>
      <p>tips: {tips}</p>
      <button onClick={add(1)}>add one</button>
      <button onClick={minus(1)}>minus one</button>
      <button onClick={actions.reset}>reset to zero</button>
    </div>
  )
}

ReactDOM.render(<CountComponent />, document.querySelector('#app'))

import React from 'react'
import ReactDOM from 'react-dom'
import { Observable, of } from 'rxjs'
import { mergeMap } from 'rxjs/operators'

import {
  Ayanami,
  Effect,
  Module,
  Action,
  Reducer,
  useAyanami,
  useAyanamiState,
  initDevtool,
} from '../src'

interface State {
  count: number
}

interface TipsState {
  tips: string
}

@Module('Tips')
class Tips extends Ayanami<TipsState> {
  defaultState = {
    tips: '',
  }

  @Reducer()
  showTips(state: TipsState, tips: string): TipsState {
    return { ...state, tips }
  }
}

@Module('Count')
class Count extends Ayanami<State> {
  defaultState = {
    count: 0,
  }

  otherProps = ''

  constructor(private readonly tips: Tips) {
    super()
  }

  @Reducer()
  add(state: State, count: number): State {
    return { count: state.count + count }
  }

  @Reducer()
  addOne(state: State): State {
    return { count: state.count + 1 }
  }

  @Reducer()
  reset(): State {
    return { count: 0 }
  }

  @Effect()
  minus(count$: Observable<number>): Observable<Action> {
    return count$.pipe(
      mergeMap((subCount) =>
        of(
          this.getActions().add(-subCount),
          this.tips.getActions().showTips(`click minus button at ${Date.now()}`),
        ),
      ),
    )
  }
}

function CountComponent() {
  const [{ count }, actions] = useAyanami(Count)
  const { tips } = useAyanamiState(Tips)

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

initDevtool()

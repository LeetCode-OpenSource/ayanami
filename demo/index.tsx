import React, { useCallback } from 'react'
import ReactDOM from 'react-dom'
import { Observable, of } from 'rxjs'
import { mergeMap } from 'rxjs/operators'

import { Ayanami, Effect, Module, Reducer, useAyanami, useAyanamiState, initDevtool } from '../src'

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
  showTips(state: TipsState, tips: string) {
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
  add(state: State, count: number) {
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
  minus(count$: Observable<number>) {
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

  const add = useCallback((count: number) => () => actions.add(count), [])
  const minus = useCallback((count: number) => () => actions.minus(count), [])
  const reset = useCallback(() => {
    actions.reset()
  }, [])

  return (
    <div>
      <p>count: {count}</p>
      <p>tips: {tips}</p>
      <button onClick={add(1)}>add one</button>
      <button onClick={minus(1)}>minus one</button>
      <button onClick={reset}>reset to zero</button>
    </div>
  )
}

ReactDOM.render(<CountComponent />, document.querySelector('#app'))

initDevtool()

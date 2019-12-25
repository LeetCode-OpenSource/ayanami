import React, { useCallback } from 'react'
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
  AsyncGeneratorEffect,
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

  @AsyncGeneratorEffect.Switch()
  async *plus(count: number) {
    await this.delay(300)
    yield this.getActions().add(count)
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

  private delay(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time))
  }
}

function CountComponent() {
  const [{ count }, actions] = useAyanami(Count)
  const { tips } = useAyanamiState(Tips)

  const reset = useCallback(() => {
    actions.reset()
  }, [])
  const add = useCallback((count: number) => () => actions.add(count), [])
  const minus = useCallback((count: number) => () => actions.minus(count), [])
  const plus = useCallback(() => {
    actions.plus(1)
  }, [])

  return (
    <div>
      <p>count: {count}</p>
      <p>tips: {tips}</p>
      <button onClick={add(1)}>add one</button>
      <button onClick={plus}>async add one</button>
      <button onClick={minus(1)}>minus one</button>
      <button onClick={reset}>reset to zero</button>
    </div>
  )
}

ReactDOM.render(<CountComponent />, document.querySelector('#app'))

initDevtool()

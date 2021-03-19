import { Injectable } from '@asuka/di'
import React from 'react'
import ReactDOM from 'react-dom'
import { Observable, of } from 'rxjs'
import { mergeMap } from 'rxjs/operators'

import { Ayanami, Effect, EffectAction, Reducer, useAyanami } from '../src'

interface State {
  count: number
  input: string
}

interface TipsState {
  tips: string
}

@Injectable()
class Tips extends Ayanami<TipsState> {
  defaultState = {
    tips: '',
  }

  @Reducer()
  showTips(state: TipsState, tips: string): TipsState {
    return { ...state, tips }
  }
}

@Injectable()
class Count extends Ayanami<State> {
  defaultState = {
    count: 0,
    input: '',
  }

  otherProps = ''

  constructor(private readonly tips: Tips) {
    super()
  }

  @Reducer()
  add(state: State, count: number): State {
    return { ...state, count: state.count + count }
  }

  @Reducer()
  addOne(state: State): State {
    return { ...state, count: state.count + 1 }
  }

  @Reducer()
  reset(): State {
    return { count: 0, input: '' }
  }

  @Reducer()
  changeInput(state: State, value: string): State {
    return { ...state, input: value }
  }

  @Effect()
  minus(count$: Observable<number>): Observable<EffectAction> {
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

const InputComponent = React.memo(() => {
  const [input, actions] = useAyanami(Count, { selector: (state) => state.input })

  return (
    <div>
      <h3>{input}</h3>
      <input value={input} onChange={(e) => actions.changeInput(e.target.value)} />
    </div>
  )
})
InputComponent.displayName = 'InputComponent'

function CountComponent() {
  const [{ count, input }, actions] = useAyanami(Count)
  const [{ tips }] = useAyanami(Tips)

  const add = (count: number) => () => actions.add(count)
  const minus = (count: number) => () => actions.minus(count)

  return (
    <div>
      <p>count: {count}</p>
      <p>input: {input}</p>
      <p>tips: {tips}</p>
      <button onClick={add(1)}>add one</button>
      <button onClick={minus(1)}>minus one</button>
      <button onClick={actions.reset}>reset</button>
      <InputComponent />
    </div>
  )
}

ReactDOM.render(<CountComponent />, document.querySelector('#app'))

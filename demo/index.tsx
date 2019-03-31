import React from 'react'
import ReactDOM from 'react-dom'
import { Observable, of } from 'rxjs'
import { map, mergeMap, withLatestFrom } from 'rxjs/operators'

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
  showTipsWithReducer(tips: string) {
    return { tips }
  }

  @Effect()
  showTipsWithEffectAction(tips$: Observable<string>): Observable<EffectAction> {
    return tips$.pipe(map((tips) => this.getActions().showTipsWithReducer(tips)))
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

  @Effect()
  minus(count$: Observable<number>, state$: Observable<State>): Observable<EffectAction> {
    return count$.pipe(
      withLatestFrom(state$),
      mergeMap(([subCount, state]) =>
        of(
          this.setStateAction({ count: state.count - subCount }),
          Tips.shared()
            .getActions()
            .showTipsWithEffectAction(`click minus button at ${Date.now()}`),
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

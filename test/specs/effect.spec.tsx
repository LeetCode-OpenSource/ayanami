import * as React from 'react'
import { Observable, of } from 'rxjs'
import { act, create } from 'react-test-renderer'
import { map, mergeMap, withLatestFrom } from 'rxjs/operators'

import { Ayanami, Effect, EffectAction, Reducer } from '../../src'

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

interface CountState {
  count: number
}

enum CountAction {
  ADD = 'add',
  MINUS = 'minus',
}

class Count extends Ayanami<CountState> {
  defaultState = {
    count: 0,
  }

  @Effect()
  add(count$: Observable<number>, state$: Observable<CountState>): Observable<EffectAction> {
    return count$.pipe(
      withLatestFrom(state$),
      mergeMap(([addCount, state]) =>
        of(
          this.setStateAction({ count: state.count + addCount }),
          Tips.shared()
            .getActions()
            .showTipsWithReducer(`add ${addCount}`),
        ),
      ),
    )
  }

  @Effect()
  minus(count$: Observable<number>, state$: Observable<CountState>): Observable<EffectAction> {
    return count$.pipe(
      withLatestFrom(state$),
      mergeMap(([subCount, state]) =>
        of(
          this.setStateAction({ count: state.count - subCount }),
          Tips.shared()
            .getActions()
            .showTipsWithEffectAction(`minus ${subCount}`),
        ),
      ),
    )
  }
}

function EffectDemo() {
  const [{ count }, actions] = Count.useHooks()
  const [{ tips }] = Tips.useHooks()

  const add = (count: number) => () => actions.add(count)
  const minus = (count: number) => () => actions.minus(count)

  return (
    <div>
      <p>count: {count}</p>
      <p>tips: {tips}</p>
      <button id={CountAction.ADD} onClick={add(1)}>
        add one
      </button>
      <button id={CountAction.MINUS} onClick={minus(1)}>
        minus one
      </button>
    </div>
  )
}

describe('Effect spec:', () => {
  const testRenderer = create(<EffectDemo />)

  // https://github.com/facebook/react/issues/14050 to trigger useEffect manually
  testRenderer.update(<EffectDemo />)

  const count = () => Count.shared().getState().count
  const tips = () => Tips.shared().getState().tips

  const click = (action: CountAction) =>
    act(() => testRenderer.root.findByProps({ id: action }).props.onClick())

  describe('Emitted EffectAction will trigger corresponding Action', () => {
    it('Reducer Action', () => {
      click(CountAction.ADD)
      expect(count()).toBe(1)
      expect(tips()).toBe('add 1')
    })

    it('Effect Action', () => {
      click(CountAction.MINUS)
      expect(count()).toBe(0)
      expect(tips()).toBe('minus 1')
    })
  })
})

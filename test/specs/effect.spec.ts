import { Observable, of } from 'rxjs'
import { map, mergeMap, withLatestFrom } from 'rxjs/operators'

import { Ayanami, Effect, EffectAction, Reducer, getAllActionsForTest } from '../../src'

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
    return tips$.pipe(map((tips) => Tips.getActions().showTipsWithReducer(tips)))
  }
}

interface CountState {
  count: number
}

class Count extends Ayanami<CountState> {
  defaultState = {
    count: 0,
  }

  @Reducer()
  setCount(count: number) {
    return { count }
  }

  @Effect()
  add(count$: Observable<number>, state$: Observable<CountState>): Observable<EffectAction> {
    return count$.pipe(
      withLatestFrom(state$),
      mergeMap(([addCount, state]) =>
        of(
          Count.getActions().setCount(state.count + addCount),
          Tips.getActions().showTipsWithReducer(`add ${addCount}`),
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
          Count.getActions().setCount(state.count - subCount),
          Tips.getActions().showTipsWithEffectAction(`minus ${subCount}`),
        ),
      ),
    )
  }

  @Effect()
  error(payload$: Observable<void>) {
    return payload$.pipe(
      map(() => {
        throw new Error('error!')
      }),
    )
  }
}

describe('Effect spec:', () => {
  const countActions = getAllActionsForTest(Count)

  const count = () => Count.getState().count
  const tips = () => Tips.getState().tips

  describe('Emitted EffectAction will trigger corresponding Action', () => {
    it('Reducer Action', () => {
      countActions.add(1)
      expect(count()).toBe(1)
      expect(tips()).toBe('add 1')
    })

    it('Effect Action', () => {
      countActions.minus(1)
      expect(count()).toBe(0)
      expect(tips()).toBe('minus 1')
    })
  })

  describe('Error handles', () => {
    it(`Error won't affect the main state$`, () => {
      countActions.error()
      countActions.add(1)
      countActions.minus(1)
      countActions.minus(1)
      expect(count()).toBe(-1)
    })
  })
})

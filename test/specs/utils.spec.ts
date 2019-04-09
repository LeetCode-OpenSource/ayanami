import { Observable } from 'rxjs'
import { map, withLatestFrom } from 'rxjs/operators'

import { Ayanami, Reducer, Effect, EffectAction, getAllActionsForTest } from '../../src'
import { sharedAyanami, copyAyanami } from '../../src/utils'

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
      map(([addCount, state]) => this.getActions().setCount(state.count + addCount)),
    )
  }
}

describe('utils specs:', () => {
  describe('copyAyanami', () => {
    it('should be the instance of Constructor', () => {
      const count = copyAyanami(Count)
      expect(count).toBeInstanceOf(Count)
    })

    it('Reducer should isolated from each copies', () => {
      const count1 = copyAyanami(Count)
      const count2 = copyAyanami(Count)

      const count1Actions = getAllActionsForTest(count1)
      const count2Actions = getAllActionsForTest(count2)

      count1Actions.setCount(1)
      count2Actions.setCount(2)

      expect(count1.getState()).toEqual({ count: 1 })
      expect(count2.getState()).toEqual({ count: 2 })
    })

    it('Effect should isolated from each copies', () => {
      const count1 = copyAyanami(Count)
      const count2 = copyAyanami(Count)

      const count1Actions = getAllActionsForTest(count1)
      const count2Actions = getAllActionsForTest(count2)

      count1Actions.add(10)
      count2Actions.add(20)

      expect(count1.getState()).toEqual({ count: 10 })
      expect(count2.getState()).toEqual({ count: 20 })
    })
  })
  it('sharedAyanami: always return same instance', () => {
    expect(sharedAyanami(Count)).toBe(sharedAyanami(Count))
  })
})

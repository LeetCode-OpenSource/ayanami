import { Observable } from 'rxjs'
import { map, withLatestFrom } from 'rxjs/operators'
import { Injectable } from '@asuka/di'

import { Ayanami, Reducer, Effect, EffectAction, getAllActionsForTest } from '../../src'
import { copyAyanami } from '../../src/utils/copy-ayanami'
import { BasicState, getInstance } from '../../src/utils'

interface CountState {
  count: number
}

@Injectable()
class Tips {}

@Injectable()
class Count extends Ayanami<CountState> {
  defaultState = {
    count: 0,
  }

  constructor(readonly tips: Tips) {
    super()
  }

  @Reducer()
  resetCount(state: CountState, count: number = 0): CountState {
    return { ...state, count }
  }

  @Effect()
  add(count$: Observable<number>, state$: Observable<CountState>): Observable<EffectAction> {
    return count$.pipe(
      withLatestFrom(state$),
      map(([addCount, state]) => this.getActions().resetCount(state.count + addCount)),
    )
  }
}

describe('utils specs:', () => {
  describe('copyAyanami', () => {
    it('should be the instance of Constructor', () => {
      const count = copyAyanami(Count)
      expect(count).toBeInstanceOf(Count)
    })

    it('always return new instance', () => {
      const count = copyAyanami(Count)
      expect(count === copyAyanami(Count)).toBeFalsy()
    })

    it('custom providers work properly', () => {
      class NewTips {}

      const count = copyAyanami(Count, { providers: [{ provide: Tips, useClass: NewTips }] })
      expect(count.tips).toBeInstanceOf(NewTips)
    })

    it('Reducer should isolated from each copies, pattern is irrelevant', () => {
      const count1 = copyAyanami(Count)
      const count2 = copyAyanami(Count)

      const count1Actions = getAllActionsForTest(count1)
      const count2Actions = getAllActionsForTest(count2)

      count1Actions.resetCount(1)
      count2Actions.resetCount(2)

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

  describe('getInstance', () => {
    it('for Singleton, always return same instance', () => {
      @Injectable()
      class A extends Ayanami<{}> {
        defaultState = {}
      }

      const a1 = getInstance(A)

      expect(a1).toBeInstanceOf(A)

      @Injectable()
      // make sure add new providers won't affect get same instance
      // see https://github.com/LeetCode-OpenSource/asuka/pull/3
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class B extends Ayanami<{}> {
        defaultState = {}
      }

      expect(a1).toBe(getInstance(A))
    })
  })

  describe('BasicState', () => {
    let state: BasicState<{ count: number }>

    beforeEach(() => {
      state = new BasicState({ count: 0 })
    })

    it('getState should return current state', () => {
      expect(state.getState()).toEqual({ count: 0 })
    })

    it('setState should update current state', () => {
      state.setState({ count: 20 })
      expect(state.getState()).toEqual({ count: 20 })
    })

    describe('state$', () => {
      it('should push current state when subscribe', () => {
        const spy = jest.fn()
        state.state$.subscribe(spy)
        expect(spy.mock.calls.length).toBe(1)
        expect(spy.mock.calls[0][0]).toEqual({ count: 0 })
      })

      it('should push state when state changed', () => {
        const spy = jest.fn()
        state.state$.subscribe(spy)
        state.setState({ count: 10 })
        expect(spy.mock.calls.length).toBe(2)
        expect(spy.mock.calls[1][0]).toEqual({ count: 10 })
      })

      it('should not push state when set same state', () => {
        const spy = jest.fn()
        state.state$.subscribe(spy)
        state.setState({ count: 0 })
        expect(spy.mock.calls.length).toBe(1)
      })
    })
  })
})

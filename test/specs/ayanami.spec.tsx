import { Observable } from 'rxjs'
import { map, withLatestFrom } from 'rxjs/operators'

import { Ayanami, Effect, EffectAction, Reducer } from '../../src'

interface CountState {
  count: number
}

class Count extends Ayanami<CountState> {
  defaultState = {
    count: 0,
  }

  @Reducer()
  add(count: number, state: CountState) {
    return { count: state.count + count }
  }

  @Effect()
  minus(count$: Observable<number>, state$: Observable<CountState>): Observable<EffectAction> {
    return count$.pipe(
      withLatestFrom(state$),
      map(([subCount, state]) => this.setStateAction({ count: state.count - subCount })),
    )
  }
}

describe('Ayanami spec:', () => {
  describe('static methods', () => {
    it('shared: return same instance', () => {
      expect(Count.shared()).toBe(Count.shared())
    })
  })

  describe('instance methods', () => {
    let count: Count

    beforeEach(() => {
      count = new Count()
    })

    it('getState: should throw errors if not setup', () => {
      expect(() => count.getState()).toThrowError()
    })

    it('state$: should throw errors if not setup', () => {
      const onError = jest.fn()
      count.state$.subscribe({ error: onError })
      expect(onError.mock.calls.length).toBe(1)
    })

    it('setup: should only be executed once when called multiple times', () => {
      const setup = jest.spyOn(count, 'setup')

      count.setup()
      count.setup()
      count.setup()

      expect(setup).toHaveBeenCalledTimes(1)
    })
  })
})

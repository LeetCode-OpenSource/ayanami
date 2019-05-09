import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

import {
  Ayanami,
  Effect,
  EffectAction,
  Reducer,
  DefineAction,
  getAllActionsForTest,
  Singleton,
} from '../../src'

interface CountState {
  count: number
}

@Singleton()
class Count extends Ayanami<CountState> {
  defaultState = {
    count: 0,
  }

  @DefineAction()
  resetCountDown$!: Observable<number>

  @Reducer()
  setCount(state: CountState, count: number): CountState {
    return { ...state, count }
  }

  @Effect()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _(_: Observable<void>): Observable<EffectAction> {
    return this.resetCountDown$.pipe(map((count) => this.getActions().setCount(count)))
  }
}

describe('DefineAction spec:', () => {
  const count = Count.getInstance()
  const countActions = getAllActionsForTest(count)

  const getCount = () => count.getState().count

  it('should setup properly', () => {
    expect(count.resetCountDown$).toBeInstanceOf(Observable)
  })

  it('should trigger action properly', () => {
    countActions.resetCountDown$(22)
    expect(getCount()).toBe(22)
  })
})

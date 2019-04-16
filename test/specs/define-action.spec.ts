import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Injectable } from '@asuka/di'

import {
  Ayanami,
  Effect,
  EffectAction,
  Reducer,
  DefineAction,
  getAllActionsForTest,
  copyAyanami,
} from '../../src'

interface CountState {
  count: number
}

@Injectable()
class Count extends Ayanami<CountState> {
  defaultState = {
    count: 0,
  }

  @DefineAction()
  resetCountDown$!: Observable<number>

  @Reducer()
  setCount(count: number) {
    return { count }
  }

  @Effect()
  _(_: Observable<void>): Observable<EffectAction> {
    return this.resetCountDown$.pipe(map((count) => this.getActions().setCount(count)))
  }
}

describe('DefineAction spec:', () => {
  const count = copyAyanami(Count)
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

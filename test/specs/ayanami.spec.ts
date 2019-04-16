import { Injectable } from '@asuka/di'

import {
  Ayanami,
  Reducer,
  getAllActionsForTest,
  copyAyanami,
  ActionMethodOfAyanami,
} from '../../src'

interface CountState {
  count: number
}

@Injectable()
class CountModel extends Ayanami<CountState> {
  defaultState = { count: 0 }

  @Reducer()
  setCount(count: number): Partial<CountState> {
    return { count }
  }
}

describe('Ayanami specs:', () => {
  let countModel: CountModel
  let actions: ActionMethodOfAyanami<CountModel, CountState>

  beforeEach(() => {
    countModel = copyAyanami(CountModel)
    actions = getAllActionsForTest(countModel)
  })

  it('getState', () => {
    expect(countModel.getState()).toEqual({ count: 0 })
    actions.setCount(10)
    expect(countModel.getState()).toEqual({ count: 10 })
  })

  it('getState$', () => {
    const count$ = countModel.getState$()

    const callback = jest.fn()

    count$.subscribe(callback)

    actions.setCount(44)

    expect(callback.mock.calls.length).toBe(2)
    expect(callback.mock.calls[0][0]).toEqual({ count: 0 })
    expect(callback.mock.calls[1][0]).toEqual({ count: 44 })
  })

  it('destroy', () => {
    countModel.destroy()
    actions.setCount(10)
    expect(countModel.getState()).toEqual({ count: 0 })
  })
})

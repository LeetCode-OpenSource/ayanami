import { Ayanami, Reducer, getAllActionsForTest, copyAyanami } from '../../src'

interface CountState {
  count: number
}

class CountModel extends Ayanami<CountState> {
  defaultState = { count: 0 }

  @Reducer()
  setCount(count: number): Partial<CountState> {
    return { count }
  }
}

describe('Ayanami specs:', () => {
  let countModel: CountModel

  beforeEach(() => {
    countModel = copyAyanami(CountModel)
  })

  it('getState', () => {
    const actions = getAllActionsForTest(countModel)

    expect(countModel.getState()).toEqual({ count: 0 })
    actions.setCount(10)
    expect(countModel.getState()).toEqual({ count: 10 })
  })

  it('getState$', () => {
    const actions = getAllActionsForTest(countModel)
    const count$ = countModel.getState$()

    const callback = jest.fn()

    count$.subscribe(callback)

    actions.setCount(44)

    expect(callback.mock.calls.length).toBe(2)
    expect(callback.mock.calls[0][0]).toEqual({ count: 0 })
    expect(callback.mock.calls[1][0]).toEqual({ count: 44 })
  })
})

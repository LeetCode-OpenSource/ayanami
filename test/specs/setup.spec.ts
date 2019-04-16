import { Injectable } from '@asuka/di'

import { Ayanami, Reducer } from '../../src'
import { setup } from '../../src/utils'

interface CountState {
  count: number
}

describe('setup ayanami specs:', () => {
  it('only setup once', () => {
    @Injectable()
    class CountModel extends Ayanami<CountState> {
      defaultState = { count: 0 }

      @Reducer()
      setCount(count: number): Partial<CountState> {
        return { count }
      }
    }

    const countModel = new CountModel()

    expect(countModel.getState$).toBeUndefined()
    setup(countModel)
    expect(typeof countModel.getState$).toBe('function')

    const getState$ = countModel.getState$
    setup(countModel)
    expect(countModel.getState$).toBe(getState$)
  })
})

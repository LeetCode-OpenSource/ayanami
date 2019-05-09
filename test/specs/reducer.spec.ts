import { Injectable, Test } from '@asuka/di'

import { Ayanami, Reducer, getAllActionsForTest, ActionMethodOfAyanami } from '../../src'

interface TipsState {
  tips: string
}

@Injectable()
class Tips extends Ayanami<TipsState> {
  defaultState = {
    tips: '',
  }

  @Reducer()
  removeTips(): TipsState {
    return { tips: '' }
  }

  @Reducer()
  setTips(state: TipsState, tips: string): TipsState {
    return { ...state, tips }
  }

  @Reducer()
  addTips(state: TipsState, tips: string): TipsState {
    return { ...state, tips: `${state.tips} ${tips}` }
  }
}

describe('Reducer spec:', () => {
  let tips: Tips
  let actions: ActionMethodOfAyanami<Tips, TipsState>

  beforeEach(() => {
    const testModule = Test.createTestingModule().compile()

    tips = testModule.getInstance(Tips)
    actions = getAllActionsForTest(tips)
  })

  it('with payload', () => {
    actions.setTips('one')
    expect(tips.getState()).toEqual({ tips: 'one' })
  })

  it('with payload and state', () => {
    actions.setTips('two')
    actions.addTips('three')
    expect(tips.getState()).toEqual({ tips: 'two three' })
  })

  it('without payload and state', () => {
    actions.setTips('one')
    actions.removeTips()
    expect(tips.getState()).toEqual({ tips: '' })
  })
})

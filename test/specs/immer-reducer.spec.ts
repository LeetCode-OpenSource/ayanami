import { Injectable, Test } from '@asuka/di'
import { Draft } from 'immer'

import { Ayanami, ImmerReducer, getAllActionsForTest, ActionMethodOfAyanami } from '../../src'

interface TipsState {
  tips: string
}

@Injectable()
class Tips extends Ayanami<TipsState> {
  defaultState = {
    tips: '',
  }

  @ImmerReducer()
  removeTips(state: Draft<TipsState>) {
    state.tips = ''
  }

  @ImmerReducer()
  setTips(state: Draft<TipsState>, tips: string) {
    state.tips = tips
  }

  @ImmerReducer()
  addTips(state: Draft<TipsState>, tips: string) {
    state.tips = `${state.tips} ${tips}`
  }
}

describe('ImmerReducer spec:', () => {
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

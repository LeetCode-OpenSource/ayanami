import { Ayanami, Reducer, getAllActionsForTest } from '../../src'

interface TipsState {
  tips: string
}

class Tips extends Ayanami<TipsState> {
  defaultState = {
    tips: '',
  }

  @Reducer()
  removeTips() {
    return { tips: '' }
  }

  @Reducer()
  setTips(tips: string) {
    return { tips }
  }

  @Reducer()
  addTips(tips: string, state: TipsState) {
    return { tips: state.tips + `\n${tips}` }
  }
}

describe('Reducer spec:', () => {
  const tipsActions = getAllActionsForTest(Tips)

  it('with payload', () => {
    tipsActions.setTips('one')
    expect(Tips.getState()).toEqual({ tips: 'one' })
  })

  it('with payload and state', () => {
    tipsActions.addTips('two')
    expect(Tips.getState()).toEqual({ tips: 'one\ntwo' })
  })

  it('without payload and state', () => {
    tipsActions.removeTips()
    expect(Tips.getState()).toEqual({ tips: '' })
  })
})

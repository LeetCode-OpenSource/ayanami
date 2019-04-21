import { Ayanami, Reducer, getAllActionsForTest, Singleton, ActionMethodOfAyanami } from '../../src'
import { copyAyanami } from '../../src/utils/copy-ayanami'

interface TipsState {
  tips: string
}

@Singleton()
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
    return { tips: `${state.tips} ${tips}` }
  }
}

describe('Reducer spec:', () => {
  let tips: Tips
  let actions: ActionMethodOfAyanami<Tips, TipsState>

  beforeEach(() => {
    tips = copyAyanami(Tips)
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

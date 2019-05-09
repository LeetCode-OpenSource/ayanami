import { Subject, NEVER } from 'rxjs'

import '../../src'
import { Ikari } from '../../src/ikari'
import { BasicState } from '../../src/utils'

interface State {
  count: number
}

const getDefineAction = () => {
  const action$ = new Subject()

  return {
    next: (params: any) => action$.next(params),
    observable: action$.asObservable(),
  }
}

const createIkariConfig = () => ({
  nameForLog: 'abc',
  defaultState: { count: 0 },
  effects: { never: () => NEVER },
  reducers: {
    setCount: (state: State, count: number): State => ({ ...state, count }),
  },
  defineActions: { hmm: getDefineAction() },
})

const createIkari = () => new Ikari<State>(createIkariConfig())

describe('Ikari spec:', () => {
  describe('static', () => {
    describe('createAndBindAt', () => {
      it('only create once if call multiple times', () => {
        const target = { defaultState: { count: 0 } }

        const ikari = Ikari.createAndBindAt(target, createIkariConfig())
        expect(ikari).toBe(Ikari.createAndBindAt(target, createIkariConfig()))
      })
    })
  })

  describe('setup', () => {
    const ikari = createIkari()

    it('`setup` actually run once', () => {
      ikari.setup()
      const firstTriggerActions = ikari.triggerActions

      ikari.setup()
      const secondTriggerActions = ikari.triggerActions

      expect(firstTriggerActions).toBe(secondTriggerActions)
    })
  })

  describe('after setup', () => {
    const ikari = createIkari()

    ikari.setup()

    it('state is setup properly', () => {
      expect(ikari.state).toBeInstanceOf(BasicState)
      expect(ikari.state.getState()).toEqual({ count: 0 })
    })

    it('triggerActions is combination of effects, reducers and defineActions', () => {
      expect(Object.keys(ikari.triggerActions).length).toBe(3)
      expect(typeof ikari.triggerActions.never).toBe('function')
      expect(typeof ikari.triggerActions.setCount).toBe('function')
      expect(typeof ikari.triggerActions.hmm).toBe('function')
    })

    it('reducers can change state', () => {
      ikari.triggerActions.setCount(1)
      expect(ikari.state.getState()).toEqual({ count: 1 })
    })
  })

  describe('after destroy', () => {
    const ikari = createIkari()

    ikari.setup()

    expect(ikari.subscription.closed).toBe(false)

    beforeEach(() => {
      ikari.destroy()
    })

    it('should remove all subscription', () => {
      expect(ikari.subscription.closed).toBe(true)
    })

    it('should remove all triggerActions', () => {
      expect(ikari.triggerActions).toEqual({})
    })

    it('should not able to reactive', () => {
      ikari.setup()
      expect(ikari.subscription.closed).toBe(true)
      expect(ikari.triggerActions).toEqual({})
    })
  })
})

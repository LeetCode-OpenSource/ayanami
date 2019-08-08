import { Subject, NEVER } from 'rxjs'
import { Draft } from 'immer'

import '../../src'
import { Ikari, BasicState } from '../../src/core'

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
  immerReducers: {
    immerSetCount: (state: Draft<State>, count: number) => {
      state.count = count
    },
  },
  defineActions: { hmm: getDefineAction() },
  effectActionFactories: {},
})

const createIkari = () => new Ikari<State>(Object.create(null), createIkariConfig())

describe('Ikari spec:', () => {
  describe('static', () => {
    describe('createAndBindAt', () => {
      it('only create once if call multiple times', () => {
        const target = { defaultState: { count: 0 } }

        const ikari = Ikari.createAndBindAt(target as any, createIkariConfig())
        expect(ikari).toBe(Ikari.createAndBindAt(target as any, createIkariConfig()))
      })
    })
  })

  describe('instance', () => {
    const ikari = createIkari()

    it('state is setup properly', () => {
      expect(ikari.state).toBeInstanceOf(BasicState)
      expect(ikari.state.getState()).toEqual({ count: 0 })
    })

    it('triggerActions is combination of effects, reducers, immerReducers and defineActions', () => {
      expect(Object.keys(ikari.triggerActions).length).toBe(4)
      expect(typeof ikari.triggerActions.never).toBe('function')
      expect(typeof ikari.triggerActions.setCount).toBe('function')
      expect(typeof ikari.triggerActions.immerSetCount).toBe('function')
      expect(typeof ikari.triggerActions.hmm).toBe('function')
    })

    it('reducers can change state', () => {
      ikari.triggerActions.setCount(1)
      expect(ikari.state.getState()).toEqual({ count: 1 })
    })

    it('ImmerReducers can change state', () => {
      ikari.triggerActions.immerSetCount(2)
      expect(ikari.state.getState()).toEqual({ count: 2 })
    })
  })

  describe('after destroy', () => {
    const ikari = createIkari()

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
  })
})

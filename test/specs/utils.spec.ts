import { Injectable } from '@asuka/di'

import { Ayanami } from '../../src'
import { BasicState, getInstance } from '../../src/utils'

describe('utils specs:', () => {
  describe('getInstance', () => {
    it('for Singleton, always return same instance', () => {
      @Injectable()
      class A extends Ayanami<{}> {
        defaultState = {}
      }

      const a1 = getInstance(A)

      expect(a1).toBeInstanceOf(A)

      @Injectable()
      // make sure add new providers won't affect get same instance
      // see https://github.com/LeetCode-OpenSource/asuka/pull/3
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class B extends Ayanami<{}> {
        defaultState = {}
      }

      expect(a1).toBe(getInstance(A))
    })
  })

  describe('BasicState', () => {
    let state: BasicState<{ count: number }>

    beforeEach(() => {
      state = new BasicState({ count: 0 })
    })

    it('getState should return current state', () => {
      expect(state.getState()).toEqual({ count: 0 })
    })

    it('setState should update current state', () => {
      state.setState({ count: 20 })
      expect(state.getState()).toEqual({ count: 20 })
    })

    describe('state$', () => {
      it('should push current state when subscribe', () => {
        const spy = jest.fn()
        state.state$.subscribe(spy)
        expect(spy.mock.calls.length).toBe(1)
        expect(spy.mock.calls[0][0]).toEqual({ count: 0 })
      })

      it('should push state when state changed', () => {
        const spy = jest.fn()
        state.state$.subscribe(spy)
        state.setState({ count: 10 })
        expect(spy.mock.calls.length).toBe(2)
        expect(spy.mock.calls[1][0]).toEqual({ count: 10 })
      })

      it('should not push state when set same state', () => {
        const spy = jest.fn()
        state.state$.subscribe(spy)
        state.setState({ count: 0 })
        expect(spy.mock.calls.length).toBe(1)
      })
    })
  })
})

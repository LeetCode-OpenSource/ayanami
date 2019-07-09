import { noop } from 'lodash'

import { observeState } from './observe-state-access'

const symbolKey = Symbol('symbol key')

interface State {
  number: number
  array: number[]
  object: { one: string }
  [symbolKey]: string
  getter: { str: string }
}

describe('observe-state-access', () => {
  describe('return value', () => {
    it('should return a observed state which equal with original one', () => {
      const state = getState()
      const observedState = observeState(state, noop)

      expect(observedState).toEqual(state)
    })
  })

  describe('onAccess callback', () => {
    it('should not trigger callback if no access to observed state', () => {
      const state = getState()
      const spy = jest.fn()

      observeState(state, spy)
      expect(spy.mock.calls).toEqual([])
    })

    it('should work properly when access nested object', () => {
      const state = getState()
      const spy = jest.fn()
      const observedState = observeState(state, spy)

      // noinspection BadExpressionStatementJS
      observedState.object.one
      expect(spy.mock.calls).toEqual([[['object']], [['object', 'one']]])
    })

    it('should work properly when access array', () => {
      const state = getState()
      const spy = jest.fn()
      const observedState = observeState(state, spy)

      // noinspection BadExpressionStatementJS
      observedState.array[1]
      expect(spy.mock.calls).toEqual([[['array']], [['array', '1']]])
    })

    it('should work properly when access by a symbol', () => {
      const state = getState()
      const spy = jest.fn()
      const observedState = observeState(state, spy)

      // noinspection BadExpressionStatementJS
      observedState[symbolKey]
      expect(spy.mock.calls).toEqual([[[symbolKey]]])
    })

    it('should work properly when access a getter', () => {
      const state = getState()
      const spy = jest.fn()
      const observedState = observeState(state, spy)

      // noinspection BadExpressionStatementJS
      observedState.getter.str
      expect(spy.mock.calls).toEqual([[['getter']], [['getter', 'str']]])
    })

    it('should work properly with string type conversion', () => {
      const state = getState()
      const spy = jest.fn()
      const observedState = observeState(state, spy)

      // noinspection BadExpressionStatementJS
      String(observedState.object)
      expect(spy.mock.calls).toEqual([
        [['object']],
        [['object', Symbol.toPrimitive]],
        [['object', 'toString']],
        [['object', Symbol.toStringTag]],
      ])
    })

    it('should work properly with number type conversion', () => {
      const state = getState()
      const spy = jest.fn()
      const observedState = observeState(state, spy)

      // noinspection BadExpressionStatementJS
      Number(observedState.object)
      expect(spy.mock.calls).toEqual([
        [['object']],
        [['object', Symbol.toPrimitive]],
        [['object', 'valueOf']],
        [['object', 'toString']],
        [['object', Symbol.toStringTag]],
      ])
    })
  })

  it('should throw error when try to modify observed state', () => {
    const state = getState()
    const observedState = observeState(state, noop)

    expect(() => (observedState.number = 2)).toThrow()
    expect(() => observedState.array.pop()).toThrow()
    expect(() => (observedState.object.one = 'two')).toThrow()
  })

  it('should work properly when stringify', () => {
    const state = getState()
    const observedState = observeState(state, noop)

    expect(JSON.stringify(state)).toBe(JSON.stringify(observedState))
  })
})

function getState(): State {
  return {
    number: 1,
    array: [1, 2, 3],
    object: { one: 'one' },
    [symbolKey]: 'symbol value',

    getter: {
      get str() {
        return 'getter string'
      },
    },
  }
}

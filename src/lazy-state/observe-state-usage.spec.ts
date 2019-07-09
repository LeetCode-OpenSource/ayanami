import { noop } from 'lodash'

import { observeStateUsage } from './observe-state-usage'

describe('observe-state-usage', () => {
  it('should return a observed state and a function to get used properties keys', () => {
    const state = { one: 1, two: 2 }
    const [observedState, getUsedStatePaths] = observeStateUsage(state)

    expect({ ...observedState }).toEqual(state)
    expect(getUsedStatePaths()).toEqual([['one'], ['two']])
  })

  describe('usedStatePaths', () => {
    it('should contain the used state path', () => {
      const state = { one: 1, two: 2 }
      const [observedState, getUsedStatePaths] = observeStateUsage(state)

      noop(observedState.one)
      expect(getUsedStatePaths()).toEqual([['one']])

      noop(observedState.two)
      expect(getUsedStatePaths()).toEqual([['one'], ['two']])
    })

    it('should ignore unnecessary path', () => {
      const state = { a: { b: { c: 'c' } }, one: { two: { three: 'three' } } }
      const [observedState, getUsedStatePaths] = observeStateUsage(state)

      noop(observedState.a.b.c)
      expect(getUsedStatePaths()).toEqual([['a', 'b', 'c']])

      noop(observedState.one.two)
      expect(getUsedStatePaths()).toEqual([['a', 'b', 'c'], ['one', 'two']])
    })

    it('should return nearest path that need to be compare', () => {
      const state = { a: { b: { c: 'c' } }, one: { two: { three: 'three' } } }
      const [observedState, getUsedStatePaths] = observeStateUsage(state)

      noop(observedState.a.b)
      expect(getUsedStatePaths()).toEqual([['a', 'b']])

      noop(+observedState.a)
      expect(getUsedStatePaths()).toEqual([['a']])

      noop(observedState.one.two.three)
      expect(getUsedStatePaths()).toEqual([['a'], ['one', 'two', 'three']])

      noop(String(observedState.one.two))
      expect(getUsedStatePaths()).toEqual([['a'], ['one', 'two']])

      noop(JSON.stringify(observedState))
      expect(getUsedStatePaths()).toEqual([['a'], ['one']])
    })
  })
})

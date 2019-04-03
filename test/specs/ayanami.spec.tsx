import { Ayanami } from '../../src'

interface CountState {
  count: number
}

class Count extends Ayanami<CountState> {
  defaultState = {
    count: 0,
  }
}

describe('Ayanami spec:', () => {
  describe('static methods', () => {
    it('shared: return same instance', () => {
      expect(Count.shared()).toBe(Count.shared())
    })
  })

  describe('instance methods', () => {
    let count: Count

    beforeEach(() => {
      count = new Count()
    })

    it('getState: should throw errors if not setup', () => {
      expect(() => count.getState()).toThrowError()
    })

    it('state$: should throw errors if not setup', () => {
      const onError = jest.fn()
      count.state$.subscribe({ error: onError })
      expect(onError.mock.calls.length).toBe(1)
    })

    it('setup: should only be executed once when called multiple times', () => {
      const setup = jest.spyOn(count, 'setup')

      count.setup()
      count.setup()
      count.setup()

      expect(setup).toHaveBeenCalledTimes(1)
    })
  })
})

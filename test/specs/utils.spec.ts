import { Ayanami } from '../../src'
import { shared } from '../../src/utils'

interface CountState {
  count: number
}

class Count extends Ayanami<CountState> {
  defaultState = {
    count: 0,
  }
}

describe('utils specs:', () => {
  it('shared: always return same instance', () => {
    expect(shared(Count)).toBe(shared(Count))
  })
})

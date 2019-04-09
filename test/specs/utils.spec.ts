import { Ayanami } from '../../src'
import { sharedAyanami } from '../../src/utils'

interface CountState {
  count: number
}

class Count extends Ayanami<CountState> {
  defaultState = {
    count: 0,
  }
}

describe('utils specs:', () => {
  it('sharedAyanami: always return same instance', () => {
    expect(sharedAyanami(Count)).toBe(sharedAyanami(Count))
  })
})

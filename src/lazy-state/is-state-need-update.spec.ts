import { isStateNeedUpdate } from './is-state-need-update'

class Language {
  constructor(public name: string, public version: string) {}
}

describe('is-state-need-update', () => {
  it(`should return true if used state properties have not the same value`, () => {
    const oldState = {
      color: 'red',
      tags: ['js', 'es6'],
      language: new Language('javascript', 'ECMAScript 6'),
    }
    const newState = {
      color: 'blue',
      tags: ['js', 'es5'],
      language: new Language('javascript', 'ECMAScript 5'),
    }

    expect(isStateNeedUpdate([['color']], oldState, newState)).toBeTruthy()
    expect(isStateNeedUpdate([['language']], oldState, newState)).toBeTruthy()
    expect(isStateNeedUpdate([['tags', '1']], oldState, newState)).toBeTruthy()
    expect(
      isStateNeedUpdate([['language', 'version'], ['language', 'name']], oldState, newState),
    ).toBeTruthy()
  })

  it('should return false if used state properties have the same value', () => {
    const oldState = {
      color: 'red',
      tags: ['js', 'es6'],
      language: new Language('javascript', 'ECMAScript 6'),
    }
    const newState = {
      color: 'blue',
      tags: ['js', 'es5'],
      language: new Language('javascript', 'ECMAScript 5'),
    }

    expect(isStateNeedUpdate([['language', 'name']], oldState, newState)).toBeFalsy()
    expect(isStateNeedUpdate([['tags', '0']], oldState, newState)).toBeFalsy()
  })
})

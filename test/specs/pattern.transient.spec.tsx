import * as React from 'react'
import { act, create, ReactTestRenderer } from 'react-test-renderer'
import { Observable } from 'rxjs'
import { map, withLatestFrom } from 'rxjs/operators'

import { Ayanami, Effect, EffectAction, Reducer, Transient } from '../../src'

interface CountState {
  count: number
}

@Transient()
class Count extends Ayanami<CountState> {
  defaultState = {
    count: 0,
  }

  @Reducer()
  setCount(count: number) {
    return { count }
  }

  @Effect()
  add(count$: Observable<number>, state$: Observable<CountState>): Observable<EffectAction> {
    return count$.pipe(
      withLatestFrom(state$),
      map(([addCount, state]) => this.getActions().setCount(state.count + addCount)),
    )
  }
}

function CountComponent() {
  const [state, actions] = Count.useHooks()

  const add = (count: number) => () => actions.add(count)

  return (
    <div>
      <p>
        current count is <span>{state.count}</span>
      </p>
      <button onClick={add(1)}>add one</button>
    </div>
  )
}

describe('Transient Pattern spec:', () => {
  it('getInstance always return new instance', () => {
    const count = Count.getInstance()

    expect(count).toBeInstanceOf(Count)
    expect(count === Count.getInstance()).toBeFalsy()
  })

  it('Hooks is isolated', () => {
    const renderer1 = create(<CountComponent />)
    const renderer2 = create(<CountComponent />)

    const count = (which: ReactTestRenderer) => which.root.findByType('span').children[0]
    const click = (which: ReactTestRenderer) =>
      act(() => which.root.findByType('button').props.onClick())

    // https://github.com/facebook/react/issues/14050 to trigger useEffect manually
    renderer1.update(<CountComponent />)
    renderer2.update(<CountComponent />)

    click(renderer1)
    expect(count(renderer1)).toBe('1')
    expect(count(renderer2)).toBe('0')

    click(renderer2)
    expect(count(renderer1)).toBe('1')
    expect(count(renderer2)).toBe('1')
  })
})

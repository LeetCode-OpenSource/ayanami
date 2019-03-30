import * as React from 'react'
import { act, create } from 'react-test-renderer'
import { Observable } from 'rxjs'
import { map, withLatestFrom } from 'rxjs/operators'

import { Ayanami, Effect, EffectAction, Reducer } from '../../src'

interface State {
  count: number
}

enum CountAction {
  ADD = 'add',
  MINUS = 'minus',
}

class Count extends Ayanami<State> {
  defaultState = {
    count: 0,
  }

  @Reducer()
  add(count: number, state: State) {
    return { count: state.count + count }
  }

  @Effect()
  minus(count$: Observable<number>, state$: Observable<State>): Observable<EffectAction> {
    return count$.pipe(
      withLatestFrom(state$),
      map(([subCount, state]) => this.setStateAction({ count: state.count - subCount })),
    )
  }
}

function CountComponent() {
  const [state, actions] = Count.useHooks()

  const add = (count: number) => () => actions.add(count)
  const minus = (count: number) => () => actions.minus(count)

  return (
    <div>
      <p>
        current count is <span>{state.count}</span>
      </p>
      <button id={CountAction.ADD} onClick={add(1)}>
        add one
      </button>
      <button id={CountAction.MINUS} onClick={minus(1)}>
        minus one
      </button>
    </div>
  )
}

describe('Hooks spec:', () => {
  const testRenderer = create(<CountComponent />)
  const count = () => testRenderer.root.findByType('span').children[0]
  const click = (action: CountAction) =>
    act(() => testRenderer.root.findByProps({ id: action }).props.onClick())

  // https://github.com/facebook/react/issues/14050 to trigger useEffect manually
  testRenderer.update(<CountComponent />)

  it('default state work properly', () => {
    expect(count()).toBe('0')
  })

  it('Reducer action work properly', () => {
    click(CountAction.ADD)
    expect(count()).toBe('1')
  })

  it('Effect action work properly', () => {
    click(CountAction.MINUS)
    expect(count()).toBe('0')
  })
})

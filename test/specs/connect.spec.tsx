import * as React from 'react'
import { Injectable } from '@asuka/di'
import { act, create } from 'react-test-renderer'
import { Observable } from 'rxjs'
import { map, withLatestFrom } from 'rxjs/operators'

import { Ayanami, Effect, EffectAction, Reducer, ActionMethodOfAyanami } from '../../src'

interface State {
  count: number
}

enum CountAction {
  ADD = 'add',
  MINUS = 'minus',
}

@Injectable()
class Count extends Ayanami<State> {
  defaultState = {
    count: 0,
  }

  @Reducer()
  add(state: State, count: number): State {
    return { ...state, count: state.count + count }
  }

  @Reducer()
  setCount(state: State, count: number): State {
    return { ...state, count }
  }

  @Effect()
  minus(count$: Observable<number>, state$: Observable<State>): Observable<EffectAction> {
    return count$.pipe(
      withLatestFrom(state$),
      map(([subCount, state]) => this.getActions().setCount(state.count - subCount)),
    )
  }
}

type CountComponentProps = State & Pick<ActionMethodOfAyanami<Count, State>, 'add' | 'minus'>

class CountComponent extends React.Component<CountComponentProps> {
  render() {
    return (
      <div>
        <p>
          current count is <span>{this.props.count}</span>
        </p>
        <button id={CountAction.ADD} onClick={this.add(1)}>
          add one
        </button>
        <button id={CountAction.MINUS} onClick={this.minus(1)}>
          minus one
        </button>
      </div>
    )
  }

  private add = (count: number) => () => this.props.add(count)

  private minus = (count: number) => () => this.props.minus(count)
}

const ConnectedCountComponent = Count.connect(CountComponent)(
  ({ count }) => ({ count }),
  ({ add, minus }) => ({ add, minus }),
)

describe('Connect spec:', () => {
  const testRenderer = create(<ConnectedCountComponent />)
  const count = () => testRenderer.root.findByType('span').children[0]
  const click = (action: CountAction) =>
    act(() => testRenderer.root.findByProps({ id: action }).props.onClick())

  // https://github.com/facebook/react/issues/14050 to trigger useEffect manually
  testRenderer.update(<ConnectedCountComponent />)

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

import { Injectable } from '@asuka/di'
import * as React from 'react'
import { act, create, ReactTestInstance, ReactTestRenderer } from 'react-test-renderer'
import { Observable } from 'rxjs'
import { map, withLatestFrom } from 'rxjs/operators'

import { Ayanami, Effect, EffectAction, Reducer, useAyanami, TransientScope } from '../../src'
import { useCallback, useEffect } from 'react'

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

function CountComponent({ scope }: { scope?: any }) {
  const [state, actions] = useAyanami(Count, { scope })

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
  describe('Default behavior', () => {
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

    it('should only render once when update the state right during rendering', () => {
      const spy = jest.fn()
      const TestComponent = () => {
        const [state, actions] = useAyanami(Count, { scope: TransientScope })
        const addOne = useCallback(() => actions.add(1), [])

        if (state.count % 2 === 0) {
          actions.add(1)
        }

        useEffect(() => {
          spy(state.count)
        }, [state.count])

        return (
          <div>
            <p>count: {state.count}</p>
            <button onClick={addOne}>add one</button>
          </div>
        )
      }

      const renderer = create(<TestComponent />)

      // https://github.com/facebook/react/issues/14050 to trigger useEffect manually
      renderer.update(<TestComponent />)
      expect(spy.mock.calls).toEqual([[1]])

      act(() => renderer.root.findByType('button').props.onClick())
      expect(spy.mock.calls).toEqual([[1], [3]])
    })
  })

  describe('Scope behavior', () => {
    describe('Same scope will share state and actions', () => {
      const scope = Symbol('scope')
      let count: () => string | ReactTestInstance
      let click: (action: CountAction) => void

      beforeEach(() => {
        const testRenderer = create(<CountComponent scope={scope} />)

        count = () => testRenderer.root.findByType('span').children[0]
        click = (action: CountAction) =>
          act(() => testRenderer.root.findByProps({ id: action }).props.onClick())

        // https://github.com/facebook/react/issues/14050 to trigger useEffect manually
        testRenderer.update(<CountComponent scope={scope} />)
      })

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

    describe('Different scope will isolate state and actions', () => {
      let count: () => string | ReactTestInstance
      let click: (action: CountAction) => void

      beforeEach(() => {
        const scope = Symbol('scope')
        const testRenderer = create(<CountComponent scope={scope} />)

        count = () => testRenderer.root.findByType('span').children[0]
        click = (action: CountAction) =>
          act(() => testRenderer.root.findByProps({ id: action }).props.onClick())

        // https://github.com/facebook/react/issues/14050 to trigger useEffect manually
        testRenderer.update(<CountComponent scope={scope} />)
      })

      it('Reducer action work properly', () => {
        click(CountAction.ADD)
        expect(count()).toBe('1')
      })

      it('default state work properly', () => {
        expect(count()).toBe('0')
      })

      it('Effect action work properly', () => {
        click(CountAction.MINUS)
        expect(count()).toBe('-1')
      })
    })

    describe('TransientScope will isolate state and actions', () => {
      let count: () => string | ReactTestInstance
      let click: (action: CountAction) => void
      let testRenderer: ReactTestRenderer

      beforeEach(() => {
        testRenderer = create(<CountComponent scope={TransientScope} />)

        count = () => testRenderer.root.findByType('span').children[0]
        click = (action: CountAction) =>
          act(() => testRenderer.root.findByProps({ id: action }).props.onClick())

        // https://github.com/facebook/react/issues/14050 to trigger useEffect manually
        testRenderer.update(<CountComponent scope={TransientScope} />)
      })

      it('Reducer action work properly', () => {
        click(CountAction.ADD)
        expect(count()).toBe('1')
      })

      it('default state work properly', () => {
        expect(count()).toBe('0')
      })

      it('Effect action work properly', () => {
        click(CountAction.MINUS)
        expect(count()).toBe('-1')
      })

      it('should destroy when component unmount', () => {
        const spy = jest.spyOn(Ayanami.prototype, 'destroy')
        act(() => testRenderer.unmount())
        expect(spy.mock.calls.length).toBe(1)
      })
    })

    describe('Dynamic update scope', () => {
      const testRenderer = create(<CountComponent scope={1} />)
      const count = () => testRenderer.root.findByType('span').children[0]
      const click = (action: CountAction) =>
        act(() => testRenderer.root.findByProps({ id: action }).props.onClick())

      it(`should use same Ayanami at each update if scope didn't change`, () => {
        testRenderer.update(<CountComponent scope={1} />)
        click(CountAction.ADD)
        expect(count()).toBe('1')
      })

      it(`should use new scope's Ayanami if scope changed`, () => {
        testRenderer.update(<CountComponent scope={2} />)
        click(CountAction.MINUS)
        expect(count()).toBe('-1')
      })

      it(`should update state to corresponding one`, () => {
        testRenderer.update(<CountComponent scope={1} />)
        expect(count()).toBe('1')
        testRenderer.update(<CountComponent scope={2} />)
        expect(count()).toBe('-1')
        testRenderer.update(<CountComponent scope={3} />)
        expect(count()).toBe('0')
      })
    })
  })
})

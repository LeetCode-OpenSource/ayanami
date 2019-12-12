import 'reflect-metadata'
import { ValueProvider, Inject, InjectableFactory } from '@asuka/di'
import React, { useCallback, useEffect } from 'react'
import { act, create, ReactTestInstance, ReactTestRenderer } from 'react-test-renderer'
import { Observable } from 'rxjs'
import { map, withLatestFrom } from 'rxjs/operators'

import { Ayanami, Effect, Reducer, Action, Module } from '../core'
import { useAyanami, useAyanamiState, useActionsCreator } from '../hooks'

interface State {
  count: number
}

interface SelectedState extends State {
  forkCount?: string
}

enum CountAction {
  ADD = 'add',
  MINUS = 'minus',
}

const numberProvider: ValueProvider = {
  provide: 'token',
  useValue: 0,
}

@Module({
  providers: [numberProvider],
  name: 'Count',
})
class Count extends Ayanami<State> {
  defaultState = {
    count: -1,
  }

  constructor(@Inject(numberProvider.provide) number: number) {
    super()
    this.defaultState.count = number
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
  minus(count$: Observable<number>, state$: Observable<State>): Observable<Action> {
    return count$.pipe(
      withLatestFrom(state$),
      map(([subCount, state]) => this.getActions().setCount(state.count - subCount)),
    )
  }
}

function CountComponent({
  selector = (s: State) => ({ ...s, forkCount: `${s.count}` }),
}: {
  selector?: (s: State) => SelectedState
}) {
  const [state, actions] = useAyanami(Count, {
    selector: selector,
  })

  const add = (count: number) => () => actions.add(count)
  const minus = (count: number) => () => actions.minus(count)

  return (
    <div>
      <p>
        current count is <span>{state.count}</span>
      </p>
      <p>
        forked count is <span>{state.forkCount}</span>
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

function SeparateHooks({ selector }: { selector?: (s: State) => SelectedState }) {
  const state = useAyanamiState(Count, { selector: selector! })
  const actions = useActionsCreator(Count, { selector })

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
  afterEach(() => {
    InjectableFactory.reset()
    InjectableFactory.addProviders(Count, numberProvider)
  })
  ;[
    {
      name: 'useAyanami',
      Component: CountComponent,
    },
    {
      name: 'use separate hooks',
      Component: SeparateHooks,
    },
  ].forEach((meta) => {
    describe(`${meta.name} default behavior`, () => {
      let testRenderer: ReactTestRenderer
      let count: () => ReactTestInstance | string
      let click: (action: CountAction) => void

      beforeEach(() => {
        testRenderer = create(<meta.Component />)
        count = () => testRenderer.root.findAllByType('span')[0].children[0]
        click = (action: CountAction) =>
          act(() => {
            testRenderer.root.findByProps({ id: action }).props.onClick()
          })
        // https://github.com/facebook/react/issues/14050 to trigger useEffect manually
        testRenderer.update(<meta.Component />)
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
        expect(count()).toBe('-1')
      })

      it('should only render once when update the state right during rendering', () => {
        const spy = jest.fn()
        const TestComponent = () => {
          const [state, actions] = useAyanami(Count)
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

        act(() => {
          renderer.root.findByType('button').props.onClick()
        })
        expect(spy.mock.calls).toEqual([[1], [3]])
      })
    })
  })
})

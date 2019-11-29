import 'reflect-metadata'
import React, { useEffect } from 'react'
import { useAyanami, useAyanamiState, useAyanamiDispatchers } from '../hooks'
import { Ayanami, Effect, ImmerReducer, Action, Module } from '../core'
import { Observable } from 'rxjs'
import { map, withLatestFrom, delay } from 'rxjs/operators'
import { Draft } from 'immer'
import { act, create, ReactTestRenderer } from 'react-test-renderer'
import { InjectableFactory } from '@asuka/di'
import Sinon from 'sinon'

interface CountState {
  count: number
}

const ASYNC_DELAY_TIME = 1000

@Module('CountModule')
class CountModule extends Ayanami<CountState> {
  defaultState = {
    count: 0,
  }

  @ImmerReducer()
  setCount(state: Draft<CountState>, payload: number) {
    state.count = payload
  }

  @Effect()
  addCount(payload$: Observable<void>, state$: Observable<CountState>): Observable<Action> {
    return payload$.pipe(
      withLatestFrom(state$),
      map(([, state]) => this.getActions().setCount(state.count + 1)),
    )
  }

  @Effect()
  addCountAsync(payload$: Observable<void>, state$: Observable<CountState>): Observable<Action> {
    return payload$.pipe(
      delay(ASYNC_DELAY_TIME),
      withLatestFrom(state$),
      map(([, state]) => this.getActions().setCount(state.count + 1)),
    )
  }
}

describe('Hooks specs: useAyanami', () => {
  const SimpleComponent = () => {
    const [state, actions] = useAyanami(CountModule)

    return (
      <div>
        <span>{state.count}</span>
        <button id="add-count" onClick={actions.addCount}>
          +
        </button>
        <button id="add-count-async" onClick={actions.addCountAsync}>
          +
        </button>
        <button id="set-count" onClick={() => actions.setCount(10)}>
          set
        </button>
      </div>
    )
  }

  let testRenderer: ReactTestRenderer
  let getCount: () => number
  let timer: Sinon.SinonFakeTimers

  beforeEach(() => {
    timer = Sinon.useFakeTimers()
    testRenderer = create(<SimpleComponent />)
    getCount = () =>
      parseInt(testRenderer.root.find((instance) => instance.type === 'span').children[0] as string)
  })

  afterEach(() => {
    timer.restore()
    InjectableFactory.reset()
    InjectableFactory.addProviders(CountModule)
  })

  it('should render correct state', () => {
    expect(getCount()).toBe(0)
  })

  it('should dispatch action', () => {
    act(() => {
      testRenderer.root.find((instance) => instance.props.id === 'set-count').props.onClick()
    })
    expect(getCount()).toBe(10)
  })

  it('should dispatch effect', () => {
    expect(getCount()).toBe(0)
    act(() => {
      testRenderer.root.find((instance) => instance.props.id === 'add-count').props.onClick()
    })
    expect(getCount()).toBe(1)
  })

  it('should dispatch async effect', () => {
    act(() => {
      testRenderer.root.find((instance) => instance.props.id === 'add-count-async').props.onClick()
      timer.tick(ASYNC_DELAY_TIME)
    })
    expect(getCount()).toBe(1)
  })

  it('should only render once when update state right during rendering', () => {
    const spyFn = jest.fn()
    const TestComponent = () => {
      const [state, actions] = useAyanami(CountModule)

      if (state.count === 2) {
        actions.addCount()
      }

      useEffect(() => {
        spyFn(state.count)
      }, [state.count])

      return (
        <div>
          <span>{state.count}</span>
          <button id="set-count" onClick={() => actions.setCount(2)}>
            set
          </button>
        </div>
      )
    }

    const renderer = create(<TestComponent />)

    // https://github.com/facebook/react/issues/14050 to trigger useEffect manually
    renderer.update(<TestComponent />)
    expect(spyFn.mock.calls).toEqual([[0]])

    act(() => {
      renderer.root.findByType('button').props.onClick()
    })
    expect(spyFn.mock.calls).toEqual([[0], [3]])
  })
})

describe('Hooks spec: useAyanami with config', () => {
  const Component = () => {
    const [count, actions] = useAyanami(CountModule, {
      selector: (state) => state.count,
      mutateStateOnFirstRendering: (state: Draft<CountState>) => {
        state.count = 2
      },
    })

    return (
      <div>
        <span>{count}</span>
        <button id="add-count" onClick={actions.addCount}>
          +
        </button>
      </div>
    )
  }

  let testRenderer: ReactTestRenderer
  let getCount: () => number

  beforeEach(() => {
    testRenderer = create(<Component />)
    getCount = () =>
      parseInt(testRenderer.root.find((instance) => instance.type === 'span').children[0] as string)
  })

  afterEach(() => {
    InjectableFactory.reset()
    InjectableFactory.addProviders(CountModule)
  })

  it('should return selected state from store', () => {
    expect(getCount()).toBe(2)
  })

  it('should only mutate state on first rendering', () => {
    expect(getCount()).toBe(2)
    act(() => {
      testRenderer.root.findByType('button').props.onClick()
    })

    expect(getCount()).toBe(3)
  })
})

describe('Hooks spec: useAyanamiState', () => {
  const Component = () => {
    const count = useAyanamiState(CountModule, {
      selector: (state) => state.count,
    })

    return (
      <div>
        <span>{count}</span>
      </div>
    )
  }

  let testRenderer: ReactTestRenderer
  let getCount: () => number

  beforeEach(() => {
    testRenderer = create(<Component />)
    getCount = () =>
      parseInt(testRenderer.root.find((instance) => instance.type === 'span').children[0] as string)
  })

  afterEach(() => {
    InjectableFactory.reset()
    InjectableFactory.addProviders(CountModule)
  })

  it('should return selected state from store', () => {
    expect(getCount()).toBe(0)
  })
})

describe('Hooks spec: useAyanamiDispatchers', () => {
  const Component = () => {
    const state = useAyanamiState(CountModule)
    const actions = useAyanamiDispatchers(CountModule)

    return (
      <div>
        <span>{state.count}</span>
        <button id="add-count" onClick={actions.addCount}>
          +
        </button>
      </div>
    )
  }

  let testRenderer: ReactTestRenderer
  let getCount: () => number

  beforeEach(() => {
    testRenderer = create(<Component />)
    getCount = () =>
      parseInt(testRenderer.root.find((instance) => instance.type === 'span').children[0] as string)
  })

  afterEach(() => {
    InjectableFactory.reset()
    InjectableFactory.addProviders(CountModule)
  })

  it('should return selected state from store', () => {
    expect(getCount()).toBe(0)
  })

  it('should dispatch effect', () => {
    act(() => {
      testRenderer.root.findByType('button').props.onClick()
    })

    expect(getCount()).toBe(1)
  })
})

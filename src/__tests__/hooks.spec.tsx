import 'reflect-metadata'
import React, { useEffect } from 'react'
import { useAyanami, useAyanamiState, useActionsCreator } from '../hooks'
import { Ayanami, Effect, ImmerReducer, Action, Module, Reducer } from '../core'
import { Observable } from 'rxjs'
import { map, withLatestFrom, delay, skipWhile, combineLatest, take } from 'rxjs/operators'
import { Draft } from 'immer'
import { act, create, ReactTestRenderer } from 'react-test-renderer'
import { InjectableFactory } from '@asuka/di'
import Sinon from 'sinon'

interface CountState {
  count: number
}

interface GlobalState {
  user: string
}

const ASYNC_DELAY_TIME = 1000

@Module('Global')
class GlobalModule extends Ayanami<GlobalState> {
  defaultState = {
    user: '',
  }

  @ImmerReducer()
  setUser(state: Draft<GlobalState>, payload: string) {
    state.user = payload
  }

  @Effect()
  fetchUser(payload$: Observable<void>): Observable<Action> {
    return payload$.pipe(
      delay(ASYNC_DELAY_TIME),
      map(() => this.getActions().setUser('global')),
    )
  }
}

@Module('CountModule')
class CountModule extends Ayanami<CountState> {
  defaultState = {
    count: 0,
  }

  constructor(private readonly globalModule: GlobalModule) {
    super()
  }

  @ImmerReducer()
  setCount(state: Draft<CountState>, payload: number) {
    state.count = payload
  }

  @Effect()
  addCount(payload$: Observable<void>): Observable<Action> {
    return payload$.pipe(
      withLatestFrom(this.state$),
      map(([, state]) => this.getActions().setCount(state.count + 1)),
    )
  }

  @Effect()
  addCountAsync(payload$: Observable<void>): Observable<Action> {
    return payload$.pipe(
      delay(ASYNC_DELAY_TIME),
      withLatestFrom(this.state$),
      map(([, state]) => this.getActions().setCount(state.count + 1)),
    )
  }

  @Effect()
  waitUserAddCount(payload$: Observable<void>): Observable<Action> {
    return payload$.pipe(
      combineLatest(
        this.globalModule.state$.pipe(
          skipWhile((v) => !v.user),
          take(1),
        ),
        this.state$.pipe(take(1)),
      ),
      map(([, , state]) => this.getActions().setCount(state.count + 1)),
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
    InjectableFactory.addProviders(GlobalModule, CountModule)
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

  it('should be able to use state$ from the other module', () => {
    const TestComponent = () => {
      const [state, actions] = useAyanami(CountModule)
      const globalActions = useActionsCreator(GlobalModule)
      useEffect(() => {
        actions.waitUserAddCount()
        globalActions.fetchUser()
      }, [])
      return <span>{state.count}</span>
    }

    const renderer = create(<TestComponent />)
    act(() => {
      renderer.update(<TestComponent />)
    })
    act(() => {
      timer.tick(ASYNC_DELAY_TIME)
      renderer.update(<TestComponent />)
    })
    expect(getCount()).toBe(1)
  })

  it('should be able to catch reducer error', () => {
    const error = new TypeError('whatever')
    @Module('ReducerError')
    class ReducerErrorModule extends Ayanami<{}> {
      defaultState = {}
      @Reducer()
      throw() {
        throw error
      }
    }
    const spy = Sinon.spy()
    const Component = () => {
      const actions = useActionsCreator(ReducerErrorModule)
      try {
        actions.throw()
      } catch (e) {
        spy(e)
      }
      return <div />
    }
    create(<Component />)
    expect(spy.args).toStrictEqual([[error]])
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
    InjectableFactory.addProviders(GlobalModule, CountModule)
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
    InjectableFactory.addProviders(GlobalModule, CountModule)
  })

  it('should return selected state from store', () => {
    expect(getCount()).toBe(0)
  })
})

describe('Hooks spec: useActionsCreator', () => {
  const Component = () => {
    const state = useAyanamiState(CountModule)
    const actions = useActionsCreator(CountModule)

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
    InjectableFactory.addProviders(GlobalModule, CountModule)
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

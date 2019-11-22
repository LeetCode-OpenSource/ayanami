import { createState, Action, StateType, Epic } from '../state'
import { Reducer } from 'react'
import { identity } from 'rxjs'
import { filter, map } from 'rxjs/operators'

interface State {
  foo: string
  bar: number | null
}

describe('state specs', () => {
  const UPDATE_FOO = 'update-foo'
  const UPDATE_BAR = 'update-bar'
  const ASYNC_UPDATE_FOO = 'async-update-foo'

  const mockReducer: Reducer<State, Action<unknown>> = (prevState, action) => {
    if (action.type === UPDATE_FOO) {
      return { ...prevState, foo: action.payload as string }
    } else if (action.type === UPDATE_BAR) {
      return { ...prevState, bar: action.payload as number | null }
    }
    return prevState
  }

  const mockEpic: Epic<unknown, State> = (action$) =>
    action$.pipe(
      filter(({ type }) => type === ASYNC_UPDATE_FOO),
      map(() => ({ type: 'noop', payload: null })),
    )

  describe('stateCreator', () => {
    const stateCreator = createState<State>(
      {
        foo: '1',
        bar: null,
      },
      mockReducer,
      identity,
    )
    it('should be able to create singleton state', () => {
      stateCreator(StateType.Singleton)
    })

    it('should be able to create scoped state', () => {
      stateCreator(StateType.Scoped, Symbol('whatever'))
    })

    it('should be able to create transient state', () => {
      stateCreator(StateType.Transient)
    })

    it('should be the same state object when state is Singleton', () => {
      const state1 = stateCreator(StateType.Singleton)
      const state2 = stateCreator(StateType.Singleton)
      expect(state1.getState()).toBe(state2.getState())
    })

    it('should be different state object when state is Transient', () => {
      const state1 = stateCreator(StateType.Transient)
      const state2 = stateCreator(StateType.Transient)
      expect(state1.getState()).not.toBe(state2.getState())
    })

    it('should be the same state object when scope is the same', () => {
      const scope = Symbol()
      const state1 = stateCreator(StateType.Scoped, scope)
      const state2 = stateCreator(StateType.Scoped, scope)
      expect(state1.getState()).toBe(state2.getState())
    })

    it('should be different state object when scope is not the same', () => {
      const state1 = stateCreator(StateType.Scoped, Symbol())
      const state2 = stateCreator(StateType.Scoped, Symbol())
      expect(state1.getState()).not.toBe(state2.getState())
    })
  })

  describe('state', () => {
    const defaultState = {
      foo: '1',
      bar: null,
    }
    it('should be able to change state via dispatch action', () => {
      const stateCreator = createState<State>(defaultState, mockReducer, mockEpic)

      const state = stateCreator(StateType.Singleton)
      state.dispatch({ type: UPDATE_FOO, payload: '2' })
      expect(state.getState().foo).toBe('2')
    })

    it('should do nothing when action type is not matched any reducer', () => {
      const stateCreator = createState<State>(defaultState, mockReducer, mockEpic)

      const state = stateCreator(StateType.Singleton)
      state.dispatch({ type: '__NOOP__', payload: '2' })
      expect(state.getState().foo).toBe(defaultState.foo)
    })

    it('should effect all state if singleton', () => {
      const stateCreator = createState<State>(defaultState, mockReducer, mockEpic)

      const state = stateCreator(StateType.Singleton)
      const state2 = stateCreator(StateType.Singleton)
      state.dispatch({ type: UPDATE_FOO, payload: '2' })
      expect(state.getState().foo).toBe('2')
      expect(state2.getState().foo).toBe('2')
    })

    it('should effect all state if scope is the same', () => {
      const stateCreator = createState<State>(defaultState, mockReducer, mockEpic)
      const scope = Symbol()
      const state = stateCreator(StateType.Scoped, scope)
      const state2 = stateCreator(StateType.Scoped, scope)
      state.dispatch({ type: UPDATE_FOO, payload: '2' })
      expect(state.getState().foo).toBe('2')
      expect(state2.getState().foo).toBe('2')
    })

    it('should not effect the other state if scope is not the same', () => {
      const stateCreator = createState<State>(defaultState, mockReducer, mockEpic)
      const state = stateCreator(StateType.Scoped, Symbol())
      const state2 = stateCreator(StateType.Scoped, Symbol())
      state.dispatch({ type: UPDATE_FOO, payload: '2' })
      expect(state.getState().foo).toBe('2')
      expect(state2.getState().foo).toBe(defaultState.foo)
    })

    it('should not effect the other state if state is transient', () => {
      const stateCreator = createState<State>(defaultState, mockReducer, mockEpic)
      const state = stateCreator(StateType.Transient)
      const state2 = stateCreator(StateType.Transient)
      state.dispatch({ type: UPDATE_FOO, payload: '2' })
      expect(state.getState().foo).toBe('2')
      expect(state2.getState().foo).toBe(defaultState.foo)
    })

    it('should be able to override defaultState when state is transient', () => {
      const stateCreator = createState<State>(defaultState, mockReducer, mockEpic)
      const stateToOverride: State = {
        foo: '2',
        bar: 2,
      }
      const state = stateCreator(StateType.Transient, stateToOverride)

      expect(state.getState()).toStrictEqual(stateToOverride)
    })
  })
})

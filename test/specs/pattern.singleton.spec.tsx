import * as React from 'react'
import { act, create, ReactTestRenderer } from 'react-test-renderer'
import { Observable, timer } from 'rxjs'
import { map, mapTo, switchMap, tap, withLatestFrom } from 'rxjs/operators'
import { noop } from 'lodash'

import { Ayanami, Effect, EffectAction, Reducer, Singleton, Transient } from '../../src'

interface CountState {
  count: number
}

@Singleton()
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

  @Effect()
  autoAdd(payload$: Observable<Observable<number>>): Observable<EffectAction> {
    return payload$.pipe(
      switchMap((ob$) => ob$),
      map(this.getActions().add),
    )
  }
}

function CountComponent({ autoAddCallback = noop }: { autoAddCallback?: () => void }) {
  const [state, actions] = Count.useHooks()

  const add = (count: number) => () => actions.add(count)
  const autoAdd = () =>
    actions.autoAdd(
      timer(0, 1000).pipe(
        tap(autoAddCallback),
        mapTo(1),
      ),
    )

  return (
    <div>
      <p>
        current count is <span>{state.count}</span>
      </p>
      <button id="add" onClick={add(1)}>
        add one
      </button>
      <button id="autoAdd" onClick={autoAdd}>
        auto add
      </button>
    </div>
  )
}

describe('Singleton Pattern spec:', () => {
  it('getInstance always return same instance', () => {
    expect(Count.getInstance()).toBeInstanceOf(Count)
    expect(Count.getInstance()).toBe(Count.getInstance())
  })

  describe('Hooks', () => {
    const count = (which: ReactTestRenderer) => which.root.findByType('span').children[0]
    const add = (which: ReactTestRenderer) =>
      act(() => which.root.findByProps({ id: 'add' }).props.onClick())
    const autoAdd = (which: ReactTestRenderer) =>
      act(() => which.root.findByProps({ id: 'autoAdd' }).props.onClick())

    it('state is shared', () => {
      const renderer1 = create(<CountComponent />)
      const renderer2 = create(<CountComponent />)

      // https://github.com/facebook/react/issues/14050 to trigger useEffect manually
      renderer1.update(<CountComponent />)
      renderer2.update(<CountComponent />)

      add(renderer1)
      expect(count(renderer1)).toBe('1')
      expect(count(renderer1)).toBe(count(renderer2))

      add(renderer2)
      expect(count(renderer2)).toBe('2')
      expect(count(renderer2)).toBe(count(renderer1))
    })

    it('ayanami is persistent', () => {
      jest.useFakeTimers()

      const autoAddCallback = jest.fn()
      const renderer = create(<CountComponent autoAddCallback={autoAddCallback} />)

      // https://github.com/facebook/react/issues/14050 to trigger useEffect manually
      renderer.update(<CountComponent autoAddCallback={autoAddCallback} />)

      autoAdd(renderer)

      act(() => {
        jest.advanceTimersByTime(0)
      })

      expect(autoAddCallback.mock.calls.length).toBe(1)

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(autoAddCallback.mock.calls.length).toBe(2)

      renderer.unmount()

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(autoAddCallback.mock.calls.length).toBe(3)
    })
  })

  it('should throw an error if trying to inject a transient Ayanami', () => {
    expect(() => {
      @Transient()
      class A extends Ayanami<{}> {
        defaultState = {}
      }

      @Singleton()
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class B extends Ayanami<{}> {
        defaultState = {}

        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        constructor(private a: A) {
          super()
        }
      }
    }).toThrowError(
      `Since A was decorated by @Transient(), it can only used by 'useHooks' or 'connect'.`,
    )
  })
})

import 'reflect-metadata'

import React from 'react'
import { Observable, timer } from 'rxjs'
import { endWith, switchMap, map, mergeMap, flatMap } from 'rxjs/operators'
import { Draft } from 'immer'
import { renderToString } from 'react-dom/server'
import { create, act } from 'react-test-renderer'
import uniqueId from 'lodash/uniqueId'

import { TERMINATE_ACTION, emitSSREffects, SSREffect } from '../index'

import { Ayanami, ImmerReducer, Module, Action } from '../../core'
import { useAyanami } from '../../hooks'
import { GLOBAL_KEY } from '../constants'
import { SSRContext } from '../ssr-context'
import { SSRStates } from '../ssr-states'

interface CountState {
  count: number
  name: string
}

interface TipState {
  tip: string
}

@Module('CountModel')
class CountModel extends Ayanami<CountState> {
  defaultState = { count: 0, name: '' }

  @ImmerReducer()
  setCount(state: Draft<CountState>, count: number) {
    state.count = count
  }

  @ImmerReducer()
  setName(state: Draft<CountState>, name: string) {
    state.name = name
  }

  @SSREffect()
  getCount(payload$: Observable<void>): Observable<Action> {
    return payload$.pipe(
      flatMap(() =>
        timer(20).pipe(
          map(() => this.getActions().setCount(1)),
          endWith(TERMINATE_ACTION),
        ),
      ),
    )
  }

  @SSREffect({
    payloadGetter: (ctx: { url: string }, skip) => ctx.url || skip(),
    skipFirstClientDispatch: false,
  })
  skippedEffect(payload$: Observable<string>): Observable<Action> {
    return payload$.pipe(
      switchMap((name) =>
        timer(20).pipe(
          map(() => this.getActions().setName(name)),
          endWith(TERMINATE_ACTION),
        ),
      ),
    )
  }
}

@Module('TipModel')
class TipModel extends Ayanami<TipState> {
  defaultState = { tip: '' }

  @ImmerReducer()
  setTip(state: Draft<TipState>, tip: string) {
    state.tip = tip
  }

  @SSREffect()
  getTip(payload$: Observable<void>): Observable<Action> {
    return payload$.pipe(
      mergeMap(() =>
        timer(1).pipe(
          map(() => this.getActions().setTip('tip')),
          endWith(TERMINATE_ACTION),
        ),
      ),
    )
  }
}

const Component = () => {
  const [state, actions] = useAyanami(CountModel)
  React.useEffect(() => {
    actions.setName('new name')
  }, [])

  return (
    <>
      <span>{state.count}</span>
    </>
  )
}

const ComponentWithSelector = () => {
  const [state, actions] = useAyanami(CountModel, {
    selector: (s) => ({
      count: s.count + 1,
    }),
  })
  React.useEffect(() => {
    actions.setName('new name')
  }, [])

  return (
    <>
      <span>{state.count}</span>
    </>
  )
}

describe('SSR specs:', () => {
  beforeAll(() => {
    process.env.ENABLE_AYANAMI_SSR = 'true'
  })

  afterAll(() => {
    process.env.ENABLE_AYANAMI_SSR = 'false'
    SSRStates.clear()
  })

  it('should throw if module name not given', () => {
    function generateException() {
      @((Module as any)())
      class ErrorModel extends Ayanami<any> {
        defaultState = {}
      }

      return ErrorModel
    }

    expect(generateException).toThrow()
  })

  it('should pass valid module name', () => {
    @Module('1')
    class Model extends Ayanami<any> {
      defaultState = {}
    }

    @Module({ name: '2', providers: [] })
    class Model2 extends Ayanami<any> {
      defaultState = {}
    }

    function generateException1() {
      @Module('1')
      class ErrorModel1 extends Ayanami<any> {
        defaultState = {}
      }

      return ErrorModel1
    }

    function generateException2() {
      @Module({ name: '1', providers: [] })
      class ErrorModel2 extends Ayanami<any> {
        defaultState = {}
      }

      return { ErrorModel2 }
    }

    function generateException3() {
      @((Module as any)())
      class ErrorModel extends Ayanami<any> {
        defaultState = {}
      }

      return ErrorModel
    }

    expect(Model).not.toBe(undefined)
    expect(Model2).not.toBe(undefined)
    expect(generateException1).toThrow()
    expect(generateException2).toThrow()
    expect(generateException3).toThrow()
  })

  it('should run ssr effects', async () => {
    const state = await emitSSREffects({ url: 'name' } as any, [CountModel])
    const moduleState = state['CountModel']
    expect(moduleState).not.toBe(undefined)
    expect(moduleState.count).toBe(1)
    expect(moduleState.name).toBe('name')
    expect(state).toMatchSnapshot()
  })

  it('should skip effect if it returns SKIP_SYMBOL', async () => {
    const state = await emitSSREffects({} as any, [CountModel])
    const moduleState = state['CountModel']

    expect(moduleState.name).toBe('')
    expect(state).toMatchSnapshot()
  })

  it('should return right state in hooks #without config', async () => {
    const req = {}
    const uuid = uniqueId()
    await emitSSREffects(req, [CountModel], uuid)
    const html = renderToString(
      <SSRContext.Provider value={uuid}>
        <Component />
      </SSRContext.Provider>,
    )
    expect(html).toContain('<span>1</span>')
    expect(html).toMatchSnapshot()
  })

  it('should return right state in hooks #with config', async () => {
    const req = {}
    const reqContext = uniqueId()
    await emitSSREffects(req, [{ module: CountModel }], reqContext)
    const html = renderToString(
      <SSRContext.Provider value={reqContext}>
        <ComponentWithSelector />
      </SSRContext.Provider>,
    )
    expect(html).toContain('<span>1</span>')
    expect(html).toMatchSnapshot()
  })

  it('should restore state from global #without config', () => {
    process.env.ENABLE_AYANAMI_SSR = 'false'
    // @ts-ignore
    global[GLOBAL_KEY] = {
      CountModel: {
        count: 1,
        name: '',
      },
    }
    const testRenderer = create(<Component />)
    act(() => {
      testRenderer.update(<Component />)
    })
    expect(testRenderer.root.findByType('span').children[0]).toBe('1')
    process.env.ENABLE_AYANAMI_SSR = 'true'
    // @ts-ignore
    delete global[GLOBAL_KEY]
    testRenderer.unmount()
  })

  it('should restore state from global #with config', () => {
    process.env.ENABLE_AYANAMI_SSR = 'false'
    // @ts-ignore
    global[GLOBAL_KEY] = {
      CountModel: {
        count: 1,
        name: '',
      },
    }
    const testRenderer = create(<ComponentWithSelector />)
    act(() => {
      testRenderer.update(<ComponentWithSelector />)
    })
    expect(testRenderer.root.findByType('span').children[0]).toBe('1')
    process.env.ENABLE_AYANAMI_SSR = 'true'
    // @ts-ignore
    delete global[GLOBAL_KEY]
    testRenderer.unmount()
  })

  it('should support concurrency', async () => {
    return Promise.all([
      emitSSREffects(
        { url: 'name1' },
        [{ module: CountModel }, { module: TipModel }],
        'concurrency1',
      ),
      emitSSREffects(
        { url: 'name2' },
        [{ module: CountModel }, { module: TipModel }],
        'concurrency2',
      ),
    ]).then(([result1, result2]) => {
      expect(result1['CountModel'].name).toBe('name1')
      expect(result2['CountModel'].name).toBe('name2')
      expect({
        firstRequest: result1,
        secondRequest: result2,
      }).toMatchSnapshot()
    })
  })
})

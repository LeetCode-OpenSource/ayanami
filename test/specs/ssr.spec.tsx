import * as React from 'react'
import { Observable, timer } from 'rxjs'
import { endWith, switchMap, map, mergeMap } from 'rxjs/operators'
import { Draft } from 'immer'
import { renderToString } from 'react-dom/server'
import { create } from 'react-test-renderer'

import {
  SSRModule,
  Ayanami,
  SSREffect,
  EffectAction,
  emitSSREffects,
  TERMINATE_ACTION,
  ImmerReducer,
  useAyanami,
  SSRContext,
  globalKey,
  reqMap,
} from '../../src'
import { DEFAULT_SCOPE_NAME } from '../../src/ssr/constants'

interface CountState {
  count: number
  name: string
}

@SSRModule('CountModel')
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
  getCount(payload$: Observable<void>): Observable<EffectAction> {
    return payload$.pipe(
      switchMap(() =>
        timer(1).pipe(
          map(() => this.getActions().setCount(1)),
          endWith(TERMINATE_ACTION),
        ),
      ),
    )
  }

  @SSREffect({
    payloadGetter: (req, skip) => req.url || skip(),
    skipFirstClientDispatch: false,
  })
  skippedEffect(payload$: Observable<string>): Observable<EffectAction> {
    return payload$.pipe(
      switchMap((name) =>
        timer(1).pipe(
          map(() => this.getActions().setName(name)),
          endWith(TERMINATE_ACTION),
        ),
      ),
    )
  }
}

interface TipState {
  tip: string
}

@SSRModule('TipModel')
class TipModel extends Ayanami<TipState> {
  defaultState = { tip: '' }

  @ImmerReducer()
  setTip(state: Draft<TipState>, tip: string) {
    state.tip = tip
  }

  @SSREffect()
  getTip(payload$: Observable<void>): Observable<EffectAction> {
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

  return <span>{state.count}</span>
}

describe('SSR specs:', () => {
  beforeAll(() => {
    // @ts-ignore
    process.env.ENABLE_AYANAMI_SSR = 'true'
    process.env.NODE_ENV = 'production'
  })

  afterAll(() => {
    // @ts-ignore
    process.env.ENABLE_AYANAMI_SSR = 'false'
    delete process.env.NODE_ENV
  })

  it('should throw if module name not given', () => {
    function generateException() {
      // @ts-ignore
      @SSRModule()
      class ErrorModel extends Ayanami<any> {
        defaultState = {}
      }

      return ErrorModel
    }

    expect(generateException).toThrow()
  })

  it('should pass valid module name', () => {
    @SSRModule('1')
    class Model extends Ayanami<any> {
      defaultState = {}
    }

    @SSRModule({ name: '2', providers: [] })
    class Model2 extends Ayanami<any> {
      defaultState = {}
    }

    function generateException1() {
      @SSRModule('1')
      class ErrorModel1 extends Ayanami<any> {
        defaultState = {}
      }

      return ErrorModel1
    }

    function generateException2() {
      @SSRModule({ name: '1', providers: [] })
      class ErrorModel2 extends Ayanami<any> {
        defaultState = {}
      }

      return { ErrorModel2 }
    }

    function generateException3() {
      // @ts-ignore
      @SSRModule()
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
    process.env.NODE_ENV = 'development'
    expect(generateException1).not.toThrow()
    expect(generateException2).not.toThrow()
  })

  it('should run ssr effects', async () => {
    // @ts-ignore
    const { state, cleanup } = await emitSSREffects({ url: 'name' }, [CountModel])
    const moduleState = state['CountModel'][DEFAULT_SCOPE_NAME]

    expect(moduleState).not.toBe(undefined)
    expect(moduleState.count).toBe(1)
    expect(moduleState.name).toBe('name')
    expect(state).toMatchSnapshot()
    cleanup()
  })

  it('should skip effect if it returns SKIP_SYMBOL', async () => {
    // @ts-ignore
    const { state, cleanup } = await emitSSREffects({}, [CountModel])
    const moduleState = state['CountModel'][DEFAULT_SCOPE_NAME]

    expect(moduleState.name).toBe('')
    expect(state).toMatchSnapshot()
    cleanup()
  })

  it('should return right state in hooks', async () => {
    const req = {}
    // @ts-ignore
    const { cleanup } = await emitSSREffects(req, [CountModel])
    const html = renderToString(
      // @ts-ignore
      <SSRContext.Provider value={req}>
        <Component />
      </SSRContext.Provider>,
    )
    expect(html).toContain('<span>1</span>')
    expect(html).toMatchSnapshot()
    cleanup()
  })

  it('should work with scope', async () => {
    // @ts-ignore
    const { state, cleanup } = await emitSSREffects({}, [
      { module: CountModel, scope: 'scope' },
      CountModel,
    ])
    const moduleState = state['CountModel'][DEFAULT_SCOPE_NAME]
    const scopedModuleState = state['CountModel']['scope']

    expect(scopedModuleState).not.toBe(undefined)
    expect(scopedModuleState).toEqual(moduleState)
    expect(scopedModuleState).not.toBe(moduleState)
    expect(state).toMatchSnapshot()
    cleanup()
  })

  it('should restore state from global', () => {
    process.env.ENABLE_AYANAMI_SSR = 'false'
    // @ts-ignore
    global[globalKey] = {
      CountModel: {
        [DEFAULT_SCOPE_NAME]: {
          count: 1,
          name: '',
        },
      },
    }
    const testRenderer = create(<Component />)
    expect(testRenderer.root.findByType('span').children[0]).toBe('1')
    process.env.ENABLE_AYANAMI_SSR = 'true'
  })

  it('should timeout and clean', async () => {
    try {
      // @ts-ignore
      await emitSSREffects({}, [CountModel], 0)
    } catch (e) {
      expect(e.message).toContain('Terminate timeout')
    }

    expect(reqMap.size).toBe(0)
  })

  it('should support concurrency', async () => {
    return Promise.all([
      // @ts-ignore
      emitSSREffects({ url: 'name1' }, [
        { module: CountModel, scope: 'scope1' },
        { module: TipModel, scope: 'scope1' },
      ]),
      // @ts-ignore
      emitSSREffects({ url: 'name2' }, [
        { module: CountModel, scope: 'scope1' },
        { module: TipModel, scope: 'scope2' },
      ]),
    ]).then(([result1, result2]) => {
      expect(result1.state['CountModel']['scope1'].name).toBe('name1')
      expect(result2.state['CountModel']['scope1'].name).toBe('name2')
      expect({ firstRequest: result1.state, secondRequest: result2.state }).toMatchSnapshot()
      result1.cleanup()
      result2.cleanup()
    })
  })
})

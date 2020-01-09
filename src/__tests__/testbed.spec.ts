import 'reflect-metadata'
import { Test } from '@asuka/di'
import { Observable } from 'rxjs'
import { Draft } from 'immer'
import { delay, map, withLatestFrom, combineLatest, skipWhile, take } from 'rxjs/operators'
import { useFakeTimers, SinonFakeTimers } from 'sinon'

import { AyanamiTestModule, AyanamiTestStub } from '../testbed'
import { Module, Ayanami, ImmerReducer, Effect, Action } from '../core'

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
  waitUserAddCount(payload$: Observable<void>) {
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

describe('AyanamiTestModule specs', () => {
  let globalStub: AyanamiTestStub<GlobalModule, GlobalState>
  let countStub: AyanamiTestStub<CountModule, CountState>
  let fakeTimer: SinonFakeTimers

  beforeEach(() => {
    const testModule = Test.createTestingModule({
      TestModule: AyanamiTestModule,
      providers: [GlobalModule, CountModule],
    }).compile()

    globalStub = testModule.getAyanamiTestingStub(GlobalModule)
    countStub = testModule.getAyanamiTestingStub(CountModule)
    fakeTimer = useFakeTimers()
  })

  afterEach(() => {
    fakeTimer.restore()
  })

  it('should get state from global module', () => {
    const defaultState = globalStub.getState()

    expect(defaultState).toEqual({ user: '' })
  })

  it('should get state from count module', () => {
    const defaultState = countStub.getState()

    expect(defaultState).toEqual({ count: 0 })
  })

  it('should get dispatcher', () => {
    countStub.dispatcher.waitUserAddCount()
    globalStub.dispatcher.fetchUser()
    fakeTimer.tick(ASYNC_DELAY_TIME)
    expect(countStub.getState()).toEqual({ count: 1 })
  })
})

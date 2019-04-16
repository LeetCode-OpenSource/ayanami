import { Observable, Subject } from 'rxjs'
import { tap } from 'rxjs/operators'

import { EffectAction } from '../types'
import { Ayanami } from '../ayanami'
import { effectSymbols, reducerSymbols, defineActionSymbols, setupInstanceSymbol } from '../symbols'

import { BasicState } from './basic-state'
import { getActionNames, getAllActions, updateActions } from './action-related'
import { getAyanamiName, logStateAction } from './redux-devtools-extension'

const setupEffectActions = <M extends Ayanami<S>, S>(
  ayanami: M,
  basicState: BasicState<S>,
): void => {
  getActionNames(effectSymbols, ayanami.constructor).forEach((methodName) => {
    const payload$ = new Subject<any>()
    const effect$: Observable<EffectAction<M>> = ((ayanami as any)[methodName] as Function).call(
      ayanami,
      payload$,
      basicState.state$,
    )

    updateActions(effectSymbols, ayanami, {
      [methodName](payload: any) {
        payload$.next(payload)
      },
    })

    effect$
      .pipe(
        tap(({ ayanami: currentAyanami, actionName, params }) => {
          logStateAction(ayanami, {
            params,
            actionName: `${methodName}/👉${getAyanamiName(currentAyanami)}/️${actionName}`,
          })

          const actions: any = getAllActions(currentAyanami)
          actions[actionName as string](params)
        }),
      )
      // TODO - able to unsubscribe?
      .subscribe({
        error(e) {
          console.error(e)
        },
      })
  })
}

const setupReducerActions = <M extends Ayanami<S>, S>(
  ayanami: M,
  basicState: BasicState<S>,
): void => {
  getActionNames(reducerSymbols, ayanami.constructor).forEach((methodName) => {
    const reducer = (ayanami as any)[methodName] as Function

    updateActions(reducerSymbols, ayanami, {
      [methodName](payload: any) {
        const nextState = reducer.call(ayanami, payload, basicState.getState())
        basicState.setState(nextState)
        logStateAction(ayanami, {
          actionName: methodName,
          params: payload,
          state: nextState,
        })
      },
    })
  })
}

const setupDefineActions = <M extends Ayanami<S>, S>(ayanami: M): void => {
  getActionNames(defineActionSymbols, ayanami.constructor).forEach((methodName) => {
    const action$ = new Subject()

    Object.defineProperty(ayanami, methodName, {
      value: action$.asObservable(),
    })

    updateActions(defineActionSymbols, ayanami, {
      [methodName](payload: any) {
        action$.next(payload)
      },
    })
  })
}

export function setup<M extends Ayanami<S>, S>(ayanami: M): void {
  if (Reflect.hasMetadata(setupInstanceSymbol, ayanami)) {
    return
  }

  const basicState = new BasicState(ayanami.defaultState)

  setupDefineActions(ayanami)
  setupEffectActions(ayanami, basicState)
  setupReducerActions(ayanami, basicState)

  Object.defineProperty(ayanami, 'getState$', { value: () => basicState.state$ })
  Object.defineProperty(ayanami, 'getState', { value: basicState.getState })

  Reflect.defineMetadata(setupInstanceSymbol, true, ayanami)
}

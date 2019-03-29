import { merge, Subject, Observable, NEVER } from 'rxjs'
import { tap, map, groupBy, mergeMap, switchMapTo } from 'rxjs/operators'

import { EffectAction } from '../types'
import { effectSymbols } from './symbols'
import { createActionDecorator, getActionNames, updateActions, getAllActions } from './utils'
import { Ayanami } from '../ayanami'

export const Effect = createActionDecorator(effectSymbols)

enum ActionGroup {
  setState,
  normal,
}

export const setupEffectActions = <M extends Ayanami<S>, S>(
  ayanami: M,
  state$: Observable<S>,
): Observable<Partial<S>> =>
  merge(
    ...getActionNames<M>(effectSymbols, ayanami.constructor).map((methodName) => {
      const payload$ = new Subject<any>()
      const effect$: Observable<EffectAction<M>> = (ayanami[methodName] as Function).call(
        ayanami,
        payload$,
        state$,
      )

      updateActions(effectSymbols, ayanami, {
        [methodName](payload: any) {
          payload$.next(payload)
        },
      })

      return effect$.pipe(
        groupBy(
          ({ actionName }): ActionGroup =>
            actionName === effectSymbols.setStateAction ? ActionGroup.setState : ActionGroup.normal,
        ),
        mergeMap((action$) => {
          switch (action$.key) {
            case ActionGroup.setState:
              return action$.pipe(map(({ params: state }) => state))
            case ActionGroup.normal:
              return action$.pipe(
                tap(({ ayanami, actionName, params }) => {
                  const actions: any = getAllActions(ayanami)
                  actions[actionName as string](params)
                }),
                switchMapTo(NEVER),
              )
          }
        }),
      )
    }),
  )

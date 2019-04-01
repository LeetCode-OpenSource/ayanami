import { Subject, Observable } from 'rxjs'
import { tap, groupBy, mergeMap } from 'rxjs/operators'

import { EffectAction } from '../types'
import { logStateAction } from '../dev-helper'
import { Ayanami } from '../ayanami'
import { BasicState } from '../state'
import { effectSymbols } from './symbols'
import { createActionDecorator, getActionNames, updateActions, getAllActions } from './utils'

export const Effect = createActionDecorator(effectSymbols)

enum ActionGroup {
  setState,
  normal,
}

export const setupEffectActions = <M extends Ayanami<S>, S>(
  ayanami: M,
  basicState: BasicState<S>,
): void => {
  getActionNames<M>(effectSymbols, ayanami.constructor).forEach((methodName) => {
    const payload$ = new Subject<any>()
    const effect$: Observable<EffectAction<M>> = (ayanami[methodName] as Function).call(
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
        groupBy(
          ({ actionName }): ActionGroup =>
            actionName === effectSymbols.setStateAction ? ActionGroup.setState : ActionGroup.normal,
        ),
        mergeMap((action$) => {
          switch (action$.key) {
            case ActionGroup.setState:
              return action$.pipe(
                tap(({ params }) => {
                  logStateAction(ayanami, {
                    params,
                    actionName: `@Effect/${methodName}/@setStateAction`,
                    state: params,
                  })

                  basicState.setState(params)
                }),
              )
            case ActionGroup.normal:
              return action$.pipe(
                tap(({ ayanami: currentAyanami, actionName, params }) => {
                  logStateAction(currentAyanami, {
                    params,
                    actionName: `@Effect/${methodName}/${actionName}`,
                  })

                  const actions: any = getAllActions(currentAyanami)
                  actions[actionName as string](params)
                }),
              )
          }
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

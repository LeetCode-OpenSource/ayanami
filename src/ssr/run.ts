import { from, race, timer, throwError, Subject, noop, Observable, Observer } from 'rxjs'
import { flatMap, skip, take, filter } from 'rxjs/operators'
import { InjectableFactory } from '@asuka/di'

import { ConstructorOf } from '../core/types'
import { Ayanami } from '../core/ayanami'
import { Action } from '../core/state'
import { SSRSymbol } from './constants'
import { SKIP_SYMBOL } from './ssr-effect'
import { TERMINATE_ACTION } from './terminate'
import { SSRStates } from './ssr-states'

export type ModuleMeta = ConstructorOf<Ayanami<any>>

const skipFn = () => SKIP_SYMBOL

/**
 * Run all @SSREffect decorated effects of given modules and extract latest states.
 * `cleanup` function returned must be called before end of responding
 *
 * @param ctx request context, which will be passed to payloadGetter in SSREffect decroator param
 * @param modules used ayanami modules
 * @param uuid the same uuid would reuse the same state which was created before
 * @param timeout seconds to wait before all effects stream out TERMINATE_ACTION
 * @returns object contains ayanami state and cleanup function
 */
export const runSSREffects = <Context, Returned = any>(
  ctx: Context,
  modules: ModuleMeta[],
  sharedCtx?: string | symbol,
  timeout = 3,
): Promise<Returned> => {
  const stateToSerialize: any = {}
  return modules.length === 0
    ? Promise.resolve(stateToSerialize)
    : race(
        from(modules).pipe(
          flatMap((constructor) => {
            let cleanup = noop
            const metas = Reflect.getMetadata(SSRSymbol, constructor.prototype) || []
            const ayanamiInstance: Ayanami<unknown> = InjectableFactory.initialize(constructor)
            const moduleName = ayanamiInstance.scopeName
            let skipCount = metas.length - 1
            const ayanamiState = ayanamiInstance.createState()
            SSRStates.set(sharedCtx ?? ctx, ayanamiState)
            cleanup = sharedCtx
              ? ayanamiState.unsubscribe
              : () => {
                  ayanamiState.action$.complete()
                  ayanamiState.unsubscribe()
                  SSRStates.delete(ctx)
                }
            return new Observable((observer: Observer<Returned>) => {
              async function runEffects() {
                await Promise.all(
                  metas.map(async (meta: any) => {
                    if (meta.middleware) {
                      const param = await meta.middleware(ctx, skipFn)
                      if (param !== SKIP_SYMBOL) {
                        ayanamiState.dispatch({
                          type: meta.action,
                          payload: param,
                          state: ayanamiState,
                        })
                      } else {
                        skipCount -= 1
                      }
                    } else {
                      ayanamiState.dispatch({
                        type: meta.action,
                        payload: undefined,
                        state: ayanamiState,
                      })
                    }
                  }),
                )

                if (skipCount > -1) {
                  const action$ = new Subject<Action<unknown>>()
                  ayanamiState.subscribeAction((action) => {
                    action$.next(action)
                  })
                  await action$
                    .pipe(
                      filter((act) => act.type === TERMINATE_ACTION.type),
                      skip(skipCount),
                      take(1),
                    )
                    .toPromise()

                  const state = ayanamiState.getState()
                  stateToSerialize[moduleName] = state
                }
              }
              runEffects()
                .then(() => {
                  observer.next(stateToSerialize)
                  observer.complete()
                })
                .catch((e) => {
                  observer.error(e)
                })
              return cleanup
            })
          }),
        ),
        timer(timeout * 1000).pipe(flatMap(() => throwError(new Error('Terminate timeout')))),
      ).toPromise()
}

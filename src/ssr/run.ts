import { Request } from 'express'
import { from, race, timer, throwError } from 'rxjs'
import { flatMap, skip, take, tap } from 'rxjs/operators'
import { InjectableFactory } from '@asuka/di'

import { combineWithIkari } from '../core/ikari'
import { ConstructorOf } from '../core/types'
import { Ayanami } from '../core/ayanami'
import {
  createOrGetInstanceInScope,
  ayanamiInstances,
  createScopeWithRequest,
} from '../core/scope/utils'
import { SSRSymbol, CleanupSymbol, DEFAULT_SCOPE_NAME } from './constants'
import { moduleNameKey } from './ssr-module'
import { SKIP_SYMBOL, reqMap } from './express'

export type ModuleMeta =
  | ConstructorOf<Ayanami<any>>
  | { module: ConstructorOf<Ayanami<any>>; scope: string }

const skipFn = () => SKIP_SYMBOL

/**
 * Run all @SSREffect decorated effects of given modules and extract latest states.
 * `cleanup` function returned must be called before end of responding
 *
 * @param req express request object
 * @param modules used ayanami modules
 * @param timeout seconds to wait before all effects stream out TERMINATE_ACTION
 * @returns object contains ayanami state and cleanup function
 */
export const emitSSREffects = (
  req: Request,
  modules: ModuleMeta[],
  timeout = 3,
): Promise<{ state: any; cleanup: () => void }> => {
  const stateToSerialize: any = {}
  const cleanup = () => {
    // non-scope ayanami
    if (ayanamiInstances.has(req)) {
      ayanamiInstances.get(req)!.forEach((instance) => {
        instance[CleanupSymbol].call()
      })
      ayanamiInstances.delete(req)
    }

    // scoped ayanami
    if (reqMap.has(req)) {
      Array.from(reqMap.get(req)!.values()).forEach((s) => {
        ayanamiInstances.get(s)!.forEach((instance) => {
          instance[CleanupSymbol].call()
        })
        ayanamiInstances.delete(s)
      })
      reqMap.delete(req)
    }
  }

  return modules.length === 0
    ? Promise.resolve({ state: stateToSerialize, cleanup })
    : race(
        from(modules).pipe(
          flatMap(async (m) => {
            let constructor: ConstructorOf<Ayanami<any>>
            let scope = DEFAULT_SCOPE_NAME
            if ('scope' in m) {
              constructor = m.module
              scope = m.scope
            } else {
              constructor = m
            }
            const metas = Reflect.getMetadata(SSRSymbol, constructor.prototype)
            if (metas) {
              const ayanamiInstance: any = InjectableFactory.initialize(constructor)
              const moduleName = ayanamiInstance[moduleNameKey]
              const ikari = combineWithIkari(ayanamiInstance)
              let skipCount = metas.length - 1
              for (const meta of metas) {
                const dispatcher = ikari.triggerActions[meta.action]
                if (meta.middleware) {
                  const param = await meta.middleware(req, skipFn)
                  if (param !== SKIP_SYMBOL) {
                    dispatcher(param)
                  } else {
                    skipCount -= 1
                  }
                } else {
                  dispatcher(void 0)
                }
              }

              if (skipCount > -1) {
                await ikari.terminate$
                  .pipe(
                    skip(skipCount),
                    take(1),
                  )
                  .toPromise()

                ikari.terminate$.next(null)
                const state = ikari.state.getState()
                if (stateToSerialize[moduleName]) {
                  stateToSerialize[moduleName][scope] = state
                } else {
                  stateToSerialize[moduleName] = {
                    [scope]: state,
                  }
                }
                const existedAyanami = createOrGetInstanceInScope(
                  constructor,
                  createScopeWithRequest(req, scope === DEFAULT_SCOPE_NAME ? undefined : scope),
                )
                const existedIkari = combineWithIkari(existedAyanami)
                existedIkari.state.setState(state)
                ayanamiInstance.destroy()
              }
            }

            return { state: stateToSerialize, cleanup }
          }),
        ),
        timer(timeout * 1000).pipe(
          tap(cleanup),
          flatMap(() => throwError(new Error('Terminate timeout'))),
        ),
      ).toPromise()
}

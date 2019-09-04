import { Request } from 'express'
import { from, race, timer, throwError, noop } from 'rxjs'
import { flatMap, skip, take } from 'rxjs/operators'
import { InjectableFactory } from '@asuka/di'

import { combineWithIkari } from '../core/ikari'
import { SSRSymbol, CleanupSymbol } from './meta-symbol'
import { moduleNameKey } from './ssr-module'
import { SKIP_SYMBOL } from './express'
import { ConstructorOf } from '../core/types'
import { Ayanami } from '../core/ayanami'
import { createOrGetInstanceInScope } from '../core/scope/utils'

export type ModuleMeta =
  | ConstructorOf<Ayanami<any>>
  | { module: ConstructorOf<Ayanami<any>>; scope: string }

export const DEFAULT_SCOPE_NAME = '__$$AYANAMI_DEFAULT__SCOPE$$__'

const skipFn = () => SKIP_SYMBOL

export const reqMap = new Map<Request, Map<any, { scope: string; req: Request }>>()

/**
 * Run all @SSR and @SSRServerOnly decorated effects and extract modules states.
 * `cleanup` function returned must be called before end of responding
 *
 * @param {Request} req express request object
 * @param {ModuleMeta[]} modules used ayanami modules
 * @param {number} timeout seconds to wait before all effects stream out TERMINATE_ACTION
 * @returns {Promise<{ state: any; cleanup: Function }>}
 */
export const emitSSREffects = (
  req: Request,
  modules: ModuleMeta[],
  timeout: number = 3,
): Promise<{ state: any; cleanup: () => void }> => {
  const stateToSerialize: any = {}
  return modules.length === 0
    ? Promise.resolve({ state: stateToSerialize, cleanup: noop })
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
            const ayanamiInstances: Ayanami<any>[] = []
            if (metas) {
              const ayanamiInstance: any = InjectableFactory.initialize(constructor)
              const moduleName = ayanamiInstance[moduleNameKey]
              if (!moduleName) {
                throw new TypeError('SSRModule has no name')
              }
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
                const existedAyanami = createOrGetInstanceInScope(
                  constructor,
                  scope === DEFAULT_SCOPE_NAME ? req : reqMap.get(req)!.get(scope),
                )
                ayanamiInstances.push(existedAyanami)
                const state = ikari.state.getState()
                if (stateToSerialize[moduleName]) {
                  stateToSerialize[moduleName][scope] = state
                } else {
                  stateToSerialize[moduleName] = {
                    [scope]: state,
                  }
                }
                const existedIkari = combineWithIkari(existedAyanami)
                existedIkari.state.setState(state)
              }
            }
            const cleanupFn = () => {
              reqMap.delete(req)
              ayanamiInstances.forEach((instance) => (instance as any)[CleanupSymbol].call())
            }
            return { state: stateToSerialize, cleanup: cleanupFn }
          }),
        ),
        timer(timeout * 1000).pipe(flatMap(() => throwError(new Error('Terminate timeout')))),
      ).toPromise()
}

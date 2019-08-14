import { Request } from 'express'
import { from } from 'rxjs'
import { flatMap, finalize, skip, take } from 'rxjs/operators'
import { InjectableFactory } from '@asuka/di'

import { activedModulesSets, collectModuleCallbacks } from './collect-modules'
import { combineWithIkari } from '../core/ikari'
import { SSRSymbol } from './meta-symbol'
import { moduleNameKey } from './ssr-module'
import { SKIP_SYMBOL } from './express'
import { ConstructorOf } from '../core/types'
import { Ayanami } from '../core/ayanami'
import { createOrGetInstanceInScope } from '../core/scope/utils'

export const DEFAULT_SCOPE_NAME = '__$$AYANAMI_DEFAULT__SCOPE$$__'

const skipFn = () => SKIP_SYMBOL

export const reqMap = new Map<Request, Map<any, { scope: string; req: Request }>>()

export const expressTerminate = (req: Request): Promise<{ state: any; cleanup: () => void }> => {
  const identity = Object.create({ name: 'terminate-identity' })
  collectModuleCallbacks.forEach((callback) => callback(identity))
  collectModuleCallbacks.length = 0
  const modulesSet = activedModulesSets.get(identity)
  const stateToSerialize: any = {}
  return !modulesSet
    ? Promise.resolve(stateToSerialize)
    : from(modulesSet.values())
        .pipe(
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
              collectModuleCallbacks.length = 0
              reqMap.delete(req)
            }
            return { state: stateToSerialize, cleanup: cleanupFn }
          }),
          finalize(() => {
            activedModulesSets.delete(identity)
          }),
        )
        .toPromise()
}

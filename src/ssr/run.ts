import { Request } from 'express'
import { from } from 'rxjs'
import { flatMap, finalize } from 'rxjs/operators'
import { InjectableFactory } from '@asuka/di'

import { activedModulesSets, collectModuleCallbacks } from './collect-modules'
import { combineWithIkari } from '../core/ikari'
import { SSRSymbol } from './meta-symbol'
import { moduleNameKey } from './ssr-module'
import { SKIP_SYMBOL } from './express'

const skipFn = () => SKIP_SYMBOL

export const expressTerminate = (req: Request): Promise<any> => {
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
            const metas: any[] = Reflect.getMetadata(SSRSymbol, m.prototype)
            if (metas) {
              const ayanamiInstance: any = InjectableFactory.initialize(m)
              const moduleName = ayanamiInstance[moduleNameKey]
              if (!moduleName) {
                throw new TypeError('SSRModule has no name')
              }
              const ikari = combineWithIkari(ayanamiInstance)
              for (const meta of metas) {
                const dispatcher = ikari.triggerActions[meta.action]
                if (meta.middleware) {
                  const param = await meta.middleware(req, skipFn)
                  if (param !== SKIP_SYMBOL) {
                    dispatcher(param)
                  }
                } else {
                  dispatcher(void 0)
                }
              }
              await ikari.terminate$.toPromise()
              stateToSerialize[moduleName] = ikari.state.getState()
              const existedAyanami = InjectableFactory.getInstance(m)
              const existedIkari = combineWithIkari(existedAyanami)
              existedIkari.state.setState(stateToSerialize[moduleName])
            }
            return stateToSerialize
          }),
          finalize(() => {
            activedModulesSets.delete(identity)
          }),
        )
        .toPromise()
}

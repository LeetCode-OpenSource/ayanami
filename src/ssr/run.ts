import { Request, Response } from 'express'
import { from } from 'rxjs'
import { flatMap, finalize } from 'rxjs/operators'
import { InjectableFactory } from '@asuka/di'

import { activedModulesSets, collectModuleCallbacks } from './collect-modules'
import { combineWithIkari } from '../core/ikari'
import { SSRSymbol } from './meta-symbol'
import { moduleNameKey } from './ssr-module'

export const expressTerminate = (req: Request, res: Response): Promise<any> => {
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
              const ayanamiInstance: any = InjectableFactory.getInstance(m)
              const moduleName = ayanamiInstance[moduleNameKey]
              if (!moduleName) {
                throw new TypeError('SSRModule has no name')
              }
              const ikari = combineWithIkari(ayanamiInstance)
              for (const meta of metas) {
                const dispatcher = ikari.triggerActions[meta.action]
                if (meta.middleware) {
                  const param = await meta.middleware(req, res)
                  dispatcher(param)
                } else {
                  dispatcher(void 0)
                }
              }
              await ikari.terminate$.toPromise()
              stateToSerialize[moduleName] = ikari.state.getState()
            }
            return stateToSerialize
          }),
          finalize(() => {
            activedModulesSets.delete(identity)
          }),
        )
        .toPromise()
}

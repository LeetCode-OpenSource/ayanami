import { flatMap } from 'lodash'

import { Ayanami } from '../core/ayanami'
import { ConstructorOf } from '../core/types'

export const activedModulesSets = new Map<object, Set<ConstructorOf<Ayanami<any>>>>()
export const collectModuleCallbacks: ((identity: object) => void)[] = []

export const collectModules = (
  modules: (ConstructorOf<Ayanami<any>> | ConstructorOf<Ayanami<any>>[])[] | undefined,
) => {
  collectModuleCallbacks.push((identity: object) => {
    if (modules) {
      flatMap(modules)
        .filter((m) => !!m)
        .forEach((m) => {
          const existed = activedModulesSets.get(identity)
          if (existed) {
            existed.add(m)
          } else {
            activedModulesSets.set(identity, new Set([m]))
          }
        })
    }
  })
}

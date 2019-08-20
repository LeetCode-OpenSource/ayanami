import { flattenDeep, uniqWith } from 'lodash'

import { Ayanami } from '../core/ayanami'
import { ConstructorOf } from '../core/types'
import { SSRSymbol } from './meta-symbol'

export type ModuleMeta =
  | ConstructorOf<Ayanami<any>>
  | { module: ConstructorOf<Ayanami<any>>; scope: string }

export const activedModulesSets = new Map<object, Set<ModuleMeta>>()
export const collectModuleCallbacks: ((identity: object) => void)[] = []

export const collectModules = (modules: ModuleMeta[][] | undefined) => {
  if (modules) {
    uniqWith(
      flattenDeep(modules).filter((m) => !!m) as ModuleMeta[],
      (meta1: any, meta2: any) =>
        meta1.scope &&
        meta2.scope &&
        meta1.module &&
        meta2.module &&
        meta1.module === meta2.module &&
        meta1.scope === meta2.scope,
    ).forEach((m) => {
      collectModuleCallbacks.push((identity: object) => {
        const existed = activedModulesSets.get(identity)
        if (existed) {
          existed.add(m)
        } else {
          activedModulesSets.set(identity, new Set([m]))
        }
      })
    })
  }
}

export const collectDynamicModule = (component: any, ...metas: ModuleMeta[]) => {
  if (component[SSRSymbol]) {
    component[SSRSymbol] = component[SSRSymbol].concat(metas)
  } else {
    component[SSRSymbol] = metas
  }
}

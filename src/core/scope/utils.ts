import { InjectableFactory, Inject } from '@asuka/di'
import { Request } from 'express'

import { ConstructorOf } from '../types'
import { Scope } from './type'
import { SameScopeMetadataKey } from './same-scope-decorator'
import { CleanupSymbol } from '../../ssr/constants'
import { isSSREnabled } from '../../ssr/flag'
import { reqMap } from '../../ssr/express'

type ScopeMap<K, V> = Map<K, V>

type Instance = any

type Key = ConstructorOf<Instance>

const map: Map<Key, ScopeMap<Scope, Instance>> = new Map()

export const ayanamiInstances: Map<Scope, Instance[]> = new Map()

export function createOrGetInstanceInScope<T>(constructor: ConstructorOf<T>, scope: Scope): T {
  const instanceAtScope = getInstanceFrom(constructor, scope)

  return instanceAtScope ? instanceAtScope : createInstanceInScope(constructor, scope)
}

function createInstanceInScope<T>(constructor: ConstructorOf<T>, scope: Scope): T {
  const paramTypes: ConstructorOf<any>[] =
    Reflect.getMetadata('design:paramtypes', constructor) || []

  // parameters decorated by @Inject
  const paramAnnotations = Reflect.getMetadata('parameters', constructor) || []

  const sameScopeParams: number[] = Reflect.getMetadata(SameScopeMetadataKey, constructor) || []

  const deps = paramTypes.map((type, index) => {
    if (sameScopeParams[index]) {
      return createOrGetInstanceInScope(type, scope)
    }

    if (paramAnnotations[index] !== null) {
      let metadata: any[] = paramAnnotations[index]
      metadata = Array.isArray(metadata) ? metadata : [metadata]
      const inject: Inject | undefined = metadata.find((factory) => factory instanceof Inject)
      if (inject && inject.token) {
        return InjectableFactory.getInstanceByToken(inject.token)
      }
    }

    return InjectableFactory.getInstance(type)
  })

  const newInstance = new constructor(...deps)

  setInstanceInScope(constructor, scope, newInstance)
  return newInstance
}

function setInstanceInScope<T>(constructor: ConstructorOf<T>, scope: Scope, newInstance: Instance) {
  const scopeMap: ScopeMap<Scope, Instance> = map.get(constructor) || new Map()

  scopeMap.set(scope, newInstance)
  map.set(constructor, scopeMap)
  newInstance[CleanupSymbol] = () => {
    newInstance.destroy()
    scopeMap.delete(scope)
  }

  if (isSSREnabled()) {
    ayanamiInstances.set(scope, (ayanamiInstances.get(scope) || []).concat(newInstance))
  }
}

function getInstanceFrom<T>(constructor: ConstructorOf<T>, scope: Scope): T | undefined {
  const scopeMap = map.get(constructor)

  return scopeMap && scopeMap.get(scope)
}

export function createScopeWithRequest(req: Request, scope: any | undefined) {
  if (!scope) {
    return req
  }
  if (reqMap.has(req)) {
    const scopes = reqMap.get(req)!
    if (scopes.has(scope)) {
      return scopes.get(scope)!
    } else {
      const reqScope = { req, scope }
      scopes.set(scope, reqScope)
      return reqScope
    }
  } else {
    const reqScopeMap = new Map()
    const reqScope = { req, scope }
    reqScopeMap.set(scope, reqScope)
    reqMap.set(req, reqScopeMap)
    return reqScope
  }
}

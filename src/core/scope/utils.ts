import { InjectableFactory } from '@asuka/di'

import { ConstructorOf } from '../types'
import { Scope } from './type'
import { SameScopeMetadataKey } from './same-scope-decorator'
import { CleanupSymbol, SSREnabled } from '../../ssr'

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
  const constructorParams: ConstructorOf<any>[] =
    Reflect.getMetadata('design:paramtypes', constructor) || []

  const sameScopeParams: number[] = Reflect.getMetadata(SameScopeMetadataKey, constructor) || []
  const deps = constructorParams.map((paramConstructor, index) => {
    if (sameScopeParams[index]) {
      return createOrGetInstanceInScope(paramConstructor, scope)
    } else {
      return InjectableFactory.getInstance(paramConstructor)
    }
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

  if (SSREnabled) {
    ayanamiInstances.set(scope, (ayanamiInstances.get(scope) || []).concat(newInstance))
  }
}

function getInstanceFrom<T>(constructor: ConstructorOf<T>, scope: Scope): T | undefined {
  const scopeMap = map.get(constructor)

  return scopeMap && scopeMap.get(scope)
}

import { InjectableFactory, Provider } from '@asuka/di'

import { ConstructorOf } from '../types'
import { Scope } from './type'

type ScopeMap<K, V> = Map<K, V>

type Instance = any

type Key = ConstructorOf<Instance>

const map: Map<Key, ScopeMap<Scope, Instance>> = new Map()

export function createNewInstance<T>(constructor: ConstructorOf<T>, providers: Provider[] = []): T {
  return InjectableFactory.injector
    .resolveAndCreateChild([...providers, constructor])
    .get(constructor)
}

export function createOrGetInstanceInScope<T>(
  constructor: ConstructorOf<T>,
  scope: Scope,
  providers: Provider[] = [],
): T {
  const instanceAtScope = getInstanceFrom(constructor, scope)

  return instanceAtScope ? instanceAtScope : createInstanceInScope(constructor, scope, providers)
}

function createInstanceInScope<T>(
  constructor: ConstructorOf<T>,
  scope: Scope,
  providers: Provider[],
): T {
  const newInstance = createNewInstance(constructor, providers)

  setInstanceInScope(constructor, scope, newInstance)

  return newInstance
}

function setInstanceInScope<T>(constructor: ConstructorOf<T>, scope: Scope, newInstance: Instance) {
  const scopeMap: ScopeMap<Scope, Instance> = map.get(constructor) || new Map()

  scopeMap.set(scope, newInstance)
  map.set(constructor, scopeMap)
}

function getInstanceFrom<T>(constructor: ConstructorOf<T>, scope: Scope): T | undefined {
  const scopeMap = map.get(constructor)

  return scopeMap && scopeMap.get(scope)
}

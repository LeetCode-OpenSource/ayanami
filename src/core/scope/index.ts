import { InjectableFactory } from '@asuka/di'

import { ConstructorOf } from '../types'
import { ScopeConfig } from './type'
import { createOrGetInstanceInScope, createScopeWithRequest } from './utils'
import { SameScope } from './same-scope-decorator'

export { ScopeConfig, SameScope, createScopeWithRequest }

export const TransientScope = Symbol('scope:transient')

export const SingletonScope = Symbol('scope:singleton')

export function getInstanceWithScope<T>(
  constructor: ConstructorOf<T>,
  scope: ScopeConfig['scope'] = SingletonScope,
): T {
  switch (scope) {
    case SingletonScope:
      return InjectableFactory.getInstance(constructor)
    case TransientScope:
      return InjectableFactory.initialize(constructor)
    default:
      return createOrGetInstanceInScope(constructor, scope)
  }
}

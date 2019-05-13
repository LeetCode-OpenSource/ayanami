import { InjectableFactory } from '@asuka/di'
import { get } from 'lodash'

import { ConstructorOf } from '../types'
import { ScopeConfig } from './type'
import { createNewInstance, createOrGetInstanceInScope } from './utils'

export { ScopeConfig }

export const TransientScope = Symbol('scope:transient')

export const SingletonScope = Symbol('scope:singleton')

export function getInstanceWithScope<T>(constructor: ConstructorOf<T>, config?: ScopeConfig): T {
  const scope = get(config, 'scope', SingletonScope)

  switch (scope) {
    case SingletonScope:
      return InjectableFactory.getInstance(constructor)
    case TransientScope:
      return createNewInstance(constructor)
    default:
      return createOrGetInstanceInScope(constructor, scope)
  }
}

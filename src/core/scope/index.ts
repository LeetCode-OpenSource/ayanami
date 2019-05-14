import { InjectableFactory, ValueProvider } from '@asuka/di'
import { get } from 'lodash'

import { ConstructorOf } from '../types'
import { ScopeConfig } from './type'
import { createNewInstance, createOrGetInstanceInScope } from './utils'
import { getSameScopeInjectionParams, SameScope } from './same-scope-decorator'

export { ScopeConfig, SameScope }

export const TransientScope = Symbol('scope:transient')

export const SingletonScope = Symbol('scope:singleton')

export function getInstanceWithScope<T>(constructor: ConstructorOf<T>, config?: ScopeConfig): T {
  const scope = get(config, 'scope', SingletonScope)

  const providers = getSameScopeInjectionParams(constructor).map(
    (sameScopeInjectionParam): ValueProvider => ({
      provide: sameScopeInjectionParam,
      useValue: getInstanceWithScope(sameScopeInjectionParam, { scope }),
    }),
  )

  switch (scope) {
    case SingletonScope:
      return InjectableFactory.getInstance(constructor)
    case TransientScope:
      return createNewInstance(constructor, providers)
    default:
      return createOrGetInstanceInScope(constructor, scope, providers)
  }
}

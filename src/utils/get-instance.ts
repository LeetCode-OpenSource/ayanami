import { InjectableConfig, InjectableFactory } from '@asuka/di'

import { ConstructorOf } from '../types'

export function getInstance<M>(constructor: ConstructorOf<M>, config?: InjectableConfig): M {
  const providers = config ? config.providers : []
  return InjectableFactory.injector.resolveAndCreateChild(providers).get(constructor)
}

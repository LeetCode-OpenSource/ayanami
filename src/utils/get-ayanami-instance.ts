import { InjectableConfig, InjectableFactory } from '@asuka/di'

import { Ayanami } from '../ayanami'
import { ConstructorOf } from '../types'

export function getAyanamiInstance<M extends Ayanami<S>, S>(
  ayanami: ConstructorOf<M>,
  config?: InjectableConfig,
): M {
  const providers = config ? config.providers : []
  return InjectableFactory.injector.resolveAndCreateChild(providers).get(ayanami)
}

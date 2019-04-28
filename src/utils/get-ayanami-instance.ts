import { InjectableConfig, InjectableFactory } from '@asuka/di'

import { Ayanami } from '../ayanami'
import { ConstructorOf } from '../types'
import { isTransient } from '../decorators/pattern-related'

import { copyAyanami } from './copy-ayanami'

export function getAyanamiInstance<M extends Ayanami<S>, S>(
  ayanami: ConstructorOf<M>,
  config?: InjectableConfig,
): M {
  if (isTransient(ayanami)) {
    return copyAyanami(ayanami, config)
  } else {
    const providers = config ? config.providers : []
    return InjectableFactory.injector.resolveAndCreateChild(providers).get(ayanami)
  }
}

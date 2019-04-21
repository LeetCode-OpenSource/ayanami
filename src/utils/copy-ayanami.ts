import { InjectableConfig, InjectableFactory, InjectionToken } from '@asuka/di'

import { Ayanami } from '../ayanami'
import { ConstructorOf } from '../types'

export function copyAyanami<M extends Ayanami<any>>(
  ayanamiConstructor: ConstructorOf<M>,
  config?: InjectableConfig,
) {
  const token = new InjectionToken<Ayanami<any>>(`copied ${ayanamiConstructor.name}`)
  const providers = config ? config.providers : []

  const injector = InjectableFactory.injector.resolveAndCreateChild([
    { provide: token, useClass: ayanamiConstructor },
    ...providers,
  ])

  return injector.get(token) as M extends Ayanami<infer _S> ? M : never
}

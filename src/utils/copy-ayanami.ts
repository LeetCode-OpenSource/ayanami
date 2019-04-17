import { Injectable, InjectableConfig, Inject, InjectableFactory, InjectionToken } from '@asuka/di'

import { Ayanami } from '../ayanami'
import { ConstructorOf } from '../types'

export function copyAyanami<M extends Ayanami<any>>(
  ayanamiConstructor: ConstructorOf<M>,
  config?: InjectableConfig,
) {
  const token = new InjectionToken<Ayanami<any>>(`copied ${ayanamiConstructor.name}`)
  const providers = config ? config.providers : []

  @Injectable({ providers: [{ provide: token, useClass: ayanamiConstructor }, ...providers] })
  class CopiedAyanamiService {
    constructor(@Inject(token) public ayanami: any) {}
  }

  return InjectableFactory.getInstance(CopiedAyanamiService).ayanami as M extends Ayanami<infer _S>
    ? M
    : never
}

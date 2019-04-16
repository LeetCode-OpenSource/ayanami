import { Injectable, Inject, InjectableFactory, InjectionToken } from '@asuka/di'

import { Ayanami } from '../ayanami'
import { combineWithIkari } from '../ikari'
import { ConstructorOf } from '../types'

export function copyAyanami<M extends Ayanami<any>>(ayanamiConstructor: ConstructorOf<M>) {
  const token = new InjectionToken<Ayanami<any>>(`copied ${ayanamiConstructor.name}`)

  @Injectable({ providers: [{ provide: token, useClass: ayanamiConstructor }] })
  class CopiedAyanamiService {
    constructor(@Inject(token) public ayanami: Ayanami<any>) {}
  }

  const ayanami = InjectableFactory.getInstance(CopiedAyanamiService).ayanami

  combineWithIkari(ayanami)

  return ayanami as M extends Ayanami<infer _S> ? M : never
}

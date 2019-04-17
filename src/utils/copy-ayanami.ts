import { Injectable, Inject, InjectableFactory, InjectionToken } from '@asuka/di'

import { Ayanami } from '../ayanami'
import { ConstructorOf } from '../types'

export function copyAyanami<M extends Ayanami<any>>(ayanamiConstructor: ConstructorOf<M>) {
  const token = new InjectionToken<Ayanami<any>>(`copied ${ayanamiConstructor.name}`)

  @Injectable({ providers: [{ provide: token, useClass: ayanamiConstructor }] })
  class CopiedAyanamiService {
    constructor(@Inject(token) public ayanami: any) {}
  }

  return InjectableFactory.getInstance(CopiedAyanamiService).ayanami as M extends Ayanami<infer _S>
    ? M
    : never
}

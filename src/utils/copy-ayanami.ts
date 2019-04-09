import { Ayanami } from '../ayanami'
import { ConstructorOf, ConstructorOfAyanami } from '../types'

import { setup } from './setup-ayanami'

export function copyAyanami<M extends Ayanami<any>>(ayanamiConstructor: ConstructorOf<M>) {
  const Constructor = ayanamiConstructor as ConstructorOfAyanami<M, any>
  const ayanami = Constructor.getInstance()

  setup(ayanami)

  return ayanami as M extends Ayanami<infer _S> ? M : never
}

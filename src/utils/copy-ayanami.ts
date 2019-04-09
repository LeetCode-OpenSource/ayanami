import { Ayanami } from '../ayanami'
import { ConstructorOf, ConstructorOfAyanami } from '../types'

import { setup } from './setup-ayanami'

export function copyAyanami<M extends Ayanami<S>, S>(ayanamiConstructor: ConstructorOf<M>): M {
  const Constructor = ayanamiConstructor as ConstructorOfAyanami<M, any>
  const ayanami = Constructor.getInstance()

  setup(ayanami)

  return ayanami
}

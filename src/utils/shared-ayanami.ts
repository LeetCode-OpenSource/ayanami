import { ConstructorOf } from '../types'
import { Ayanami } from '../ayanami'
import { sharedInstanceSymbol } from '../symbols'

import { copyAyanami } from './copy-ayanami'

export function sharedAyanami<M extends Ayanami<S>, S>(ayanamiConstructor: ConstructorOf<M>): M {
  if (Reflect.hasMetadata(sharedInstanceSymbol, ayanamiConstructor)) {
    return Reflect.getMetadata(sharedInstanceSymbol, ayanamiConstructor)
  } else {
    const ayanami = copyAyanami(ayanamiConstructor)

    Reflect.defineMetadata(sharedInstanceSymbol, ayanami, ayanamiConstructor)

    return ayanami
  }
}

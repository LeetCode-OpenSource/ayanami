import { ConstructorOf, ConstructorOfAyanami } from '../types'
import { Ayanami } from '../ayanami'
import { sharedInstanceSymbol } from '../symbols'

import { setup } from './setup-ayanami'

export function shared<M extends Ayanami<S>, S>(ayanamiConstructor: ConstructorOf<M>): M {
  if (Reflect.hasMetadata(sharedInstanceSymbol, ayanamiConstructor)) {
    return Reflect.getMetadata(sharedInstanceSymbol, ayanamiConstructor)
  } else {
    const Constructor = ayanamiConstructor as ConstructorOfAyanami<M, any>
    const ayanami = Constructor.getInstance()

    setup(ayanami)

    Reflect.defineMetadata(sharedInstanceSymbol, ayanami, ayanamiConstructor)

    return ayanami
  }
}

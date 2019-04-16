import { InjectableFactory, Injectable, Provider } from '@asuka/di'

import { Pattern, ConstructorOf } from '../types'
import { Ayanami } from '../ayanami'
import { patternSymbol } from '../symbols'

import { copyAyanami } from './copy-ayanami'

export function createPatternDecorator(pattern: Pattern) {
  return (config?: { providers: Provider[] }) => (target: Ayanami<any>) => {
    Reflect.defineMetadata(patternSymbol, pattern, target)
    Injectable(config)(target)
  }
}

export function getAyanamiInstance<M extends Ayanami<S>, S>(ayanami: ConstructorOf<M>): M {
  if (Reflect.getMetadata(patternSymbol, ayanami) === Pattern.Transient) {
    return copyAyanami(ayanami)
  } else {
    return InjectableFactory.getInstance(ayanami)
  }
}

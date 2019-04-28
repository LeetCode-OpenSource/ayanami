import { InjectableFactory, Injectable, InjectableConfig } from '@asuka/di'

import { Pattern, ConstructorOf } from '../types'
import { Ayanami } from '../ayanami'
import { patternSymbol } from '../symbols'

import { copyAyanami } from './copy-ayanami'
import { getAyanamiName } from './get-ayanami-name'

function getParamTypes(target: any): any[] {
  return Reflect.getMetadata('design:paramtypes', target) || []
}

function makeSureNotTransientParams(target: any) {
  getParamTypes(target).forEach((param) => {
    if (Ayanami.isPrototypeOf(param) && isTransient(param)) {
      throw new Error(
        `Since ${getAyanamiName(
          param,
        )} was decorated by @Transient(), it can only used by 'useHooks' or 'connect'.`,
      )
    }
  })
}

export function createPatternDecorator(pattern: Pattern) {
  return (config?: InjectableConfig) => (target: any) => {
    makeSureNotTransientParams(target)

    Reflect.defineMetadata(patternSymbol, pattern, target)
    Injectable(config)(target)
  }
}

export function isTransient<M extends Ayanami<S>, S>(ayanami: ConstructorOf<M>): boolean {
  return Reflect.getMetadata(patternSymbol, ayanami) === Pattern.Transient
}

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

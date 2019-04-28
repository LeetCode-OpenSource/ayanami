import { Injectable, InjectableConfig } from '@asuka/di'

import { Pattern, ConstructorOf } from '../types'
import { patternSymbol } from '../symbols'

function getParamTypes(target: any): any[] {
  return Reflect.getMetadata('design:paramtypes', target) || []
}

function makeSureNotTransientParams(target: any) {
  getParamTypes(target).forEach((param) => {
    if (typeof param === 'function' && isTransient(param)) {
      throw new Error(
        `Since ${
          param.name
        } was decorated by @Transient(), it can only used by 'useHooks' or 'connect'.`,
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

export function isTransient(target: ConstructorOf<any>): boolean {
  return Reflect.getMetadata(patternSymbol, target) === Pattern.Transient
}

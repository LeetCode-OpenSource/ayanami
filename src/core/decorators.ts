import { Observable } from 'rxjs'
import { Draft } from 'immer'

import {
  IMMER_REDUCER_DECORATOR_SYMBOL,
  REDUCER_DECORATOR_SYMBOL,
  EFFECT_DECORATOR_SYMBOL,
  DEFINE_ACTION_DECORATOR_SYMBOL,
} from './symbols'
import { EffectAction } from './types'

function createActionDecorator(decoratorSymbol: symbol) {
  return () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const constructor = target.constructor
    const decoratedActionNames: string[] = Reflect.getMetadata(decoratorSymbol, constructor) || []
    Reflect.defineMetadata(decoratorSymbol, [...decoratedActionNames, propertyKey], constructor)
    return descriptor
  }
}

interface DecoratorReturnType<V> {
  (target: any, propertyKey: string, descriptor: { value?: V }): PropertyDescriptor
}

export const ImmerReducer: <S = any>() => DecoratorReturnType<
  (state: Draft<S>, params: any) => undefined | void
> = createActionDecorator(IMMER_REDUCER_DECORATOR_SYMBOL)

export const Reducer: <S = any>() => DecoratorReturnType<
  (state: S, params: any) => S
> = createActionDecorator(REDUCER_DECORATOR_SYMBOL)

export const Effect: <A = any, S = any>() => DecoratorReturnType<
  (action: Observable<A>, state$: Observable<S>) => Observable<EffectAction>
> = createActionDecorator(EFFECT_DECORATOR_SYMBOL)

export const DefineAction: () => any = createActionDecorator(DEFINE_ACTION_DECORATOR_SYMBOL)

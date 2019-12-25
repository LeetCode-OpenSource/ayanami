import { Observable } from 'rxjs'
import { Draft } from 'immer'

import {
  IMMER_REDUCER_DECORATOR_SYMBOL,
  REDUCER_DECORATOR_SYMBOL,
  EFFECT_DECORATOR_SYMBOL,
  DEFINE_ACTION_DECORATOR_SYMBOL,
  ASYNC_GENERATOR_DECORATOR_SYMBOL,
  ASYNC_GENERATOR_SCHEDULER_SYMBOL,
} from './symbols'
import { Action } from './state'

function createActionDecorator(decoratorSymbol: symbol) {
  return () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const constructor = target.constructor
    const decoratedActionNames: string[] = Reflect.getMetadata(decoratorSymbol, constructor) || []
    decoratedActionNames.push(propertyKey)
    Reflect.defineMetadata(decoratorSymbol, decoratedActionNames, constructor)
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

export const Effect: <A = any>() => DecoratorReturnType<
  (action: Observable<A>) => Observable<Action<unknown>>
> = createActionDecorator(EFFECT_DECORATOR_SYMBOL)

export type AsyncGeneratorEffectMethod = <T = any, S = any>() => DecoratorReturnType<
  (action: T, state?: S) => AsyncGenerator<Action, void, unknown>
>

export const enum AsyncGeneratorEffectSchedulerType {
  Exhaust,
  Switch,
  Merge,
}

function createAsyncGeneratorDecorator(schedulerType: AsyncGeneratorEffectSchedulerType) {
  return () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const decorated = createActionDecorator(ASYNC_GENERATOR_DECORATOR_SYMBOL)()(
      target,
      propertyKey,
      descriptor,
    )
    Reflect.defineMetadata(ASYNC_GENERATOR_SCHEDULER_SYMBOL, schedulerType, target)
    return decorated
  }
}

export const AsyncGeneratorEffect: {
  Exhaust: AsyncGeneratorEffectMethod
  Switch: AsyncGeneratorEffectMethod
  Merge: AsyncGeneratorEffectMethod
} = {
  Exhaust: createAsyncGeneratorDecorator(AsyncGeneratorEffectSchedulerType.Exhaust),
  Switch: createAsyncGeneratorDecorator(AsyncGeneratorEffectSchedulerType.Switch),
  Merge: createAsyncGeneratorDecorator(AsyncGeneratorEffectSchedulerType.Merge),
}

export const DefineAction: () => any = createActionDecorator(DEFINE_ACTION_DECORATOR_SYMBOL)

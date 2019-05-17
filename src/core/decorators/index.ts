import { Observable } from 'rxjs'

import { defineActionSymbols, effectSymbols, reducerSymbols } from '../symbols'
import { EffectAction } from '../types'
import { createActionDecorator } from './action-related'

export * from './action-related'

interface DecoratorReturnType<V> {
  (target: any, propertyKey: string, descriptor: { value?: V; get?(): V }): void
}

export const Reducer: <S = any>() => DecoratorReturnType<
  (state: S, params?: any) => S
> = createActionDecorator(reducerSymbols)

export const Effect: <A = any, S = any>() => DecoratorReturnType<
  (action: Observable<A>, state$: Observable<S>) => Observable<EffectAction>
> = createActionDecorator(effectSymbols)

export const DefineAction = createActionDecorator(defineActionSymbols)

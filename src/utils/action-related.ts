import { EffectAction } from '../types'
import { Ayanami } from '../ayanami'
import { allActionSymbols, ActionSymbols } from '../symbols'

export function createActionDecorator(symbols: ActionSymbols) {
  return () => ({ constructor }: any, propertyKey: string) => {
    addActionName(symbols, constructor, propertyKey)
  }
}

function addActionName(symbols: ActionSymbols, constructor: Function, actionName: string) {
  const decoratedActionNames = Reflect.getMetadata(symbols.decorator, constructor) || []
  Reflect.defineMetadata(symbols.decorator, [...decoratedActionNames, actionName], constructor)
}

export function getActionNames(symbols: ActionSymbols, constructor: Function): string[] {
  return Reflect.getMetadata(symbols.decorator, constructor) || []
}

export function getAllActionFactories<M extends Ayanami<any>>(target: M) {
  return getAllActionNames(target).reduce(
    (result: any, name: string) => ({
      ...result,
      [name]: (params: any): EffectAction<M> => ({
        ayanami: target,
        actionName: name,
        params,
      }),
    }),
    {},
  )
}

function getAllActionNames<M extends Ayanami<S>, S>(target: M) {
  return allActionSymbols.reduce<string[]>(
    (result, symbols) => [...result, ...getActionNames(symbols, target.constructor)],
    [],
  )
}

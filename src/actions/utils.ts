import { ActionMethod, ActionMethodOfAyanami, EffectAction } from '../types'
import { Ayanami } from '../ayanami'
import { allActionSymbols } from './symbols'

export interface ActionSymbols {
  decorator: Symbol
  actions: Symbol
}

export function createActionDecorator(symbols: ActionSymbols) {
  return () => ({ constructor }: any, propertyKey: string) => {
    addActionName(symbols, constructor, propertyKey)
  }
}

export function addActionName(symbols: ActionSymbols, constructor: Function, actionName: string) {
  const decoratedActionNames = Reflect.getMetadata(symbols.decorator, constructor) || []
  Reflect.defineMetadata(symbols.decorator, [...decoratedActionNames, actionName], constructor)
}

export function getActionNames(symbols: ActionSymbols, constructor: Function): string[] {
  return Reflect.getMetadata(symbols.decorator, constructor) || []
}

export function updateActions(
  symbols: ActionSymbols,
  target: Ayanami<any>,
  actions: { [key: string]: ActionMethod<any> },
) {
  Reflect.defineMetadata(symbols.actions, { ...getActions(symbols, target), ...actions }, target)
}

export function getActions(
  symbols: ActionSymbols,
  target: Ayanami<any>,
): { [key: string]: ActionMethod<any> } {
  return Reflect.getMetadata(symbols.actions, target) || {}
}

export function getAllActions<M extends Ayanami<S>, S>(target: M) {
  return allActionSymbols.reduce(
    (result, symbols) => ({ ...result, ...getActions(symbols, target) }),
    {},
  ) as ActionMethodOfAyanami<M, S>
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

export function getAllActionNames<M extends Ayanami<S>, S>(target: M) {
  return allActionSymbols.reduce<string[]>(
    (result, symbols) => [...result, ...getActionNames(symbols, target.constructor)],
    [],
  )
}

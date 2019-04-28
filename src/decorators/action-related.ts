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

export function getAllActionNames(instance: { constructor: Function }) {
  return allActionSymbols.reduce<string[]>(
    (result, symbols) => [...result, ...getActionNames(symbols, instance.constructor)],
    [],
  )
}

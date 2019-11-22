export interface ActionSymbols {
  readonly decorator: unique symbol
  readonly actions: unique symbol
}

export const EFFECT_DECORATOR_SYMBOL: unique symbol = Symbol('decorator:effect')
export const EFFECT_ACTION_SYMBOL: unique symbol = Symbol('actions:effect')

export const REDUCER_DECORATOR_SYMBOL: unique symbol = Symbol('decorator:reducer')
export const REDUCER_ACTION_SYMBOL: unique symbol = Symbol('actions:reducer')

export const IMMER_REDUCER_DECORATOR_SYMBOL: unique symbol = Symbol('decorator:immer-reducer')
export const IMMER_REDUCER_ACTION_SYMBOL: unique symbol = Symbol('actions:immer-reducer')

export const DEFINE_ACTION_DECORATOR_SYMBOL: unique symbol = Symbol('decorator:define-action')
export const DEFINE_ACTION_ACTION_SYMBOL: unique symbol = Symbol('actions:define-action')

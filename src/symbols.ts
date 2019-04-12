export interface ActionSymbols {
  decorator: Symbol
  actions: Symbol
}

export const effectSymbols: ActionSymbols = {
  decorator: Symbol('decorator:effect'),
  actions: Symbol('actions:effect'),
}

export const reducerSymbols: ActionSymbols = {
  decorator: Symbol('decorator:reducer'),
  actions: Symbol('actions:reducer'),
}

export const allActionSymbols = [effectSymbols, reducerSymbols]

export const sharedInstanceSymbol = Symbol('shared:instance')

export interface ActionSymbols {
  decorator: symbol
  actions: symbol
}

export const effectSymbols: ActionSymbols = {
  decorator: Symbol('decorator:effect'),
  actions: Symbol('actions:effect'),
}

export const reducerSymbols: ActionSymbols = {
  decorator: Symbol('decorator:reducer'),
  actions: Symbol('actions:reducer'),
}

export const immerReducerSymbols: ActionSymbols = {
  decorator: Symbol('decorator:immer-reducer'),
  actions: Symbol('actions:immer-reducer'),
}

export const defineActionSymbols: ActionSymbols = {
  decorator: Symbol('decorator:defineAction'),
  actions: Symbol('actions:defineAction'),
}

export const allActionSymbols = [
  effectSymbols,
  reducerSymbols,
  immerReducerSymbols,
  defineActionSymbols,
]

export const ikariSymbol = Symbol('ikari')

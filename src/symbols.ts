export interface ActionSymbols {
  decorator: Symbol
  actions: Symbol
}

type EffectSymbols = ActionSymbols & {
  setStateAction: Symbol
}

export const effectSymbols: EffectSymbols = {
  decorator: Symbol('decorator:effect'),
  actions: Symbol('actions:effect'),
  setStateAction: Symbol('actions:setState'),
}

export const reducerSymbols: ActionSymbols = {
  decorator: Symbol('decorator:reducer'),
  actions: Symbol('actions:reducer'),
}

export const allActionSymbols = [effectSymbols, reducerSymbols]

export const sharedInstanceSymbol = Symbol('shared:instance')

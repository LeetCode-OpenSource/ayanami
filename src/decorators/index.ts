import { Pattern } from '../types'
import { defineActionSymbols, effectSymbols, reducerSymbols } from '../symbols'

import { createPatternDecorator } from './pattern-related'
import { createActionDecorator } from './action-related'

export * from './pattern-related'
export * from './action-related'

export const Reducer = createActionDecorator(reducerSymbols)
export const Effect = createActionDecorator(effectSymbols)
export const DefineAction = createActionDecorator(defineActionSymbols)

export const Singleton = createPatternDecorator(Pattern.Singleton)
export const Transient = createPatternDecorator(Pattern.Transient)

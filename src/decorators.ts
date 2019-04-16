import { Pattern } from './types'
import { createActionDecorator, createPatternDecorator } from './utils'
import { defineActionSymbols, effectSymbols, reducerSymbols } from './symbols'

export const Reducer = createActionDecorator(reducerSymbols)
export const Effect = createActionDecorator(effectSymbols)
export const DefineAction = createActionDecorator(defineActionSymbols)

export const Singleton = createPatternDecorator(Pattern.Singleton)
export const Transient = createPatternDecorator(Pattern.Transient)

import { createActionDecorator } from './utils'
import { effectSymbols, reducerSymbols, defineActionSymbols } from './symbols'

export const Reducer = createActionDecorator(reducerSymbols)
export const Effect = createActionDecorator(effectSymbols)
export const DefineAction = createActionDecorator(defineActionSymbols)

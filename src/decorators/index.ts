import { defineActionSymbols, effectSymbols, reducerSymbols } from '../symbols'

import { createActionDecorator } from './action-related'

export * from './action-related'

export const Reducer = createActionDecorator(reducerSymbols)
export const Effect = createActionDecorator(effectSymbols)
export const DefineAction = createActionDecorator(defineActionSymbols)

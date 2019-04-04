import { createActionDecorator } from './utils'
import { effectSymbols, reducerSymbols } from './symbols'

export const Reducer = createActionDecorator(reducerSymbols)
export const Effect = createActionDecorator(effectSymbols)

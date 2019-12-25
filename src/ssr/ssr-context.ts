import { createContext } from 'react'
import { State } from '../core/state'

export const SSRStates = new Map<any, State<any>>()

export const SSRSharedContext = createContext<string | null>(null)
export const SSRContext = createContext<any>(null)

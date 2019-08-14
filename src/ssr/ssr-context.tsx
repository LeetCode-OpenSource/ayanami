import { Request } from 'express'
import { createContext } from 'react'

export const SSRContext = createContext<Request | null>(null)

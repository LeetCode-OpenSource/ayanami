import { Request, Response } from 'express'

export interface SSRMeta<Payload = {}> {
  middleware?: (req: Request, res: Response) => Promise<Payload> | Payload
  action: string
}
export const epicsMap = new Map<object, SSRMeta>()

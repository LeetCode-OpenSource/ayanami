import { Ayanami } from '../ayanami'
import { EffectAction } from '../types'
import { getAllActionNames } from '../decorators'

export function getEffectActionFactories(target: Ayanami<any>): any {
  return getAllActionNames(target).reduce(
    (result: any, name: string) => ({
      ...result,
      [name]: (params: any): EffectAction => ({
        ayanami: target,
        actionName: name,
        params,
      }),
    }),
    {},
  )
}

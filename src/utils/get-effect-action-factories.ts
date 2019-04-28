import { Ayanami } from '../ayanami'
import { EffectAction } from '../types'
import { getAllActionNames } from '../decorators/action-related'

export function getEffectActionFactories(target: Ayanami<any>) {
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

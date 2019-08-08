import { EffectAction } from '../core/types'

export const TERMINATE_ACTION: EffectAction = {
  actionName: Symbol('terminate'),
  params: null,
} as any

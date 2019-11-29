import { Action } from '../core'

export const TERMINATE_ACTION: Action<null> = {
  type: Symbol('terminate'),
  payload: null,
}

import { Ayanami } from '../ayanami'
import { combineWithIkari } from '../ikari'
import { ActionMethodOfAyanami } from '../types'

export function getAllActionsForTest<A extends Ayanami<any>>(ayanami: A) {
  return combineWithIkari(ayanami).triggerActions as A extends Ayanami<infer S>
    ? ActionMethodOfAyanami<A, S>
    : never
}

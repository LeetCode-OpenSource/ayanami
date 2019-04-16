import { Ayanami } from '../ayanami'
import { combineWithIkari } from '../ikari'
import { ActionMethodOfAyanami } from '../types'

export function getAllActionsForTest<A extends Ayanami<S>, S>(ayanami: A) {
  return combineWithIkari(ayanami).triggerActions as ActionMethodOfAyanami<A, S>
}

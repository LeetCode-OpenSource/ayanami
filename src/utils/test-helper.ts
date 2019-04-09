import { Ayanami } from '../ayanami'
import { ConstructorOf } from '../types'

import { getAllActions } from './action-related'
import { sharedAyanami } from './shared-ayanami'

export function getAllActionsForTest<A extends Ayanami<S>, S>(ayanami: ConstructorOf<A> | A) {
  if (ayanami instanceof Ayanami) {
    return getAllActions<A, S>(ayanami)
  } else {
    return getAllActions<A, S>(sharedAyanami(ayanami))
  }
}

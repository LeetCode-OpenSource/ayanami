import { Ayanami } from '../ayanami'
import { ConstructorOf } from '../types'

import { getAllActions } from './action-related'
import { sharedAyanami } from './shared-ayanami'

export function getAllActionsForTest<A extends Ayanami<S>, S>(
  ayanamiConstructor: ConstructorOf<A>,
) {
  return getAllActions<A, S>(sharedAyanami(ayanamiConstructor))
}

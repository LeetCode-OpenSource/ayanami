import { Ayanami } from '../ayanami'
import { ConstructorOf } from '../types'

import { getAllActions } from './action-related'
import { shared } from './shared'

export function getAllActionsForTest<A extends Ayanami<S>, S>(
  ayanamiConstructor: ConstructorOf<A>,
) {
  return getAllActions<A, S>(shared(ayanamiConstructor))
}

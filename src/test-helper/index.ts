import { InjectableFactory } from '@asuka/di'

import { Ayanami } from '../ayanami'
import { ConstructorOf } from '../types'

import { getAllActions, setup } from '../utils'

export function getAllActionsForTest<A extends Ayanami<S>, S>(ayanami: ConstructorOf<A> | A) {
  if (ayanami instanceof Ayanami) {
    setup(ayanami)
    return getAllActions<A, S>(ayanami)
  } else {
    const ayanamiInstance = InjectableFactory.getInstance(ayanami)
    setup(ayanamiInstance)
    return getAllActions<A, S>(ayanamiInstance)
  }
}

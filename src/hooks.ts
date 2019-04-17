import { useState, useEffect } from 'react'

import { ActionMethodOfAyanami } from './types'
import { Ayanami } from './ayanami'
import { combineWithIkari } from './ikari'

export type HooksResult<M extends Ayanami<S>, S> = [Readonly<S>, ActionMethodOfAyanami<M, S>]

export function useAyanami<M extends Ayanami<State>, State>(ayanami: M) {
  const ikari = combineWithIkari(ayanami)
  const actions = ikari.triggerActions
  const [state, setState] = useState<State>(ayanami.getState())

  useEffect(() => {
    const subscription = ayanami.getState$().subscribe(setState)
    return () => subscription.unsubscribe()
  }, [])

  return [state, actions] as HooksResult<M, State>
}

import { useState, useEffect, useMemo } from 'react'

import { ActionMethodOfAyanami } from './types'
import { Ayanami } from './ayanami'
import { combineWithIkari } from './ikari'

export type HooksResult<M extends Ayanami<S>, S> = [Readonly<S>, ActionMethodOfAyanami<M, S>]

export function useAyanami<M extends Ayanami<State>, State>(ayanami: M) {
  const ikari = useMemo(() => combineWithIkari(ayanami), [ayanami])
  const [state, setState] = useState<State>(() => ayanami.getState())

  useEffect(() => {
    const subscription = ayanami.getState$().subscribe(setState)
    return () => subscription.unsubscribe()
  }, [])

  return [state, ikari.triggerActions] as HooksResult<M, State>
}

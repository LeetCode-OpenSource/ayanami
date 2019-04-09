import { useState, useEffect } from 'react'

import { ActionMethodOfAyanami } from '../types'
import { Ayanami } from '../ayanami'

import { getAllActions } from './action-related'

export type HooksResult<M extends Ayanami<S>, S> = [Readonly<S>, ActionMethodOfAyanami<M, S>]

export function useAyanami<M extends Ayanami<State>, State>(ayanami: M): HooksResult<M, State> {
  const actions = getAllActions<M, State>(ayanami)
  const [state, setState] = useState<State>(ayanami.getState())

  useEffect(() => {
    const subscription = ayanami.getState$().subscribe(setState)
    return () => subscription.unsubscribe()
  }, [])

  return [state, actions]
}

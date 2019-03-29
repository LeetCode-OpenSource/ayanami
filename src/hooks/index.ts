import { useState, useEffect } from 'react'

import { ActionMethodOfAyanami, StateOfAyanami } from '../types'
import { Ayanami } from '../ayanami'
import { getAllActions } from '../actions'

export function useAyanami<M extends Ayanami<any>>(
  ayanami: M,
): [Readonly<StateOfAyanami<M>>, ActionMethodOfAyanami<M, StateOfAyanami<M>>] {
  const actions: ActionMethodOfAyanami<M, StateOfAyanami<M>> = getAllActions(ayanami)
  const [state, setState] = useState(ayanami.getState())

  useEffect(() => {
    const subscription = ayanami.state$.subscribe(setState)
    return () => subscription.unsubscribe()
  }, [])

  return [state, actions]
}

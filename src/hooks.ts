import { useState, useEffect } from 'react'

import { ActionMethodOfAyanami, ConstructorOf, ConstructorOfAyanami } from './types'
import { Ayanami } from './ayanami'
import { shared, getAllActions } from './utils'

export type HooksResult<M extends Ayanami<S>, S> = [Readonly<S>, ActionMethodOfAyanami<M, S>]

export function useAyanami<M extends Ayanami<State>, State>(
  ayanamiConstructor: ConstructorOf<M>,
): HooksResult<M, State> {
  const Constructor = ayanamiConstructor as ConstructorOfAyanami<M, State>
  const actions: ActionMethodOfAyanami<M, State> = getAllActions(shared(Constructor))
  const [state, setState] = useState<State>(Constructor.getState<M, State>())

  useEffect(() => {
    const subscription = Constructor.getState$().subscribe(setState as any)
    return () => subscription.unsubscribe()
  }, [])

  return [state, actions]
}

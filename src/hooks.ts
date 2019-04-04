import { useState, useEffect } from 'react'

import { ActionMethodOfAyanami, ConstructorOf, ConstructorOfAyanami } from './types'
import { Ayanami } from './ayanami'
import { shared, getAllActions } from './utils'

export function useAyanami<M extends Ayanami<S>, S>(
  ayanamiConstructor: ConstructorOf<M>,
): [Readonly<S>, ActionMethodOfAyanami<M, S>] {
  const Constructor = ayanamiConstructor as ConstructorOfAyanami<M, S>
  const actions: ActionMethodOfAyanami<M, S> = getAllActions(shared(Constructor))
  const [state, setState] = useState<S>(Constructor.getState())

  useEffect(() => {
    const subscription = Constructor.getState$().subscribe(setState)
    return () => subscription.unsubscribe()
  }, [])

  return [state, actions]
}

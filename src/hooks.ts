import { InjectableFactory } from '@asuka/di'
import * as React from 'react'

import { Ayanami, combineWithIkari, ActionMethodOfAyanami, ConstructorOf } from './core'

export type HooksResult<M extends Ayanami<S>, S> = [Readonly<S>, ActionMethodOfAyanami<M, S>]

export function useAyanamiInstance<M extends Ayanami<S>, S>(ayanami: M): HooksResult<M, S> {
  const ikari = React.useMemo(() => combineWithIkari(ayanami), [ayanami])
  const [state, setState] = React.useState<S>(() => ayanami.getState())

  React.useEffect(() => {
    const subscription = ayanami.getState$().subscribe(setState)
    return () => subscription.unsubscribe()
  }, [])

  return [state, ikari.triggerActions] as HooksResult<M, S>
}

export function useAyanami<M extends Ayanami<S>, S>(
  constructor: ConstructorOf<M>,
): M extends Ayanami<infer SS> ? HooksResult<M, SS> : HooksResult<M, S> {
  const ayanami = React.useMemo(() => InjectableFactory.getInstance(constructor), [constructor])

  return useAyanamiInstance<M, S>(ayanami) as any
}

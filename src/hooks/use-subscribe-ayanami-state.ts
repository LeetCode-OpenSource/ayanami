import * as React from 'react'
import { Subscription } from 'rxjs'

import { Ayanami } from '../core'

export function useSubscribeAyanamiState<M extends Ayanami<S>, S>(ayanami: M): S {
  const ayanamiRef = React.useRef<Ayanami<S> | null>(null)
  const subscriptionRef = React.useRef<Subscription | null>(null)

  const [state, setState] = React.useState<S>(() => ayanami.getState())

  if (ayanamiRef.current !== ayanami) {
    ayanamiRef.current = ayanami

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }

    if (ayanami) {
      subscriptionRef.current = ayanami.getState$().subscribe(setState)
    }
  }

  React.useEffect(
    () => () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    },
    [subscriptionRef],
  )

  return state
}

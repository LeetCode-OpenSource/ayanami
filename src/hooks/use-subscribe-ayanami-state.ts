import * as React from 'react'
import { Subscription } from 'rxjs'
import identity from 'lodash/identity'
import shallowEqual from 'shallowequal'
import { Ayanami } from '../core'

export function useSubscribeAyanamiState<M extends Ayanami<S>, S, U = S>(
  ayanami: M,
  selector: (state: S) => U = identity,
): unknown {
  const [state, setState] = React.useState<U>(() => selector(ayanami.getState()))

  const ayanamiRef = React.useRef<Ayanami<S> | null>(null)
  const subscriptionRef = React.useRef<Subscription | null>(null)
  const stateRef = React.useRef<U>(state)
  const isFirstRenderRef = React.useRef(true)

  if (ayanamiRef.current !== ayanami) {
    ayanamiRef.current = ayanami

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }

    if (ayanami) {
      subscriptionRef.current = ayanami.getState$().subscribe((moduleState) => {
        if (isFirstRenderRef.current) return
        if (selector === identity) {
          setState(selector(moduleState))
          stateRef.current = selector(moduleState)
        } else {
          const before = stateRef.current
          const after = selector(moduleState)
          if (!shallowEqual(before, after)) setState(after)
          stateRef.current = after
        }
      })
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

  isFirstRenderRef.current = false
  return state
}

import * as React from 'react'
import { Subscription } from 'rxjs'
import identity from 'lodash/identity'
import { shallowEqual } from './shallow-equal'
import { Ayanami } from '../core'

export function useSubscribeAyanamiState<M extends Ayanami<S>, S, U>(
  ayanami: M,
  selector: (state: S) => U = identity,
): unknown {
  const state = ayanami.getState()

  const ayanamiRef = React.useRef<Ayanami<S> | null>(null)
  const subscriptionRef = React.useRef<Subscription | null>(null)
  const stateRef = React.useRef<S>(state)

  const [, forceUpdate] = React.useState({})

  if (ayanamiRef.current !== ayanami) {
    ayanamiRef.current = ayanami

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }

    if (ayanami) {
      subscriptionRef.current = ayanami.getState$().subscribe((state) => {
        const before = selector(stateRef.current)
        const after = selector(state)
        if (!shallowEqual(before, after)) forceUpdate({})
        stateRef.current = state
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

  return selector(state)
}

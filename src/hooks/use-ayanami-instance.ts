import * as React from 'react'
import get from 'lodash/get'

import { ActionMethodOfAyanami, Ayanami, combineWithIkari } from '../core'
import { useSubscribeAyanamiState } from './use-subscribe-ayanami-state'

export interface UseAyanamiInstanceConfig<S = unknown, U = unknown> {
  destroyWhenUnmount?: boolean
  selector?: (state: S) => U
}

export type UseAyanamiInstanceResult<M extends Ayanami<S>, S, U> = [U, ActionMethodOfAyanami<M, S>]

export function useAyanamiInstance<M extends Ayanami<S>, S, U>(
  ayanami: M,
  config?: UseAyanamiInstanceConfig<S, U>,
): UseAyanamiInstanceResult<M, S, U> {
  const ikari = React.useMemo(() => combineWithIkari(ayanami), [ayanami])
  const state = useSubscribeAyanamiState(ayanami, config ? config.selector : undefined)

  React.useEffect(
    () => () => {
      const isDestroyWhenUnmount = get(config, 'destroyWhenUnmount', false)

      if (isDestroyWhenUnmount) {
        ayanami.destroy()
      }
    },
    [ayanami, config],
  )

  return [state, ikari.triggerActions] as UseAyanamiInstanceResult<M, S, U>
}

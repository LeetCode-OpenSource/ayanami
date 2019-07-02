import * as React from 'react'
import { get } from 'lodash'

import { ActionMethodOfAyanami, Ayanami, combineWithIkari } from '../core'
import { useSubscribeAyanamiState } from './use-subscribe-ayanami-state'

export interface UseAyanamiInstanceConfig {
  destroyWhenUnmount?: boolean
}

export type UseAyanamiInstanceResult<M extends Ayanami<S>, S> = [
  Readonly<S>,
  ActionMethodOfAyanami<M, S>
]

type Config = UseAyanamiInstanceConfig

type Result<M extends Ayanami<S>, S> = UseAyanamiInstanceResult<M, S>

export function useAyanamiInstance<M extends Ayanami<S>, S>(
  ayanami: M,
  config?: Config,
): Result<M, S> {
  const ikari = React.useMemo(() => combineWithIkari(ayanami), [ayanami])
  const state = useSubscribeAyanamiState(ayanami)

  React.useEffect(
    () => () => {
      const isDestroyWhenUnmount = get(config, 'destroyWhenUnmount', false)

      if (isDestroyWhenUnmount) {
        ayanami.destroy()
      }
    },
    [ayanami, config],
  )

  return [state, ikari.triggerActions] as Result<M, S>
}

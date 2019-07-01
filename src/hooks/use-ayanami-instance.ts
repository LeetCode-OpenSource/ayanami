import * as React from 'react'
import { get } from 'lodash'

import { ActionMethodOfAyanami, Ayanami, combineWithIkari } from '../core'

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
  const ayanamiRef = React.useRef(ayanami)
  const ikari = React.useMemo(() => combineWithIkari(ayanami), [ayanami])
  const [state, setState] = React.useState<S>(() => ayanami.getState())

  if (ayanamiRef.current !== ayanami) {
    ayanamiRef.current = ayanami
    setState(ayanami.getState())
  }

  React.useEffect(() => {
    const subscription = ayanami.getState$().subscribe(setState)
    return () => subscription.unsubscribe()
  }, [ayanami])

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

import * as React from 'react'
import { get } from 'lodash'

import {
  Ayanami,
  combineWithIkari,
  getInstanceWithScope,
  ScopeConfig,
  ActionMethodOfAyanami,
  ConstructorOf,
  TransientScope,
} from './core'

export type HooksResult<M extends Ayanami<S>, S> = [Readonly<S>, ActionMethodOfAyanami<M, S>]

interface UseAyanamiInstanceConfig {
  destroyWhenUnmount?: boolean
}

export function useAyanamiInstance<M extends Ayanami<S>, S>(
  ayanami: M,
  config?: UseAyanamiInstanceConfig,
): HooksResult<M, S> {
  const ikari = React.useMemo(() => combineWithIkari(ayanami), [ayanami])
  const [state, setState] = React.useState<S>(() => ayanami.getState())

  React.useEffect(() => {
    const subscription = ayanami.getState$().subscribe(setState)
    return () => subscription.unsubscribe()
  }, [])

  React.useEffect(
    () => () => {
      const isDestroyWhenUnmount = get(config, 'destroyWhenUnmount', false)

      if (isDestroyWhenUnmount) {
        ayanami.destroy()
      }
    },
    [],
  )

  return [state, ikari.triggerActions] as HooksResult<M, S>
}

export function useAyanami<M extends Ayanami<S>, S>(
  A: ConstructorOf<M>,
  config?: ScopeConfig,
): M extends Ayanami<infer SS> ? HooksResult<M, SS> : HooksResult<M, S> {
  const ayanami = React.useMemo(() => getInstanceWithScope(A, config), [A])

  const useAyanamiInstanceConfig = React.useMemo((): UseAyanamiInstanceConfig => {
    const scope = get(config, 'scope', false)
    return { destroyWhenUnmount: scope === TransientScope }
  }, [])

  return useAyanamiInstance<M, S>(ayanami, useAyanamiInstanceConfig) as any
}

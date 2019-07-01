import * as React from 'react'
import { get } from 'lodash'

import { Ayanami, ConstructorOf, getInstanceWithScope, ScopeConfig, TransientScope } from '../core'

import {
  useAyanamiInstance,
  UseAyanamiInstanceResult,
  UseAyanamiInstanceConfig,
} from './use-ayanami-instance'

export function useAyanami<M extends Ayanami<S>, S>(
  A: ConstructorOf<M>,
  config?: ScopeConfig,
): M extends Ayanami<infer SS> ? UseAyanamiInstanceResult<M, SS> : UseAyanamiInstanceResult<M, S> {
  const scope = get(config, 'scope')
  const ayanami = React.useMemo(() => getInstanceWithScope(A, scope), [scope])

  const useAyanamiInstanceConfig = React.useMemo((): UseAyanamiInstanceConfig => {
    return { destroyWhenUnmount: scope === TransientScope }
  }, [scope])

  return useAyanamiInstance<M, S>(ayanami, useAyanamiInstanceConfig) as any
}

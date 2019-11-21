import * as React from 'react'
import get from 'lodash/get'

import {
  Ayanami,
  ConstructorOf,
  getInstanceWithScope,
  ScopeConfig,
  TransientScope,
  createScopeWithRequest,
} from '../core'
import { DEFAULT_SCOPE_NAME } from '../ssr/constants'
import { isSSREnabled } from '../ssr/flag'
import { SSRContext } from '../ssr/ssr-context'

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
  const req = isSSREnabled() ? React.useContext(SSRContext) : null
  const reqScope = req ? createScopeWithRequest(req, scope) : scope
  const ayanami = React.useMemo(() => getInstanceWithScope(A, reqScope), [reqScope])
  ayanami.scopeName = scope || DEFAULT_SCOPE_NAME

  const useAyanamiInstanceConfig = React.useMemo((): UseAyanamiInstanceConfig => {
    return { destroyWhenUnmount: scope === TransientScope }
  }, [reqScope])

  return useAyanamiInstance<M, S>(ayanami, useAyanamiInstanceConfig) as any
}

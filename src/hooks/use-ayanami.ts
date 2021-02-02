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
  UseAyanamiInstanceResult as Result,
  UseAyanamiInstanceConfig,
} from './use-ayanami-instance'

interface Config<S, U> extends Partial<ScopeConfig> {
  selector?: (state: S) => U
}

export function useAyanami<M extends Ayanami<S>, S, U = M extends Ayanami<infer SS> ? SS : S>(
  A: ConstructorOf<M>,
  config?: M extends Ayanami<infer SS> ? Config<SS, U> : Config<S, U>,
): M extends Ayanami<infer SS> ? Result<M, SS, U> : Result<M, S, U> {
  const scope = get(config, 'scope')
  const selector = get(config, 'selector')
  const req = isSSREnabled() ? React.useContext(SSRContext) : null
  const reqScope = req ? createScopeWithRequest(req, scope) : scope
  const ayanami = React.useMemo(() => getInstanceWithScope(A, reqScope), [reqScope])
  ayanami.scopeName = scope || DEFAULT_SCOPE_NAME

  const useAyanamiInstanceConfig = React.useMemo((): UseAyanamiInstanceConfig<S, U> => {
    return { destroyWhenUnmount: scope === TransientScope, selector }
  }, [reqScope])

  return useAyanamiInstance<M, S, U>(ayanami, useAyanamiInstanceConfig) as any
}

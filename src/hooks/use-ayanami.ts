import * as React from 'react'
import { get } from 'lodash'
import { Request } from 'express'

import { Ayanami, ConstructorOf, getInstanceWithScope, ScopeConfig, TransientScope } from '../core'
import { DEFAULT_SCOPE_NAME } from '../ssr/run'

import {
  useAyanamiInstance,
  UseAyanamiInstanceResult,
  UseAyanamiInstanceConfig,
} from './use-ayanami-instance'
import { SSREnabled } from '../ssr/flag'
import { SSRContext } from '../ssr/ssr-context'
import { reqMap } from '../ssr/run'

export function useAyanami<M extends Ayanami<S>, S>(
  A: ConstructorOf<M>,
  config?: ScopeConfig,
): M extends Ayanami<infer SS> ? UseAyanamiInstanceResult<M, SS> : UseAyanamiInstanceResult<M, S> {
  const scope = get(config, 'scope')
  const req = SSREnabled ? React.useContext(SSRContext) : null
  const reqScope = req ? createScopeWithRequest(req, scope) : scope
  const ayanami = React.useMemo(() => getInstanceWithScope(A, reqScope), [reqScope])
  ayanami.scopeName = scope || DEFAULT_SCOPE_NAME

  const useAyanamiInstanceConfig = React.useMemo((): UseAyanamiInstanceConfig => {
    return { destroyWhenUnmount: scope === TransientScope }
  }, [reqScope])

  return useAyanamiInstance<M, S>(ayanami, useAyanamiInstanceConfig) as any
}

function createScopeWithRequest(req: Request, scope: any | undefined) {
  if (scope === TransientScope) {
    return scope
  }
  if (!scope) {
    return req
  }
  if (reqMap.has(req)) {
    const scopes = reqMap.get(req)!
    if (scopes.has(scope)) {
      return scopes.get(scope)!
    } else {
      const reqScope = { req, scope }
      scopes.set(scope, reqScope)
      return reqScope
    }
  } else {
    const reqScopeMap = new Map()
    const reqScope = { req, scope }
    reqScopeMap.set(scope, reqScope)
    reqMap.set(req, reqScopeMap)
    return reqScope
  }
}

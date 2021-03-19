import { Request } from 'express'
import { Observable } from 'rxjs'
import { skip } from 'rxjs/operators'

import { SSRSymbol } from './constants'
import { isSSREnabled } from './flag'
import { Effect } from '../core/decorators'

export const SKIP_SYMBOL = Symbol('skip')

export const reqMap = new Map<Request, Map<any, { scope: string; req: Request }>>()

function addDecorator(target: any, method: any, middleware: any) {
  const existedMetas = Reflect.getMetadata(SSRSymbol, target)
  const meta = { action: method, middleware }
  if (existedMetas) {
    existedMetas.push(meta)
  } else {
    Reflect.defineMetadata(SSRSymbol, [meta], target)
  }
}

interface SSREffectOptions<Payload> {
  /**
   * Function used to get effect payload.
   *
   * if SKIP_SYMBOL returned(`return skip()`), effect won't get dispatched when SSR
   *
   * @param req express request object
   * @param skip get a symbol used to let effect escape from ssr effects dispatching
   */
  payloadGetter?: (
    req: Request,
    skip: () => typeof SKIP_SYMBOL,
  ) => Payload | Promise<Payload> | typeof SKIP_SYMBOL

  /**
   * Whether skip first effect dispatching in client if effect ever got dispatched when SSR
   *
   * @default true
   */
  skipFirstClientDispatch?: boolean
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function SSREffect<T, Payload>(options?: SSREffectOptions<Payload>) {
  const { payloadGetter, skipFirstClientDispatch } = {
    payloadGetter: undefined,
    skipFirstClientDispatch: true,
    ...options,
  }

  return (target: T, method: string, descriptor: PropertyDescriptor) => {
    addDecorator(target, method, payloadGetter)
    if (!isSSREnabled() && skipFirstClientDispatch) {
      const originalValue = descriptor.value
      descriptor.value = function (
        this: any,
        action$: Observable<Payload>,
        state$?: Observable<any>,
      ) {
        if (Reflect.getMetadata(this.ssrLoadKey, this)) {
          return originalValue.call(this, action$.pipe(skip(1)), state$)
        }
        return originalValue.call(this, action$, state$)
      }
    }
    return Effect()(target, method, descriptor)
  }
}

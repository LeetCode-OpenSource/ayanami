import { Request } from 'express'
import { Observable } from 'rxjs'
import { skip } from 'rxjs/operators'

import { SSRSymbol } from './meta-symbol'
import { SSREnabled } from './flag'
import { Effect } from '../core/decorators'

export const SKIP_SYMBOL = Symbol('skip')

function addDecorator(target: any, method: any, middleware: any) {
  const existedMetas = Reflect.getMetadata(SSRSymbol, target)
  const meta = { action: method, middleware }
  if (existedMetas) {
    existedMetas.push(meta)
  } else {
    Reflect.defineMetadata(SSRSymbol, [meta], target)
  }
}

export function SSR<T, Payload>(
  middleware?: (
    req: Request,
    skip: () => typeof SKIP_SYMBOL,
  ) => Payload | Promise<Payload> | typeof SKIP_SYMBOL,
) {
  return (target: T, method: string, descriptor: PropertyDescriptor) => {
    addDecorator(target, method, middleware)
    if (!SSREnabled) {
      const originalValue = descriptor.value
      descriptor.value = function(
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

export function SSRServerOnly<T, Payload>(
  middleware?: (
    req: Request,
    skip: () => typeof SKIP_SYMBOL,
  ) => Payload | Promise<Payload> | typeof SKIP_SYMBOL,
) {
  return (target: T, method: string, descriptor: PropertyDescriptor) => {
    addDecorator(target, method, middleware)
    return Effect()(target, method, descriptor)
  }
}

import { Request, Response } from 'express'
import { skip } from 'rxjs/operators'

import { SSRSymbol } from './meta-symbol'
import { SSREnabled } from './flag'
import { Effect } from '../core/decorators'
import { Observable } from 'rxjs'

export function SSR<T, Payload>(
  middleware?: (req: Request, res: Response) => Payload | Promise<Payload>,
) {
  return (target: T, method: string, descriptor: PropertyDescriptor) => {
    const existedMetas = Reflect.getMetadata(SSRSymbol, target)
    const meta = { action: method, middleware }
    if (existedMetas) {
      existedMetas.push(meta)
    } else {
      Reflect.defineMetadata(SSRSymbol, [meta], target)
    }
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

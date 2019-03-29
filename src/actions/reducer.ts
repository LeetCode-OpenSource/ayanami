import { merge, Subject, Observable } from 'rxjs'

import { Ayanami } from '../ayanami'
import { reducerSymbols } from './symbols'
import { createActionDecorator, getActionNames, updateActions } from './utils'

export const Reducer = createActionDecorator(reducerSymbols)

export const setupReducerActions = <M extends Ayanami<S>, S>(
  ayanami: M,
  getState: () => Readonly<S>,
): Observable<Partial<S>> =>
  merge(
    ...getActionNames<M>(reducerSymbols, ayanami.constructor).map((methodName) => {
      const reducer = ayanami[methodName] as Function
      const reducer$ = new Subject<Partial<S>>()

      updateActions(reducerSymbols, ayanami, {
        [methodName](payload: any) {
          const nextState = reducer.call(ayanami, payload, getState())
          reducer$.next(nextState)
        },
      })

      return reducer$
    }),
  )

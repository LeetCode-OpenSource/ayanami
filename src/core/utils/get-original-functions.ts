import { Subject } from 'rxjs'

import {
  OriginalDefineActions,
  OriginalEffectActions,
  OriginalReducerActions,
  OriginalImmerReducerActions,
  ConstructorOf,
} from '../types'
import { Ayanami } from '../ayanami'
import { getActionNames } from '../decorators'
import { effectSymbols, reducerSymbols, immerReducerSymbols, defineActionSymbols } from '../symbols'

const getOriginalFunctionNames = (ayanami: Ayanami<any>) => ({
  effects: getActionNames(effectSymbols, ayanami.constructor as ConstructorOf<Ayanami<any>>),
  reducers: getActionNames(reducerSymbols, ayanami.constructor as ConstructorOf<Ayanami<any>>),
  defineActions: getActionNames(
    defineActionSymbols,
    ayanami.constructor as ConstructorOf<Ayanami<any>>,
  ),
  immerReducers: getActionNames(
    immerReducerSymbols,
    ayanami.constructor as ConstructorOf<Ayanami<any>>,
  ),
})

const transformDefineActions = (actionNames: string[]): OriginalDefineActions => {
  const result: OriginalDefineActions = {}

  actionNames.forEach((actionName) => {
    const actions$ = new Subject<any>()

    result[actionName] = {
      observable: actions$.asObservable(),
      next: (params: any) => actions$.next(params),
    }
  })

  return result
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getOriginalFunctions = (ayanami: Ayanami<any>) => {
  const { effects, reducers, immerReducers, defineActions } = getOriginalFunctionNames(ayanami)

  return {
    effects: effects.reduce<OriginalEffectActions<any>>((acc, method) => {
      acc[method] = ayanami[method].bind(ayanami)
      return acc
    }, {}),
    reducers: reducers.reduce<OriginalReducerActions<any>>((acc, method) => {
      acc[method] = ayanami[method].bind(ayanami)
      return acc
    }, {}),
    immerReducers: immerReducers.reduce<OriginalImmerReducerActions<any>>((acc, method) => {
      acc[method] = ayanami[method].bind(ayanami)
      return acc
    }, {}),
    defineActions: transformDefineActions(defineActions),
  }
}

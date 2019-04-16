import { Subject } from 'rxjs'
import { pick, mapValues } from 'lodash'

import { OriginalDefineActions, OriginalEffectActions, OriginalReducerActions } from '../types'
import { Ayanami } from '../ayanami'
import { effectSymbols, reducerSymbols, defineActionSymbols } from '../symbols'
import { getActionNames } from './action-related'

const getOriginalFunctionNames = (ayanami: Ayanami<any>) => ({
  effects: getActionNames(effectSymbols, ayanami.constructor),
  reducers: getActionNames(reducerSymbols, ayanami.constructor),
  defineActions: getActionNames(defineActionSymbols, ayanami.constructor),
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

export const getOriginalFunctions = (ayanami: Ayanami<any>) => {
  const { effects, reducers, defineActions } = getOriginalFunctionNames(ayanami)

  return {
    effects: mapValues(pick(ayanami, effects), (func: Function) =>
      func.bind(ayanami),
    ) as OriginalEffectActions<any>,
    reducers: mapValues(pick(ayanami, reducers), (func: Function) =>
      func.bind(ayanami),
    ) as OriginalReducerActions<any>,
    defineActions: transformDefineActions(defineActions),
  }
}

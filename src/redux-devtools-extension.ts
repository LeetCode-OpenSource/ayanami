/* istanbul ignore next */

import noop from 'lodash/noop'
import { Action } from './core'

interface GlobalState {
  [modelName: string]: object
}

const FakeReduxDevTools = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  connect: () => ({ init: noop }),
  send: noop,
}

export const INIT_ACTION_TYPE = 'INIT_AYANAMI_STATE'

const ReduxDevTools =
  (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) ||
  FakeReduxDevTools

const STATE: GlobalState = {}

export let logStateAction = (action: Action<unknown>) => {
  const namespace = (action.state as any).name
  const _action = {
    type: `${namespace}/${String(action.type)}`,
    params: filterParams(action.payload),
  }

  STATE[namespace] = action.state.getState()

  if (!(action.type as string)?.endsWith(INIT_ACTION_TYPE)) {
    ReduxDevTools.send(_action, STATE)
  }
}

if (process.env.NODE_ENV !== 'development') {
  logStateAction = noop
}

export const initDevtool = () => {
  if (process.env.NODE_ENV === 'development') {
    const devtool = ReduxDevTools.connect({
      name: `Ayanami`,
    })
    devtool.init(STATE)
  }
}

function filterParams(params: any): any {
  if (params && typeof params === 'object') {
    if (params instanceof Event) {
      return `<<Event:${params.type}>>`
    } else if (params.nativeEvent instanceof Event) {
      return `<<SyntheticEvent:${params.nativeEvent.type}>>`
    }
  }

  return params
}

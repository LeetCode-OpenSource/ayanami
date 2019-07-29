import { noop } from 'lodash'

interface DevTools {
  send(action: { type: string }, state?: Partial<GlobalState>): void
  init(state: GlobalState): void
}

interface GlobalState {
  [modelName: string]: object
}

const FakeReduxDevTools = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  connect: (_config: object) => ({ send: noop, init: noop }),
}

const ReduxDevTools =
  (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) ||
  FakeReduxDevTools

const STATE: GlobalState = {}

const getDevTools = (() => {
  let devTools: DevTools

  return (): DevTools => {
    if (!devTools) {
      devTools = ReduxDevTools.connect({ name: `Ayanami` })
      devTools.init({})
    }
    return devTools
  }
})()

let isEnableLog = false

export function enableReduxLog() {
  isEnableLog = true
}

export function disableReduxLog() {
  isEnableLog = false
}

export function logStateAction(
  namespace: string,
  infos: { actionName: string; params: string; state?: any },
) {
  if (isEnableLog) {
    const action = {
      type: `${namespace}/${infos.actionName}`,
      params: filterParams(infos.params),
    }

    if (infos.state) {
      STATE[namespace] = infos.state
    }

    getDevTools().send(action, STATE)
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

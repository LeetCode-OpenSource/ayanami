import { noop } from 'lodash'
import { Ayanami } from './ayanami'

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

export function getAyanamiName(ayanami: Ayanami<any>): string {
  return ayanami.constructor.name
}

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

export function logStateAction(
  namespace: string,
  infos: { actionName: string; params: string; state?: any },
) {
  const action = {
    type: `${namespace}/${infos.actionName}`,
    params: infos.params,
  }

  if (infos.state) {
    STATE[namespace] = infos.state
  }

  getDevTools().send(action, STATE)
}

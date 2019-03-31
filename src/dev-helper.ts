import { Ayanami } from './ayanami'

interface DevTools {
  send(action: { type: string }, state?: Partial<GlobalState>): void
  init(state: GlobalState): void
}

interface GlobalState {
  [modelName: string]: object
}

const withDevTools = typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__

const noop = () => {}

const STATE: GlobalState = {}

function getName(ayanami: Ayanami<any>): string {
  return ayanami.constructor.name
}

const getDevTools = (() => {
  let devTools: DevTools

  return (): DevTools => {
    if (devTools) {
      return devTools
    } else {
      if (withDevTools) {
        devTools = withDevTools.connect({ name: `Ayanami` })
        devTools.init({})
      } else {
        devTools = { send: noop, init: noop }
      }
      return devTools
    }
  }
})()

export function logStateAction(
  ayanami: Ayanami<any>,
  infos: { actionName: string; params: string; state?: any },
) {
  const action = {
    type: `${getName(ayanami)}/${infos.actionName}`,
    params: infos.params,
  }

  if (infos.state) {
    STATE[getName(ayanami)] = infos.state
  }

  getDevTools().send(action, STATE)
}

import { Ayanami } from './ayanami'
import { ConstructorOf } from './types'
import { getAllActions } from './actions/utils'
import { shared } from './utils'

interface DevTools {
  send(action: { type: string }, state?: Partial<GlobalState>): void
  init(state: GlobalState): void
}

interface GlobalState {
  [modelName: string]: object
}

const FakeReduxDevTools = {
  connect: (_config: object) => ({ send: noop, init: noop }),
}

const ReduxDevTools =
  (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) ||
  FakeReduxDevTools

const noop = () => {}

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
  ayanami: Ayanami<any>,
  infos: { actionName: string; params: string; state?: any },
) {
  const action = {
    type: `${getAyanamiName(ayanami)}/${infos.actionName}`,
    params: infos.params,
  }

  if (infos.state) {
    STATE[getAyanamiName(ayanami)] = infos.state
  }

  getDevTools().send(action, STATE)
}

export function getAllActionsForTest<A extends Ayanami<S>, S>(
  ayanamiConstructor: ConstructorOf<A>,
) {
  return getAllActions<A, S>(shared(ayanamiConstructor))
}

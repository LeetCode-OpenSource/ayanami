import { BasicState } from './basic-state'

export { BasicState }

export function createState<S>(defaultState: S) {
  return new BasicState(defaultState)
}

import { State } from '../core/state'

export const SSRStates = new Map<any, State<any>>()

export const cleanupStateByContext = (ctx: any) => {
  const state = SSRStates.get(ctx)
  if (state) {
    state.unsubscribe()
    SSRStates.delete(ctx)
  }
}

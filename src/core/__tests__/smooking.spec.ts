import { createState } from '../state'
import { empty } from 'rxjs'

describe('Smooking tests', () => {
  it('Should be able work module without effects', () => {
    const { stateCreator } = createState(
      (state: { name: string }, action) => {
        if (action.type === 'foo') {
          return { ...state, name: action.payload as string }
        }
        return state
      },
      () => empty(),
    )

    const state = stateCreator({ name: 'bar' })
    const action = {
      type: 'foo',
      payload: 'foo',
      state,
    }
    state.dispatch(action)
    expect(state.getState().name).toBe(action.payload)
  })
})

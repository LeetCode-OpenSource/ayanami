import { TestModule, Type } from '@asuka/di'
import { Ayanami } from './core/ayanami'
import { ActionOfAyanami } from './core/types'
import { State } from './core/state'

export class AyanamiTestModule extends TestModule {
  getDispatcher<M extends Ayanami<S>, S = any>(ayanamiModule: Type<M>): AyanamiTestStub<M, S> {
    const moduleInstance = this.getInstance(ayanamiModule)
    const state = moduleInstance.createState()
    const actionsCreator: any = moduleInstance.getActions()
    const dispatcher = Object.keys(actionsCreator).reduce((acc, key) => {
      acc[key] = (payload: unknown) => {
        state.dispatch(actionsCreator[key](payload))
      }
      return acc
    }, Object.create(null))

    return new AyanamiTestStub(dispatcher, state)
  }
}

export class AyanamiTestStub<M extends Ayanami<S>, S = any> {
  constructor(
    public readonly dispatcher: ActionOfAyanami<M, S>,
    private readonly state: State<S>,
  ) {}

  getState() {
    return this.state.getState()
  }
}

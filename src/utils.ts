import { ConstructorOf, ConstructorOfAyanami } from './types'
import { Ayanami } from './ayanami'
import { createState } from './state'
import { getAllActions, setupEffectActions, setupReducerActions } from './actions'

const sharedInstanceSymbol = Symbol('shared:instance')

export function shared<M extends Ayanami<S>, S>(ayanamiConstructor: ConstructorOf<M>): M {
  if (Reflect.hasMetadata(sharedInstanceSymbol, ayanamiConstructor)) {
    return Reflect.getMetadata(sharedInstanceSymbol, ayanamiConstructor)
  } else {
    const Constructor = ayanamiConstructor as ConstructorOfAyanami<M, any>
    const ayanami = Constructor.getInstance()

    setup(ayanami)

    Reflect.defineMetadata(sharedInstanceSymbol, ayanami, ayanamiConstructor)

    return ayanami
  }
}

function setup<M extends Ayanami<S>, S>(ayanami: M): void {
  const basicState = createState(ayanami.defaultState)

  setupEffectActions(ayanami, basicState)
  setupReducerActions(ayanami, basicState)

  Object.defineProperty(ayanami, 'getState$', { value: () => basicState.state$ })
  Object.defineProperty(ayanami, 'getState', { value: basicState.getState })
}

export function getAllActionsForTest<A extends Ayanami<S>, S>(
  ayanamiConstructor: ConstructorOf<A>,
) {
  return getAllActions<A, S>(shared(ayanamiConstructor))
}

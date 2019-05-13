import { Ayanami, combineWithIkari, ActionMethodOfAyanami } from '../core'

export function getAllActionsForTest<A extends Ayanami<any>>(
  ayanami: A,
): A extends Ayanami<infer S> ? ActionMethodOfAyanami<A, S> : never {
  return combineWithIkari(ayanami).triggerActions as any
}

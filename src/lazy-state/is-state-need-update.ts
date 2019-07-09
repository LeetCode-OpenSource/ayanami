import { get } from 'lodash'

export function isStateNeedUpdate<T>(
  usedPropertiesPaths: PropertyKey[][],
  aState: T,
  bState: T,
): boolean {
  return usedPropertiesPaths.some((path) => get(aState, path) !== get(bState, path))
}

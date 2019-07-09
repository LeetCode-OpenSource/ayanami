import { flatMap, set } from 'lodash'

import { observeState } from './observe-state-access'

enum Status {
  Normal = 'Normal',
  Final = 'Final',
}

interface UsedState {
  [key: string]: UsedState | Status
}

export function observeStateUsage<T>(state: T): [T, () => PropertyKey[][]] {
  const usedState: UsedState = {}
  const observedState = observeState(state, (paths: PropertyKey[]) => {
    const { filteredPaths, status } = filterPaths(paths)
    if (isNeedUpdate(usedState, filteredPaths)) {
      set(usedState, filteredPaths, status)
    }
  })

  return [observedState, () => getUsedStatePaths(usedState)]
}

function filterPaths(paths: PropertyKey[]): { filteredPaths: PropertyKey[]; status: Status } {
  const lastPath = paths[paths.length - 1]

  switch (lastPath) {
    case 'toJSON':
    case 'valueOf':
    case 'toString':
    case Symbol.toPrimitive:
    case Symbol.toStringTag:
      return {
        filteredPaths: paths.slice(0, -1),
        status: Status.Final,
      }
    default:
      return {
        filteredPaths: paths,
        status: Status.Normal,
      }
  }
}

function isNeedUpdate(usedState: UsedState, paths: PropertyKey[]): boolean {
  let preValue: UsedState = usedState

  for (const path of paths) {
    const currentValue = preValue[path as any]

    if (currentValue === Status.Final) {
      return false
    }

    if (currentValue === Status.Normal) {
      return true
    }

    preValue = currentValue
  }

  return true
}

function getUsedStatePaths(
  state: Readonly<UsedState>,
  parentPaths: PropertyKey[] = [],
): PropertyKey[][] {
  return flatMap(Object.keys(state), (path) => {
    const currentPaths = [...parentPaths, path]
    const currentMeta = state[path]

    if (typeof currentMeta === 'object') {
      return getUsedStatePaths(currentMeta, currentPaths)
    } else {
      return [currentPaths]
    }
  })
}

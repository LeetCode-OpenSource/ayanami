export function observeState<T>(state: T, onAccess: (paths: PropertyKey[]) => void): T {
  function buildProxy<S>(parentPaths: PropertyKey[], nestedState: S): S {
    return new Proxy(nestedState as any, {
      set() {
        return false // state can not be set
      },

      get(target, property) {
        const result = target[property]

        const currentPaths = [...parentPaths, property]

        onAccess(currentPaths)

        if (result instanceof Object) {
          return buildProxy(currentPaths, result)
        } else {
          return result // ignore primitive value
        }
      },
    })
  }

  return buildProxy<T>([], state)
}

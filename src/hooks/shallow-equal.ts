export const shallowEqual = (a: any, b: any): boolean => {
  if (a === b) return true
  if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
    const keys = Object.keys(a)
    if (keys.length !== Object.keys(b).length) return false
    return keys.every((key) => key in b && a[key] === b[key])
  }
  return false
}

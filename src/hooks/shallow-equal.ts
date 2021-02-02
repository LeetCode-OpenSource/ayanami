export const shallowEqual = (a: any, b: any): boolean => {
  if (a === b) return true
  if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
    return (
      Object.keys(a).length === Object.keys(b).length &&
      Object.keys(a).every((key) => a[key] === b[key])
    )
  }
  return false
}

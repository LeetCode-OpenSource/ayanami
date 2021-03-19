export const SameScopeMetadataKey = Symbol('SameScopeInjectionParams')

export const SameScope = () => (
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  target: any,
  _propertyKey: string,
  parameterIndex: number,
): void => {
  let sameScopeInjectionParams: boolean[] = []
  if (Reflect.hasMetadata(SameScopeMetadataKey, target)) {
    sameScopeInjectionParams = Reflect.getMetadata(SameScopeMetadataKey, target)
  } else {
    Reflect.defineMetadata(SameScopeMetadataKey, sameScopeInjectionParams, target)
  }
  sameScopeInjectionParams[parameterIndex] = true
}

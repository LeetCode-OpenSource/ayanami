export const SameScopeMetadataKey = Symbol('SameScopeInjectionParams')

export const SameScope = () => (target: any, _propertyKey: string, parameterIndex: number) => {
  let sameScopeInjectionParams: boolean[] = []
  if (Reflect.hasMetadata(SameScopeMetadataKey, target)) {
    sameScopeInjectionParams = Reflect.getMetadata(SameScopeMetadataKey, target)
  } else {
    Reflect.defineMetadata(SameScopeMetadataKey, sameScopeInjectionParams, target)
  }
  sameScopeInjectionParams[parameterIndex] = true
}

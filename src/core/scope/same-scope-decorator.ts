const SameScopeMetadataKey = Symbol('SameScopeInjectionParams')

export function getSameScopeInjectionParams(target: any): any[] {
  if (Reflect.hasMetadata(SameScopeMetadataKey, target)) {
    return Reflect.getMetadata(SameScopeMetadataKey, target)
  } else {
    const sameScopeInjectionParams: any[] = []
    Reflect.defineMetadata(SameScopeMetadataKey, sameScopeInjectionParams, target)
    return sameScopeInjectionParams
  }
}

function addSameScopeInjectionParam(target: any, param: object) {
  const sameScopeInjectionParams = getSameScopeInjectionParams(target)
  sameScopeInjectionParams.push(param)
}

export const SameScope = () => (target: any, _propertyKey: string, parameterIndex: number) => {
  const param = Reflect.getMetadata('design:paramtypes', target)[parameterIndex]
  addSameScopeInjectionParam(target, param)
}

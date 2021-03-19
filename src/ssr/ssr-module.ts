import { InjectableConfig, Injectable } from '@asuka/di'
import omit from 'lodash/omit'

const configSets = new Set<string>()

export const moduleNameKey = Symbol.for('__MODULE__NAME__')
export const globalKey = Symbol.for('__GLOBAL_MODULE_CACHE__')

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const SSRModule = (config: string | (InjectableConfig & { name: string })) => {
  const injectableConfig: InjectableConfig = { providers: [] }
  let name: string
  if (typeof config === 'string') {
    if (configSets.has(config)) {
      reportDuplicated(config)
    }
    name = config
    configSets.add(config)
  } else if (config && typeof config.name === 'string') {
    if (configSets.has(config.name)) {
      reportDuplicated(config.name)
    }
    configSets.add(config.name)
    name = config.name
    Object.assign(injectableConfig, omit(config, 'name'))
  } else {
    throw new TypeError(
      'config in SSRModule type error, support string or InjectableConfig with name',
    )
  }

  return (target: any) => {
    target.prototype[moduleNameKey] = name
    return Injectable(injectableConfig)(target)
  }
}

function reportDuplicated(moduleName: string) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Duplicated Module name: ${moduleName}`)
  }
  // avoid to throw error after HMR
  console.warn(`Duplicated Module name: ${moduleName}`)
}

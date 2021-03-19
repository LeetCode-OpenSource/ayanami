export const isSSREnabled = (): boolean => {
  return typeof process.env.ENABLE_AYANAMI_SSR !== 'undefined'
    ? process.env.ENABLE_AYANAMI_SSR === 'true'
    : typeof process !== 'undefined' &&
        process.versions &&
        typeof process.versions.node === 'string'
}

export const SSREnabled = isSSREnabled()

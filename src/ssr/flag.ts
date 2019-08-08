export const SSREnabled =
  typeof process.env.ENABLE_AYANAMI_SSR !== 'undefined'
    ? process.env.ENABLE_AYANAMI_SSR
    : typeof process !== 'undefined' &&
      process.versions &&
      typeof process.versions.node === 'string'

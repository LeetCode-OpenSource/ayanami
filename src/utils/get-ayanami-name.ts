import { Ayanami } from '../ayanami'

export function getAyanamiName(ayanami: Ayanami<any>): string {
  return ayanami.constructor.name
}

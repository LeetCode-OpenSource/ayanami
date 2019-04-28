import { Ayanami } from '../ayanami'
import { ConstructorOf } from '../types'

export function getAyanamiName(ayanami: Ayanami<any> | ConstructorOf<Ayanami<any>>): string {
  if (Ayanami.isPrototypeOf(ayanami)) {
    return (ayanami as Function).name
  } else {
    return ayanami.constructor.name
  }
}

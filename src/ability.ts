import type {CustomElementClass} from './custom-element.js'

type Decorator = (Class: CustomElementClass) => unknown
const abilityMarkers = new WeakMap<CustomElementClass, Set<Decorator>>()
export const createAbility = <T extends Decorator>(decorate: T): ((Class: Parameters<T>[0]) => ReturnType<T>) => {
  return (Class: Parameters<T>[0]): ReturnType<T> => {
    const markers = abilityMarkers.get(Class)
    if (markers?.has(decorate)) return Class as unknown as ReturnType<T>
    const NewClass = decorate(Class) as ReturnType<T>
    const newMarkers = new Set(markers)
    newMarkers.add(decorate)
    abilityMarkers.set(NewClass as unknown as CustomElementClass, newMarkers)
    return NewClass
  }
}

import type {ControllableClass, Controllable} from './controllable.js'
import {register, add} from './tag-observer.js'
import {createMark} from './mark.js'
import {attachShadowCallback} from './controllable.js'
import {dasherize} from './dasherize.js'

interface Targetable extends Controllable {
  [targetChanged](key: PropertyKey, target: Element): void
  [targetsChanged](key: PropertyKey, targets: Element[]): void
}

const targetChanged = Symbol()
const targetsChanged = Symbol()

const [target, getTarget, initializeTarget] = createMark<Targetable>(
  ({name, kind}) => {
    if (kind === 'getter') throw new Error(`@target cannot decorate get ${String(name)}`)
  },
  (instance: Targetable, {name}) => {
    const find = findTarget(instance, `[data-target~="${instance.tagName.toLowerCase()}.${dasherize(name)}"]`, false)
    return {
      get: find,
      set: find
    }
  }
)
const [targets, getTargets, initializeTargets] = createMark<Targetable>(
  ({name, kind}) => {
    if (kind === 'getter') throw new Error(`@target cannot decorate get ${String(name)}`)
  },
  (instance: Targetable, {name}) => {
    const find = findTarget(instance, `[data-target~="${instance.tagName.toLowerCase()}.${dasherize(name)}"]`, false)
    return {
      get: find,
      set: find
    }
  }
)

function setTarget(el: Element, controller: Element | ShadowRoot, tag: string, key: string): void {
  const get = tag === 'data-targets' ? getTargets : getTarget
  if (controller instanceof ShadowRoot) {
    controller = controllers.get(controller)!
  }
  if (controller && get(controller as unknown as Targetable)?.has(key)) {
    ;(controller as unknown as Record<PropertyKey, unknown>)[key] = {}
  }
}

register('data-target', (str: string) => str.split('.'), setTarget)
register('data-targets', (str: string) => str.split('.'), setTarget)
const shadows = new WeakMap<Targetable, ShadowRoot>()
const controllers = new WeakMap<ShadowRoot, Targetable>()

const findTarget = (controller: Targetable, selector: string, many: boolean) => () => {
  const nodes = []
  const shadow = shadows.get(controller)
  if (shadow) {
    for (const el of shadow.querySelectorAll(selector)) {
      if (!el.closest(controller.tagName)) {
        nodes.push(el)
        if (!many) break
      }
    }
  }
  if (many || !nodes.length) {
    for (const el of controller.querySelectorAll(selector)) {
      if (el.closest(controller.tagName) === controller) {
        nodes.push(el)
        if (!many) break
      }
    }
  }
  return many ? nodes : nodes[0]
}

export {target, getTarget, targets, getTargets, targetChanged, targetsChanged}
export const targetable = <T extends ControllableClass>(Class: T) =>
  class extends Class {
    constructor(...args: any[]) {
      super(...args)
      add(this)
      initializeTarget(this)
      initializeTargets(this)
    }

    [targetChanged]() {}

    [targetsChanged]() {}

    [attachShadowCallback](root: ShadowRoot) {
      super[attachShadowCallback](root)
      shadows.set(this, root)
      controllers.set(root, this)
      add(root)
    }
  }

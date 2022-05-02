import type {CustomElement} from './custom-element.js'
import type {ControllableClass} from './controllable.js'
import {register, add, tags} from './tag-observer.js'
import {attachShadowCallback} from './controllable.js'

const parse = (tag: string): [tagName: string, event: string, method: string] => {
  const eventSep = tag.lastIndexOf(':')
  const methodSep = Math.max(0, tag.lastIndexOf('#')) || tag.length
  return [tag.slice(eventSep + 1, methodSep), tag.slice(0, eventSep), tag.slice(methodSep + 1) || 'handleEvent']
}
register('data-action', parse, (el: Element, controller: Element | ShadowRoot, tag: string, event: string) => {
  el.addEventListener(event, handleEvent)
})

const actionables = new WeakSet<CustomElement>()
// Bind a single function to all events to avoid anonymous closure performance penalty.
function handleEvent(event: Event) {
  const el = event.currentTarget as Element
  for (const [tag, type, method] of tags(el, 'data-action', parse)) {
    if (event.type === type) {
      type EventDispatcher = CustomElement & Record<string, (ev: Event) => unknown>
      const controller = el.closest<EventDispatcher>(tag)!
      if (actionables.has(controller) && typeof controller[method] === 'function') {
        controller[method](event)
      }
      const root = el.getRootNode()
      if (root instanceof ShadowRoot) {
        const shadowController = root.host as EventDispatcher
        if (shadowController.matches(tag) && actionables.has(shadowController)) {
          if (typeof shadowController[method] === 'function') {
            shadowController[method](event)
          }
        }
      }
    }
  }
}

export const actionable = <T extends ControllableClass>(Class: T) =>
  class extends Class {
    constructor(...args: any[]) {
      super(...args)
      actionables.add(this)
      add(this)
    }

    [attachShadowCallback](root: ShadowRoot) {
      super[attachShadowCallback](root)
      add(root)
    }
  }
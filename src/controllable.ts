import type {CustomElementClass, CustomElement} from './custom-element.js'

export interface Controllable extends CustomElement {
  [attachShadowCallback](shadowRoot: ShadowRoot): void
  [attachInternalsCallback](internals: ElementInternals): void
}
export interface ControllableClass extends CustomElementClass {
  new (...args: any[]): Controllable
}

export const attachShadowCallback = Symbol()
export const attachInternalsCallback = Symbol()

const shadows = new WeakMap<Controllable, ShadowRoot | undefined>()
const internals = new WeakMap<Controllable, ElementInternals>()
const internalsCalled = new WeakSet()
export const controllable = <T extends CustomElementClass>(Class: T) =>
  class extends Class {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore TypeScript doesn't like assigning static name
    static get name() {
      return Class.name
    }

    // TS mandates Constructors that get mixins have `...args: any[]`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args)
      const shadowRoot = this.shadowRoot
      if (shadowRoot && shadowRoot !== shadows.get(this)) this[attachShadowCallback](shadowRoot)
      if (!internalsCalled.has(this)) {
        try {
          this.attachInternals()
        } catch {
          // Ignore errors
        }
      }
    }

    connectedCallback() {
      super.connectedCallback?.()
      this.setAttribute('data-catalyst', '')
    }

    attachShadow(...args: [init: ShadowRootInit]): ShadowRoot {
      const shadowRoot = super.attachShadow(...args)
      this[attachShadowCallback](shadowRoot)
      return shadowRoot
    }

    [attachShadowCallback](shadowRoot: ShadowRoot) {
      shadows.set(this, shadowRoot)
    }

    attachInternals(): ElementInternals {
      if (internals.has(this) && !internalsCalled.has(this)) {
        internalsCalled.add(this)
        return internals.get(this)!
      }
      const elementInternals = super.attachInternals()
      this[attachInternalsCallback](elementInternals)
      internals.set(this, elementInternals)
      return elementInternals
    }

    [attachInternalsCallback](elementInternals: ElementInternals) {
      const shadowRoot = elementInternals.shadowRoot
      if (shadowRoot && shadowRoot !== shadows.get(this)) {
        this[attachShadowCallback](shadowRoot)
      }
    }
  }

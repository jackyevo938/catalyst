import type {CustomElementClass} from './custom-element.js'
import {actionable} from './action.js'
import {attrable} from './attr.js'
import {targetable} from './target.js'
import {register} from './register.js'
import {controllable} from './controllable.js'

/**
 * Controller is a decorator to be used over a class that extends HTMLElement.
 * It will automatically `register()` the component in the customElement
 * registry, as well as ensuring `bind(this)` is called on `connectedCallback`,
 * wrapping the classes `connectedCallback` method if needed.
 */
export function controller<T extends CustomElementClass>(Class: T) {
  return register(actionable(attrable(targetable(controllable(Class)))))
}

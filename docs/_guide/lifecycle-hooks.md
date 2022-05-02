---
chapter: 8
subtitle: Observing the life cycle of an element
---

Catalyst Controllers - like many other frameworks - have several "well known" method names which are called periodically through the life cycle of the element, and let you observe when an element changes in various ways. Here is a comprehensive list of all life-cycle callbacks. Each one is suffixed `Callback`, to denote that it will be called by the framework.

### `connectedCallback()`

The [`connectedCallback()` is part of Custom Elements][ce-callbacks], and gets fired as soon as your element is _appended_ to the DOM. This callback is a good time to initialize any variables, perhaps add some global event listeners, or start making any early network requests.

JavaScript traditionally uses the `constructor()` callback to listen for class creation. While this still works for Custom Elements, it is best avoided as the element won't be in the DOM when `constructor()` is fired, limiting its utility.

#### Things to remember

The `connectedCallback` is called _as soon as_ the element is attached to a `document`. This _may_ occur _before_ an element has any children appended to it, so you should be careful not expect an element to have children during a `connectedCallback` call. This means avoiding checking any `target`s or using other methods like `querySelector`. Instead use this function to initialize itself and avoid doing initialization work which depend on children existing.

If your element depends heavily on its children existing, consider adding a [`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) in the `connectedCallback` to track when your elements children change.

### `attributeChangedCallback()`

The [`attributeChangedCallback()` is part of Custom Elements][ce-callbacks], and gets fired when _observed attributes_ are added, changed, or removed from your element. It required you set a `static observedAttributes` array on your class, the values of which will be any attributes that will be observed for mutations. This is given a set of arguments, the signature of your function should be:

```typescript
attributeChangedCallback(name: string, oldValue: string|null, newValue: string|null): void {}
```

#### Things to remember

The `attributeChangedCallback` will fire whenever `setAttribute` is called with an observed attribute, even if the _new_ value is the same as the _old_ value. In other words, it is possible for `attributeChangedCallback` to be called when `oldValue === newValue`. In most cases this really won't matter much, and in some cases this is very helpful; but sometimes this can bite, especially if you have [non-idempotent](https://en.wikipedia.org/wiki/Idempotence#Computer_science_examples) code inside your `attributeChangedCallback`. Try to make sure operations inside `attributeChangedCallback` are idempotent, or perhaps consider adding a check to ensure `oldValue !== newValue` before performing operations which may be sensitive to this.

### `disconnectedCallback()`

The [`disconnectedCallback()` is part of Custom Elements][ce-callbacks], and gets fired as soon as your element is _removed_ from the DOM. Event listeners will automatically be cleaned up, and memory will be freed automatically from JavaScript, so you're unlikely to need this callback for much.

### `adoptedCallback()`

The [`adoptedCallback()` is part of Custom Elements][ce-callbacks], and gets called when your element moves from one `document` to another (such as an iframe). It's very unlikely to occur, you'll almost never need this.

[ce-callbacks]: https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#Using_the_lifecycle_callbacks

## Catalyst Custom callbacks

Catalyst also introduces a few custom callbacks. These shouldn't be needed for authoring regular components, but can be used for [Abilities]({{ site.baseurl }}/guide/abilities).

All custom callbacks use `Symbol()` keys, and so need to be imported from Catalyst, for example:

```typescript
import {controller, attachShadowCallback} from '@github/catalyst'

@controller
class UserListElement extends HTMLElement {
    [attachShadowCallback](shadowRoot: ShadowRoot) {}
}
```

### `[attachShadowCallback](shadowRoot: ShadowRoot)`

Catalyst calls this whenever a ShadowRoot gets attached to an element. This callback is called during the following phases:

 - During the constructor, where the element might recieve a declarative ShadowDOM root.
 - Any time the `attachShadow()` function is called.

This method is _usually_ called zero or once, but may be called twice if the element recieves a Declarative ShadowDOM root, and overrides this with another call to `attachShadow()`.

This callback isn't particularly useful for authoring a custom element, because you can access exsiting shadows with `.attachInternals().shadowRoot` or create a new shadowRoot with `.attachShadow({ mode })`. It is however very useful for [Abilities]({{ site.baseurl }}/guide/abilities), which can use this callback as an easy mechanism to intercept when a ShadowRoot gets attached to an element.

### `[attachInternalsCallback](internals: ElementInternals)`

Catalyst automatically calls `attachInternals` during the `constructor()` phase, and then calls `[attachInternalsCallback](internals)`. In doing so, it enablies [Abilities]({{ site.baseurl }}/guide/abilities) to also have access to `ElementInternals`. It does so while also preserving the ability for `attachInternals()` to be called again (usually `attachInternals()` will error if called twice).

This callback isn't particularly useful for authoring a custom element, because if you need access to the internals, you can call `.attachInternals()` yourself. It is however very useful for [Abilities]({{ site.baseurl }}/guide/abilities), which can use this callback as an easy mechanism to intercept `ElementInternals` for use within the Ability itself.

### `[attrChangedCallback](changed: Map<PropertyKey, unknown>)`

`[attrChangedCallback]` is called whenever an `@attr` decorated field changes value. The `[attrChangedCallback]` is batched, and so is called with a Map of all the changed `@attr` properties during the batch cycle.

While this could be useful for custom elements, it is instead recommended to use [`@attr` methods]({{ site.baseurl }}/guide/attrs) to detect when an `@attr` value is changing.

### `[targetChangedCallback](changed: Map<PropertyKey, Element>)`

`[targetChangedCallback]` is called whenever an `@target` decorated field changes value. The `[targetChangedCallback]` is batched, and so is called with a Map of all the changed `@target` properties during the batch cycle.

While this could be useful for custom elements, it is instead recommended to use [`@target` methods]({{ site.baseurl }}/guide/targets) to detect when an `@target` value is changing.

### `[targetsChangedCallback](changed: Map<PropertyKey, Element>)`

`[targetsChangedCallback]` is called whenever a `@targets` decorated field changes value. The `[targetsChangedCallback]` is batched, and so is called with a Map of all the changed `@targets` properties during the batch cycle.

While this could be useful for custom elements, it is instead recommended to use [`@targets` methods]({{ site.baseurl }}/guide/targets) to detect when an `@targets` value is changing.
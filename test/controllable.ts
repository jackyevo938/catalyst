import {expect, fixture, html} from '@open-wc/testing'
import {restore, fake} from 'sinon'
import type {CustomElement} from '../src/custom-element.js'
import {controllable, attachShadowCallback, attachInternalsCallback} from '../src/controllable.js'

describe('ability', () => {
  describe('attachShadowCallback', () => {
    let attachShadowFake: (shadow: ShadowRoot) => void
    let shadow: ShadowRoot | null
    beforeEach(() => {
      shadow = null
      attachShadowFake = fake()
    })

    @controllable
    class DeclarativeShadowAbility extends HTMLElement {
      constructor() {
        super()
        // Declarative shadows run before constructor() is available, but
        // abilities run after element constructor
        shadow = HTMLElement.prototype.attachShadow.call(this, {mode: 'closed'})
      }

      [attachShadowCallback](...args: [ShadowRoot]) {
        return attachShadowFake.apply(this, args)
      }
    }
    customElements.define('declarative-shadow-ability', DeclarativeShadowAbility)

    @controllable
    class ClosedShadowAbility extends HTMLElement {
      constructor() {
        super()
        shadow = this.attachShadow({mode: 'closed'})
      }

      [attachShadowCallback](...args: [ShadowRoot]) {
        return attachShadowFake.apply(this, args)
      }
    }
    customElements.define('closed-shadow-ability', ClosedShadowAbility)

    @controllable
    class ConnectedShadowAbility extends HTMLElement {
      connectedCallback() {
        shadow = this.attachShadow({mode: 'closed'})
      }

      [attachShadowCallback](...args: [ShadowRoot]) {
        return attachShadowFake.apply(this, args)
      }
    }
    customElements.define('connected-shadow-ability', ConnectedShadowAbility)

    @controllable
    class ManualShadowAbility extends HTMLElement {
      [attachShadowCallback](...args: [ShadowRoot]) {
        return attachShadowFake.apply(this, args)
      }
    }
    customElements.define('manual-shadow-ability', ManualShadowAbility)

    @controllable
    class DisallowedShadowAbility extends HTMLElement {
      static disabledFeatures = ['shadow']
    }
    customElements.define('disallowed-shadow-ability', DisallowedShadowAbility)

    it('is called with shadowRoot of declarative ShadowDOM', async () => {
      const instance = await fixture(html`<declarative-shadow-ability></declarative-shadow-ability>`)
      expect(shadow).to.exist.and.be.instanceof(ShadowRoot)
      expect(attachShadowFake).to.be.calledOnce.calledOn(instance).and.calledWithExactly(shadow)
    })

    it('is called with shadowRoot from attachShadow call', async () => {
      const instance = await fixture(html`<manual-shadow-ability></manual-shadow-ability>`)
      shadow = instance.attachShadow({mode: 'closed'})
      expect(shadow).to.exist.and.be.instanceof(ShadowRoot)
      expect(attachShadowFake).to.be.calledOnce.calledOn(instance).and.calledWithExactly(shadow)
    })

    it('is called with shadowRoot from attachInternals call', async () => {
      const instance = await fixture(html`<closed-shadow-ability></closed-shadow-ability>`)
      expect(shadow).to.exist.and.be.instanceof(ShadowRoot)
      expect(attachShadowFake).to.be.calledOnce.calledOn(instance).and.calledWithExactly(shadow)
    })

    it('is called with shadowRoot from connectedCallback', async () => {
      const instance = await fixture(html`<connected-shadow-ability></connected-shadow-ability>`)
      expect(shadow).to.exist.and.be.instanceof(ShadowRoot)
      expect(attachShadowFake).to.be.calledOnce.calledOn(instance).and.calledWithExactly(shadow)
    })

    it('does not error if shadowdom is disabled', async () => {
      await fixture(html`<disabled-shadow-ability></disabled-shadow-ability>`)
      expect(attachShadowFake).to.be.have.callCount(0)
    })
  })

  describe('attachInternalsCallback', () => {
    let attachInternalsFake: (internals: ElementInternals) => void
    let internals: ElementInternals | null
    beforeEach(() => {
      internals = null
      attachInternalsFake = fake()
    })

    @controllable
    class InternalsAbility extends HTMLElement {
      constructor() {
        super()
        internals = this.attachInternals()
      }
      [attachInternalsCallback](...args: [ElementInternals]) {
        return attachInternalsFake.apply(this, args)
      }
    }
    customElements.define('internals-ability', InternalsAbility)

    @controllable
    class ManualInternalsAbility extends HTMLElement {
      [attachInternalsCallback](...args: [ElementInternals]) {
        return attachInternalsFake.apply(this, args)
      }
    }
    customElements.define('manual-internals-ability', ManualInternalsAbility)

    @controllable
    class DisallowedInternalsAbility extends HTMLElement {
      static disabledFeatures = ['internals'];
      [attachInternalsCallback](...args: [ElementInternals]) {
        return attachInternalsFake.apply(this, args)
      }
    }
    customElements.define('disallowed-internals-ability', DisallowedInternalsAbility)

    it('is called on constructor', async () => {
      const instance = await fixture(html`<manual-internals-ability></manual-internals-ability>`)
      expect(attachInternalsFake).to.be.calledOnce.calledOn(instance)
    })

    it('does not prevent attachInternals being called by userland class', async () => {
      const instance = await fixture(html`<internals-ability></internals-ability>`)
      expect(internals).to.exist.and.be.instanceof(ElementInternals)
      expect(attachInternalsFake).to.be.calledOnce.calledOn(instance).and.calledWithExactly(internals)
    })

    it('errors if userland calls attachInternals more than once', async () => {
      const instance = await fixture<CustomElement>(html`<manual-internals-ability></manual-internals-ability>`)
      internals = instance.attachInternals()
      expect(internals).to.exist.and.be.instanceof(ElementInternals)
      expect(attachInternalsFake).to.be.calledOnce.calledOn(instance).and.calledWithExactly(internals)

      expect(() => instance.attachInternals()).to.throw(DOMException)
    })

    it('does not error if element internals are disabled', async () => {
      await fixture(html`<disallowed-internals-ability></disallowed-internals-ability>`)
      expect(attachInternalsFake).to.have.callCount(0)
    })
  })
})

/**
 * FEModals — lightweight, dependency-free modal management library.
 *
 * ⚡ Features:
 * - Supports multiple modals at once
 * - Automatic scroll locking (lockScroll)
 * - Focus trapping and focus return after closing
 * - Fully configurable via constructor options
 * - Attribute-based triggers (data-modal-open / data-modal-close)
 * - Callback support (onBeforeOpen, onAfterOpen, onBeforeClose, onAfterClose)   
 * - Public API methods: open, close, toggle, isOpen, getOpenModals, update, destroy
 * - Global access via window.FEModals
 *
 * 🧱 Basic HTML structure:
 * <button data-modal-open="#exampleModal">Open modal</button>
 * <div id="exampleModal" class="modal">
 *   <div class="modal__content">
 *     <button data-modal-close>×</button>
 *     <p>Modal content...</p>
 *   </div>
 * </div>
 *
 * ⚙️ Constructor options:
 * - attrOpen: string — attribute selector for opening (default: 'data-modal-open')
 * - attrClose: string — attribute selector for closing (default: 'data-modal-close')
 * - closeOnEsc: boolean — close modal with Escape key (default: true)
 * - closeAllOnEsc: boolean — close all modals or only the last one (default: true)
 * - singleOpen: boolean — allow only one modal open at a time (default: true)
 * - lockScroll: boolean — lock body scroll when modal is open (default: false)
 * - bodyClass: string — class added to <body> when modal is open (default: 'modal-open')
 * - activeClass: string — class applied to active modal (default: 'open')
 * - initClass: string — initialization class (default: 'fe-modal-init')
 * - animatingClass: string — class applied during animation (default: 'is-animating')
 * - onBeforeOpen(modal)
 * - onAfterOpen(modal)
 * - onBeforeClose(modal)
 * - onAfterClose(modal)
 *
 * 🔧 Public methods:
 * - open(target) — open modal by selector or element
 * - close(target) — close modal by selector or element
 * - toggle(target) — toggle modal visibility
 * - isOpen(target) — check if modal is open
 * - getOpenModals() — get all currently open modals
 * - update() — re-initialize all modals (useful after DOM changes)
 * - destroy() — remove all event listeners and reset state
 *
 * 🔗 Global access:
 * window.FEModals — available globally in browser environment
 *
 * 🧩 Author: FrontElf
 * 📦 Version: 1.0.0
 */

class FEModals {
   constructor(options = {}) {
      this.config = Object.assign({
         // Attributes
         attrOpen: 'data-modal-open',
         attrClose: 'data-modal-close',
         selectorOverlay: '.fe-modal-overlay',
         selectorModal: '.modal',
         // Behavior
         closeOnEsc: true,
         closeAllOnEsc: true,
         singleOpen: true,
         lockScroll: false,
         // Classes
         bodyClass: 'modal-open',
         activeClass: 'is-open',
         initClass: 'fe-modal-init',
         animatingClass: 'is-animating',
         // Callbacks
         onBeforeOpen: null,
         onAfterOpen: null,
         onBeforeClose: null,
         onAfterClose: null,
      }, options)

      this.modals = []
      this.openButtons = document.querySelectorAll(`[${this.config.attrOpen}]`)
      this.currentOpenModals = []
      this.lastFocusedElement = null

      this.init()
      if (this.config.closeOnEsc) this.initEscListener()
   }

   init() {
      this.modals = Array.from(document.querySelectorAll(this.config.selectorModal))
      this.modals.forEach(modal => this.initModal(modal))

      this._clickHandler = e => {
         const button = e.target.closest(`[${this.config.attrOpen}]`)
         if (!button) return

         e.preventDefault()
         let selector = button.getAttribute(this.config.attrOpen)
         if (!selector) return

         if (!selector.startsWith('#')) selector = `#${selector}`

         const modal = document.querySelector(selector)
         if (!modal) return

         this.lastFocusedElement = document.activeElement
         this.open(modal)
      }

      document.addEventListener('click', this._clickHandler)
   }

   initModal(modal) {
      modal.classList.add(this.config.initClass)
      modal.setAttribute('role', 'dialog')
      modal.setAttribute('aria-modal', 'true')
      modal.setAttribute('aria-hidden', 'true')
      const overlay = modal.querySelector(this.config.selectorOverlay)

      modal.addEventListener('click', (e) => {
         if (e.target.closest(`${this.config.selectorOverlay} [${this.config.attrClose}]`)) {
            this.close(modal)
         } else if (e.target === overlay && overlay.hasAttribute(this.config.attrClose)) {
            this.close(modal)
         }
      })

      const backdropHandler = e => {
         if (e.target === modal) this.close(modal)
      }
      modal._backdropHandler = backdropHandler
      modal.addEventListener('click', backdropHandler)
   }

   initEscListener() {
      this._escHandler = e => {
         if (e.key === 'Escape' && this.currentOpenModals.length) {
            if (this.config.closeAllOnEsc) {
               this.currentOpenModals.forEach(modal => this.close(modal))
            } else {
               this.close(this.currentOpenModals[this.currentOpenModals.length - 1])
            }
         }
      }
      document.addEventListener('keydown', this._escHandler)
   }

   async open(target) {
      const modal = this.resolveModal(target)
      if (!modal || modal.classList.contains(this.config.activeClass)) return
      if (this.config.singleOpen && this.currentOpenModals.length) {
         await Promise.all(
            this.currentOpenModals.map(m =>
               new Promise(resolve => {
                  const handleClose = e => {
                     if (e.detail.modal === m) {
                        document.removeEventListener('FeAfterModalClose', handleClose)
                        resolve()
                     }
                  }
                  document.addEventListener('FeAfterModalClose', handleClose)
                  this.close(m)
               })
            )
         ).catch(err => console.error('Error closing modals:', err))
      }

      this._openNow(modal)
      this.currentOpenModals.push(modal)
   }

   _openNow(modal) {
      this.dispatchEvent('FeBeforeModalOpen', modal)
      if (typeof this.config.onBeforeOpen === 'function') this.config.onBeforeOpen(modal)

      modal.classList.add(this.config.animatingClass, this.config.activeClass)
      modal.setAttribute('aria-hidden', 'false')
      document.body.classList.add(this.config.bodyClass)

      if (this.config.lockScroll !== false) {
         document.body.style.overflow = 'hidden'
      }

      const focusableEls = modal.querySelectorAll(
         'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )
      if (focusableEls.length) {
         const focusable = Array.from(focusableEls)
         const firstEl = focusable[0]
         const lastEl = focusable[focusable.length - 1]

         if (firstEl) firstEl.focus()

         const trapFocus = e => {
            if (e.key !== 'Tab') return
            if (e.shiftKey) {
               if (document.activeElement === firstEl) {
                  e.preventDefault()
                  lastEl.focus()
               }
            } else {
               if (document.activeElement === lastEl) {
                  e.preventDefault()
                  firstEl.focus()
               }
            }
         }
         modal.addEventListener('keydown', trapFocus)
         modal._trapFocus = trapFocus
      }

      const onEnd = () => {
         modal.classList.remove(this.config.animatingClass)
         modal.removeEventListener('transitionend', onEnd)
         modal.removeEventListener('animationend', onEnd)
         this.dispatchEvent('FeAfterModalOpen', modal)
         if (typeof this.config.onAfterOpen === 'function') this.config.onAfterOpen(modal)
      }

      modal.addEventListener('transitionend', onEnd)
      modal.addEventListener('animationend', onEnd)
   }

   close(target) {
      const modal = this.resolveModal(target)
      if (!modal || !modal.classList.contains(this.config.activeClass)) return

      this.dispatchEvent('FeBeforeModalClose', modal)
      if (typeof this.config.onBeforeClose === 'function') this.config.onBeforeClose(modal)

      modal.classList.add(this.config.animatingClass)
      modal.classList.remove(this.config.activeClass)

      if (modal._trapFocus) {
         modal.removeEventListener('keydown', modal._trapFocus)
         delete modal._trapFocus
      }

      if (this.currentOpenModals.length === 1 && this.currentOpenModals.includes(modal)) {
         document.body.classList.remove(this.config.bodyClass)
         document.body.style.overflow = ''
      }

      const onEnd = () => {
         modal.classList.remove(this.config.animatingClass)
         modal.removeEventListener('transitionend', onEnd)
         modal.removeEventListener('animationend', onEnd)
         this.dispatchEvent('FeAfterModalClose', modal)
         if (typeof this.config.onAfterClose === 'function') this.config.onAfterClose(modal)

         this.currentOpenModals = this.currentOpenModals.filter(m => m !== modal)
         modal.setAttribute('aria-hidden', 'true')

         if (this.lastFocusedElement && !this.currentOpenModals.length) {
            this.lastFocusedElement.focus()
            this.lastFocusedElement = null
         }
      }

      modal.addEventListener('transitionend', onEnd)
      modal.addEventListener('animationend', onEnd)
   }

   toggle(target) {
      const modal = this.resolveModal(target)
      if (!modal) return
      modal.classList.contains(this.config.activeClass)
         ? this.close(modal)
         : this.open(modal)
   }

   resolveModal(target) {
      if (typeof target === 'string') {
         if (!target.startsWith('#')) {
            target = `#${target}`
         }
         return document.querySelector(target)
      }
      return target instanceof Element ? target : null
   }

   dispatchEvent(eventName, modal) {
      const event = new CustomEvent(eventName, { detail: { modal } })
      document.dispatchEvent(event)
   }

   isOpen(target) {
      const modal = this.resolveModal(target)
      return modal && modal.classList.contains(this.config.activeClass)
   }

   getOpenModals() {
      return [...this.currentOpenModals]
   }

   update() {
      this.destroy()
      this.currentOpenModals = []
      this.lastFocusedElement = null
      this.init()
      if (this.config.closeOnEsc) this.initEscListener()
      console.info('🌀 FEModals re-initialized')
   }

   destroy() {
      this.modals.forEach(modal => {
         if (modal._backdropHandler) modal.removeEventListener('click', modal._backdropHandler)
         if (modal._trapFocus) modal.removeEventListener('keydown', modal._trapFocus)
      })

      if (this._escHandler) document.removeEventListener('keydown', this._escHandler)

      if (this._clickHandler) {
         document.removeEventListener('click', this._clickHandler)
         this._clickHandler = null
      }

      this.modals = []
      this.currentOpenModals = []
   }
}

export default FEModals
export { FEModals }

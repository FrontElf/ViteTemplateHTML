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
 * - closeOnBack: boolean — close modal with browser Back button (default: false)
 * - closeAllOnEsc: boolean — close all modals or only the last one (default: true)
 * - singleOpen: boolean — allow only one modal open at a time (default: true)
 * - lockScroll: boolean — lock body scroll when modal is open (default: false)
 * - animationFallback: number — fallback delay in ms for animation completion (default: 400)
 * - bodyClass: string — class added to <body> when modal is open (default: 'modal-open')
 * - activeClass: string — class applied to active modal (default: 'open')
 * - initClass: string — initialization class (default: 'fe-modal-init')
 * - animatingClass: string — class applied during animation (default: 'is-animating')
 * - onBeforeOpen(modal)
 * - onAfterOpen(modal)
 * - onBeforeClose(modal)
 * - onAfterClose(modal, context)
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
         closeOnBack: false,
         closeAllOnEsc: true,
         singleOpen: true,
         lockScroll: false,
         animationFallback: 400,
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
      this.focusedBeforeOpen = new Map()
      this.lastFocusedElement = null
      this._savedBodyOverflow = null
      this._ignoreNextPopState = false
      this.isSwappingModals = false

      this.init()
      if (this.config.closeOnEsc) this.initEscListener()
      if (this.config.closeOnBack) this.initBackListener()
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

      const modalClickHandler = e => {
         if (e.target.closest(`${this.config.selectorOverlay} [${this.config.attrClose}]`)) {
            this.close(modal)
         } else if (e.target === overlay && overlay.hasAttribute(this.config.attrClose)) {
            this.close(modal)
         }
      }
      modal._modalClickHandler = modalClickHandler
      modal.addEventListener('click', modalClickHandler)

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

   initBackListener() {
      if (!window.history || !window.history.pushState) return

      this._popstateHandler = () => {
         if (this._ignoreNextPopState) {
            this._ignoreNextPopState = false
            return
         }

         if (!this.currentOpenModals.length) return

         const modal = this.currentOpenModals[this.currentOpenModals.length - 1]
         this.close(modal, { skipHistory: true })
      }

      window.addEventListener('popstate', this._popstateHandler)
   }

   async open(target) {
      const modal = this.resolveModal(target)
      if (!modal) return Promise.resolve()
      if (modal.classList.contains(this.config.activeClass) || modal._isOpening) return modal._openPromise || Promise.resolve()
      if (modal._isClosing && modal._closePromise) await modal._closePromise

      const replaceHistoryState = this.config.closeOnBack && this.config.singleOpen && this.currentOpenModals.length && this.isModalHistoryState()

      if (this.config.singleOpen && this.currentOpenModals.length) {
         this.isSwappingModals = true
         try {
            await Promise.all(
               this.currentOpenModals.map(m => this.close(m, { skipHistory: true }))
            )
         } catch (err) {
            console.error('Error closing modals:', err)
         } finally {
            this.isSwappingModals = false
         }
      }

      this.focusedBeforeOpen.set(modal, document.activeElement)
      if (!this.currentOpenModals.includes(modal)) this.currentOpenModals.push(modal)
      this.addHistoryEntry(modal, replaceHistoryState)
      return this._openNow(modal)
   }

   _openNow(modal) {
      modal._isOpening = true
      this.dispatchEvent('FeBeforeModalOpen', modal)
      if (typeof this.config.onBeforeOpen === 'function') this.config.onBeforeOpen(modal)

      modal.classList.add(this.config.animatingClass, this.config.activeClass)
      modal.setAttribute('aria-hidden', 'false')
      document.body.classList.add(this.config.bodyClass)

      if (this.config.lockScroll !== false) {
         if (this._savedBodyOverflow === null) this._savedBodyOverflow = document.body.style.overflow
         document.body.style.overflow = 'hidden'
      }

      if (!modal.hasAttribute('tabindex')) modal.setAttribute('tabindex', '-1')
      this.setupFocusTrap(modal)

      modal._openPromise = this.waitForModalAnimation(modal).then(() => {
         modal.classList.remove(this.config.animatingClass)
         modal._isOpening = false
         delete modal._openPromise
         this.dispatchEvent('FeAfterModalOpen', modal)
         if (typeof this.config.onAfterOpen === 'function') this.config.onAfterOpen(modal)
      })

      return modal._openPromise
   }

   setupFocusTrap(modal) {
      const focusFirstElement = () => {
         const focusable = this.getFocusableElements(modal)
         const firstEl = focusable[0] || modal
         firstEl.focus({ preventScroll: true })
      }

      const trapFocus = e => {
         if (e.key !== 'Tab') return

         const focusable = this.getFocusableElements(modal)
         if (!focusable.length) {
            e.preventDefault()
            modal.focus({ preventScroll: true })
            return
         }

         const firstEl = focusable[0]
         const lastEl = focusable[focusable.length - 1]

         if (e.shiftKey) {
            if (document.activeElement === firstEl || document.activeElement === modal) {
               e.preventDefault()
               lastEl.focus()
            }
         } else if (document.activeElement === lastEl) {
            e.preventDefault()
            firstEl.focus()
         }
      }

      if (modal._trapFocus) {
         modal.removeEventListener('keydown', modal._trapFocus)
      }

      modal._trapFocus = trapFocus
      modal.addEventListener('keydown', trapFocus)
      requestAnimationFrame(focusFirstElement)
   }

   getFocusableElements(modal) {
      const selector = [
         'a[href]',
         'area[href]',
         'button:not([disabled])',
         'input:not([disabled]):not([type="hidden"])',
         'select:not([disabled])',
         'textarea:not([disabled])',
         'iframe',
         'object',
         'embed',
         '[contenteditable]',
         '[tabindex]:not([tabindex="-1"])',
      ].join(',')

      return Array.from(modal.querySelectorAll(selector)).filter(el => {
         const styles = window.getComputedStyle(el)
         return styles.visibility !== 'hidden' && styles.display !== 'none' && el.offsetParent !== null
      })
   }

   waitForModalAnimation(modal) {
      return new Promise(resolve => {
         let settled = false
         let timeoutId

         const cleanup = () => {
            modal.removeEventListener('transitionend', onEnd)
            modal.removeEventListener('animationend', onEnd)
            window.clearTimeout(timeoutId)
         }

         const finish = () => {
            if (settled) return
            settled = true
            cleanup()
            resolve()
         }

         const onEnd = e => {
            if (e.target === modal) finish()
         }

         modal.addEventListener('transitionend', onEnd)
         modal.addEventListener('animationend', onEnd)

         timeoutId = window.setTimeout(finish, this.getAnimationFallbackDelay(modal))
      })
   }

   getAnimationFallbackDelay(modal) {
      const styles = window.getComputedStyle(modal)
      const toMs = value => {
         const normalized = value.trim()
         if (!normalized) return 0
         return normalized.endsWith('ms') ? parseFloat(normalized) : parseFloat(normalized) * 1000
      }
      const parseList = value => value.split(',').map(toMs)
      const transitionDurations = parseList(styles.transitionDuration)
      const transitionDelays = parseList(styles.transitionDelay)
      const animationDurations = parseList(styles.animationDuration)
      const animationDelays = parseList(styles.animationDelay)
      const longestTransition = Math.max(...transitionDurations.map((duration, index) => duration + (transitionDelays[index] || 0)), 0)
      const longestAnimation = Math.max(...animationDurations.map((duration, index) => duration + (animationDelays[index] || 0)), 0)
      const computedDelay = Math.max(longestTransition, longestAnimation)

      return Math.max(computedDelay + 50, this.config.animationFallback)
   }

   close(target, options = {}) {
      const modal = this.resolveModal(target)
      if (!modal) return Promise.resolve()
      if (modal._isClosing) return modal._closePromise || Promise.resolve()
      if (!modal.classList.contains(this.config.activeClass)) return Promise.resolve()
      const { skipHistory = false } = options

      if (!skipHistory) this.removeHistoryEntry()

      modal._isClosing = true
      this.dispatchEvent('FeBeforeModalClose', modal)
      if (typeof this.config.onBeforeClose === 'function') this.config.onBeforeClose(modal)

      modal.classList.add(this.config.animatingClass)
      modal.classList.remove(this.config.activeClass)

      if (modal._trapFocus) {
         modal.removeEventListener('keydown', modal._trapFocus)
         delete modal._trapFocus
      }

      modal._closePromise = this.waitForModalAnimation(modal).then(() => {
         modal.classList.remove(this.config.animatingClass)
         this.currentOpenModals = this.currentOpenModals.filter(m => m !== modal)
         modal.setAttribute('aria-hidden', 'true')
         modal._isClosing = false
         delete modal._closePromise

         if (!this.currentOpenModals.length) {
            document.body.classList.remove(this.config.bodyClass)
            if (this.config.lockScroll !== false) {
               document.body.style.overflow = this._savedBodyOverflow || ''
               this._savedBodyOverflow = null
            }
         }

         const focusedElement = this.focusedBeforeOpen.get(modal) || this.lastFocusedElement
         this.focusedBeforeOpen.delete(modal)

         if (focusedElement && typeof focusedElement.focus === 'function' && document.contains(focusedElement)) {
            focusedElement.focus({ preventScroll: true })
         }

         if (!this.currentOpenModals.length) this.lastFocusedElement = null

         this.dispatchEvent('FeAfterModalClose', modal)
         if (typeof this.config.onAfterClose === 'function') this.config.onAfterClose(modal, {
            isSwapping: this.isSwappingModals,
         })
      })

      return modal._closePromise
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

   isModalHistoryState() {
      return Boolean(window.history && window.history.state && window.history.state.feModal)
   }

   addHistoryEntry(modal, replace = false) {
      if (!this.config.closeOnBack || !window.history || !window.history.pushState) return

      const state = Object.assign({}, window.history.state || {}, {
         feModal: true,
         feModalId: modal.id || null,
      })

      if (replace) {
         window.history.replaceState(state, '', window.location.href)
      } else {
         window.history.pushState(state, '', window.location.href)
      }
   }

   removeHistoryEntry() {
      if (!this.config.closeOnBack || !this.isModalHistoryState()) return

      this._ignoreNextPopState = true
      window.history.back()
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
      this.focusedBeforeOpen.clear()
      this.lastFocusedElement = null
      this.init()
      if (this.config.closeOnEsc) this.initEscListener()
      if (this.config.closeOnBack) this.initBackListener()
      console.info('🌀 FEModals re-initialized')
   }

   destroy() {
      this.modals.forEach(modal => {
         if (modal._modalClickHandler) modal.removeEventListener('click', modal._modalClickHandler)
         if (modal._backdropHandler) modal.removeEventListener('click', modal._backdropHandler)
         if (modal._trapFocus) modal.removeEventListener('keydown', modal._trapFocus)
         modal.classList.remove(this.config.activeClass, this.config.animatingClass)
         modal.setAttribute('aria-hidden', 'true')
         delete modal._modalClickHandler
         delete modal._backdropHandler
         delete modal._trapFocus
         delete modal._openPromise
         delete modal._closePromise
         delete modal._isOpening
         delete modal._isClosing
      })

      if (this._escHandler) document.removeEventListener('keydown', this._escHandler)
      if (this._popstateHandler) document.removeEventListener('popstate', this._popstateHandler)

      if (this._clickHandler) {
         document.removeEventListener('click', this._clickHandler)
         this._clickHandler = null
      }
      this._popstateHandler = null

      this.modals = []
      this.currentOpenModals = []
      this.focusedBeforeOpen.clear()
      this.lastFocusedElement = null
      this.isSwappingModals = false
      if (this.config.lockScroll !== false && this._savedBodyOverflow !== null) {
         document.body.style.overflow = this._savedBodyOverflow
         this._savedBodyOverflow = null
      }
      document.body.classList.remove(this.config.bodyClass)
   }
}

export default FEModals
export { FEModals }

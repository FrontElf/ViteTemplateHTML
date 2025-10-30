import gsap from "gsap"
import { Power2 } from "gsap"

class MagicCursor {
   constructor(customConfig = {}) {
      // ====== Global options ===================
      this.config = {
         core: {
            selectors: {
               magicCursor: "#magic-cursor",
               ball: "#ball",
            },
            ratio: 0.1,
            sizes: {
               width: 12,
               height: 12,
            },
         },
         classes: {
            notHide: "not-hide-cursor",
            magneticHover: "magnetic-hover-on",
            alternativeHover: "alternative-hover-on",
            caretHover: "caret-hover-on",
            textHover: "data-text-hover-on",
            interactiveHover: "interactive-hover-on",
         },
         visibility: {
            hideSelectors: "a, button, .hide-cursor",
         },
         magnetic: {
            selector: ".magnetic-item",
            wrapperClass: "magnetic-wrap",
            hoverScale: 1.8,
            movement: 25,
            isHoverHide: true
         },
         alternative: {
            selector: ".cursor-alter",
            hoverSize: "100px",
         },
         carets: {
            selector: ".magic-caret",
            hoverScale: 1.3,
         },
         text: {
            attributeName: "data-cursor-text",
            textWrapperClass: "ball-view-text",
            hoverSize: 95,
         },
         interactive: {
            selector: ".interactive-item",
            actionSelector: ".interactive-action",
            imageSelector: ".interactive-image",
            hoverSize: "20vw",
         },
      }

      this.config = this.#deepMerge(this.config, customConfig)

      // ====== Core state ======
      this.magicCursor = document.querySelector(this.config.core.selectors.magicCursor)
      this.ball = document.querySelector(this.config.core.selectors.ball)
      this.mouse = { x: 0, y: 0 }
      this.pos = { x: 0, y: 0 }
      this.active = false
   }

   // =====================================================
   // ===================== INIT ==========================
   // =====================================================
   init() {
      if (!this.magicCursor || !this.ball) {
         console.warn("Magic cursor or ball element not found!")
         return
      }

      this.initCore()
      this.initMagnetic()
      this.initAlternative()
      this.initCarets()
      this.initText()
      this.initInteractive()
      this.initVisibility()
   }

   // =====================================================
   // ===================== CORE ==========================
   // =====================================================
   initCore() {
      const { sizes, ratio } = this.config.core
      gsap.set(this.ball, {
         xPercent: -50,
         yPercent: -50,
         width: sizes.width,
         height: sizes.height,
      })

      document.addEventListener("mousemove", (e) => {
         this.mouse.x = e.clientX
         this.mouse.y = e.clientY
      })

      gsap.ticker.add(() => {
         if (!this.active) {
            this.pos.x += (this.mouse.x - this.pos.x) * ratio
            this.pos.y += (this.mouse.y - this.pos.y) * ratio
            gsap.set(this.ball, { x: this.pos.x, y: this.pos.y })
         }
      })
      document.body.classList.add('magic-cursor-init')
   }

   // =====================================================
   // ================== VISIBILITY =======================
   // =====================================================
   initVisibility(custom = {}) {
      const opt = { ...this.config.visibility, ...custom }
      const { notHide } = this.config.classes
      const ball = this.ball
      const magicCursor = this.magicCursor

      document.querySelectorAll(opt.hideSelectors).forEach((el) => {
         if (!el.classList.contains(notHide) && !el.classList.contains("cursor-alter")) {
            el.addEventListener("mouseenter", () => {
               gsap.to(ball, { duration: 0.3, scale: 0, opacity: 0 })
            })
            el.addEventListener("mouseleave", () => {
               gsap.to(ball, { duration: 0.3, scale: 1, opacity: 1 })
            })
         }
      })

      document.addEventListener("mouseleave", () => {
         gsap.to(magicCursor, { duration: 0.3, autoAlpha: 0 })
      })

      document.addEventListener("mouseenter", () => {
         gsap.to(magicCursor, { duration: 0.3, autoAlpha: 1 })
      })

      document.addEventListener("mousemove", () => {
         gsap.to(magicCursor, { duration: 0.3, autoAlpha: 1 })
      })
   }

   // =====================================================
   // =================== MAGNETIC ========================
   // =====================================================
   initMagnetic(custom = {}) {
      const opt = { ...this.config.magnetic, ...custom }
      const { notHide, magneticHover } = this.config.classes
      const { selector, wrapperClass, hoverScale, movement, isHoverHide } = opt
      const { ball } = this
      const magicCursor = this.magicCursor

      const magneticItems = document.querySelectorAll(selector)
      const magneticItemsLinks = document.querySelectorAll(`a${selector}, button${selector}`)

      magneticItems.forEach((item) => {
         const wrap = document.createElement("div")
         wrap.classList.add(wrapperClass)
         item.parentNode.insertBefore(wrap, item)
         wrap.appendChild(item)
      })

      if (!isHoverHide) magneticItemsLinks.forEach((item) => item.classList.add(notHide))

      document.querySelectorAll(`.${wrapperClass}`).forEach((wrap) => {
         wrap.addEventListener("mousemove", (e) => {
            this.#parallaxCursor(e, wrap, 2)
            this.#callParallax(e, wrap, selector, movement)
         })

         wrap.addEventListener("mouseenter", () => {
            gsap.to(ball, { duration: 0.3, scale: hoverScale })
            this.active = true
            magicCursor.classList.add(magneticHover)
         })

         wrap.addEventListener("mouseleave", () => {
            gsap.to(ball, { duration: 0.3, scale: 1 })
            const target = wrap.querySelector(selector)
            if (target) gsap.to(target, { duration: 0.3, x: 0, y: 0, clearProps: "all" })
            this.active = false
            magicCursor.classList.remove(magneticHover)
         })
      })
   }

   // =====================================================
   // ================= ALTERNATIVE =======================
   // =====================================================
   initAlternative(custom = {}) {
      const opt = { ...this.config.alternative, ...custom }
      const { alternativeHover } = this.config.classes
      const { selector, hoverSize } = opt
      const { ball } = this
      const magicCursor = this.magicCursor

      document.querySelectorAll(selector).forEach((el) => {
         el.addEventListener("mouseenter", () => {
            magicCursor.classList.add(alternativeHover)
            gsap.to(ball, { duration: 0.3, width: hoverSize, height: hoverSize })
         })
         el.addEventListener("mouseleave", () => {
            gsap.to(ball, {
               duration: 0.3,
               width: this.config.core.sizes.width,
               height: this.config.core.sizes.height,
            })
            magicCursor.classList.remove(alternativeHover)
         })
      })
   }

   // =====================================================
   // ==================== CARETS =========================
   // =====================================================
   initCarets(custom = {}) {
      const opt = { ...this.config.carets, ...custom }
      const { caretHover } = this.config.classes
      const { selector, hoverScale } = opt
      const { ball } = this
      const magicCursor = this.magicCursor

      document.querySelectorAll(selector).forEach((wrap) => {
         wrap.addEventListener("mouseenter", () => {
            gsap.to(ball, { duration: 0.3, scale: hoverScale })
            magicCursor.classList.add(caretHover)
         })
         wrap.addEventListener("mouseleave", () => {
            gsap.to(ball, { duration: 0.3, scale: 1 })
            magicCursor.classList.remove(caretHover)
         })
      })
   }

   // =====================================================
   // ===================== TEXT ==========================
   // =====================================================
   initText(custom = {}) {
      const opt = { ...this.config.text, ...custom }
      const { textHover, notHide } = this.config.classes
      const { attributeName, textWrapperClass, hoverSize } = opt
      const { ball } = this
      const magicCursor = this.magicCursor

      document.querySelectorAll(`[${attributeName}]`).forEach((el) => {
         el.classList.add(notHide)
         el.addEventListener("mouseenter", () => {
            const ballView = document.createElement("div")
            ballView.classList.add(textWrapperClass)
            ballView.innerHTML = el.getAttribute(attributeName)
            ball.appendChild(ballView)

            magicCursor.classList.add(textHover)
            gsap.to(ball, { duration: 0.3, yPercent: -75, width: hoverSize, height: hoverSize })
            gsap.to(`.${textWrapperClass}`, { duration: 0.3, scale: 1, autoAlpha: 1 })
         })
         el.addEventListener("mouseleave", () => {
            gsap.to(ball, {
               duration: 0.3,
               yPercent: -50,
               width: this.config.core.sizes.width,
               height: this.config.core.sizes.height,
            })
            gsap.to(`.${textWrapperClass}`, { duration: 0.3, scale: 0, autoAlpha: 0, clearProps: "all" })
            ball.querySelector(`.${textWrapperClass}`)?.remove()
            magicCursor.classList.remove(textHover)
         })
      })
   }

   // =====================================================
   // ================== INTERACTIVE ======================
   // =====================================================
   initInteractive(custom = {}) {
      const opt = { ...this.config.interactive, ...custom }
      const { interactiveHover, notHide } = this.config.classes
      const { selector, actionSelector, imageSelector, hoverSize } = opt
      const { ball } = this
      const magicCursor = this.magicCursor

      document.querySelectorAll(selector).forEach((item) => {
         const image = item.querySelector(imageSelector)
         const action = item.querySelector(actionSelector)
         if (!image || !action) return

         action.classList.add(notHide)

         action.addEventListener("mouseenter", () => {
            magicCursor.classList.add(interactiveHover)
            ball.appendChild(image)
            gsap.to(ball, { duration: 0.3, width: hoverSize, height: hoverSize })
            image.querySelectorAll("video").forEach((v) => v.play())
         })

         action.addEventListener("mouseleave", () => {
            const appendEl = ball.querySelector(imageSelector)
            magicCursor.classList.remove(interactiveHover)
            if (appendEl) item.appendChild(appendEl)
            gsap.to(ball, {
               duration: 0.3,
               width: this.config.core.sizes.width,
               height: this.config.core.sizes.height,
            })
            image.querySelectorAll("video").forEach((v) => v.pause())
         })
      })
   }

   // =====================================================
   // ================ PRIVATE HELPERS ====================
   // =====================================================
   #callParallax(e, parent, selector, movement) {
      const target = parent.querySelector(selector)
      if (!target) return
      const rect = parent.getBoundingClientRect()
      const relX = e.clientX - rect.left
      const relY = e.clientY - rect.top

      gsap.to(target, {
         duration: 0.3,
         x: ((relX - rect.width / 2) / rect.width) * movement,
         y: ((relY - rect.height / 2) / rect.height) * movement,
         ease: Power2.easeOut,
      })
   }

   #parallaxCursor(e, parent, movement = 2) {
      const rect = parent.getBoundingClientRect()
      const relX = e.clientX - rect.left
      const relY = e.clientY - rect.top
      this.pos.x = rect.left + rect.width / 2 + (relX - rect.width / 2) / movement
      this.pos.y = rect.top + rect.height / 2 + (relY - rect.height / 2) / movement
      gsap.to(this.ball, { duration: 0.3, x: this.pos.x, y: this.pos.y })
   }

   #deepMerge(target, source) {
      for (const key in source) {
         if (
            source[key] &&
            typeof source[key] === "object" &&
            !Array.isArray(source[key])
         ) {
            if (!target[key]) target[key] = {}
            this.#deepMerge(target[key], source[key])
         } else {
            target[key] = source[key]
         }
      }
      return target
   }
}


const cursor = new MagicCursor()
cursor.init()
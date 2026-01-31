import gsap from "gsap"

const state = {
   mouse: { x: 0, y: 0 },
   pos: { x: 0, y: 0 },
   isLocked: false,
   mode: "default",
   baseSize: 12,
   text: {
      selector: "[data-cursor-text]",
      activeSize: 80,
      duration: 0.3,
      labelClass: "cursor-label",
      activeClass: "is-active"
   },
   magnetic: {
      selector: ".magnetic-item",
      movement: 25,
      scale: 2,
      duration: 0.3,
      activeClass: "is-magnetic"
   }
}

const deepMerge = (target, source) => {
   for (const key in source) {
      if (source[key] instanceof Object && !Array.isArray(source[key])) {
         if (!target[key]) Object.assign(target, { [key]: {} })
         deepMerge(target[key], source[key])
      } else {
         Object.assign(target, { [key]: source[key] })
      }
   }
   return target
}

const setMode = (ball, mode, payload = {}) => {
   if (!ball) return
   if (state.mode === mode) return

   state.mode = mode
   gsap.killTweensOf(ball)

   if (mode === "default") {
      ball.innerHTML = ""
      ball.classList.remove(state.text.activeClass)
      ball.classList.remove(state.magnetic.activeClass)

      gsap.to(ball, {
         width: state.baseSize,
         height: state.baseSize,
         scale: 1,
         duration: state.text.duration,
         overwrite: "auto"
      })
      return
   }

   if (mode === "text") {
      const text = payload.text || ""
      ball.innerHTML = `<span class="${state.text.labelClass}">${text}</span>`
      ball.classList.add(state.text.activeClass)
      ball.classList.remove(state.magnetic.activeClass)

      gsap.to(ball, {
         width: state.text.activeSize,
         height: state.text.activeSize,
         scale: 1,
         duration: state.text.duration,
         overwrite: "auto"
      })
      return
   }

   if (mode === "magnetic") {
      ball.innerHTML = ""
      ball.classList.remove(state.text.activeClass)
      ball.classList.add(state.magnetic.activeClass)

      gsap.set(ball, { width: state.baseSize, height: state.baseSize })
      gsap.to(ball, {
         scale: state.magnetic.scale,
         duration: state.magnetic.duration,
         overwrite: "auto"
      })
   }
}

const getTextZone = (el) => (el && el.closest ? el.closest(state.text.selector) : null)
const getMagnetWrap = (el) => (el && el.closest ? el.closest(".magnetic-wrap") : null)

export const initMagicCursor = (userConfig = {}) => {
   const defaultConfig = { selector: "#ball", ratio: 0.15, size: 12 }
   const config = deepMerge(defaultConfig, userConfig)
   const ball = document.querySelector(config.selector)
   if (!ball) return

   state.baseSize = config.size

   gsap.set(ball, {
      xPercent: -50,
      yPercent: -50,
      width: config.size,
      height: config.size,
      opacity: 0,
      scale: 1
   })

   const onFirstMove = (e) => {
      if (!e) return
      state.mouse.x = e.clientX
      state.mouse.y = e.clientY
      state.pos.x = e.clientX
      state.pos.y = e.clientY
      gsap.to(ball, { opacity: 1, duration: 0.3, overwrite: "auto" })
      window.removeEventListener("pointermove", onFirstMove)
   }

   window.addEventListener("pointermove", onFirstMove, { passive: true })
   window.addEventListener("pointermove", (e) => {
      if (!e) return
      state.mouse.x = e.clientX
      state.mouse.y = e.clientY
   }, { passive: true })

   gsap.ticker.add(() => {
      if (!state.isLocked) {
         state.pos.x += (state.mouse.x - state.pos.x) * config.ratio
         state.pos.y += (state.mouse.y - state.pos.y) * config.ratio
         gsap.set(ball, { x: state.pos.x, y: state.pos.y })
      }
   })
}

export const initCursorText = (userConfig = {}) => {
   state.text = deepMerge(state.text, userConfig)

   const ball = document.querySelector("#ball")
   const zones = document.querySelectorAll(state.text.selector)
   if (!zones || !zones.length) return

   document.addEventListener("pointerover", (e) => {
      if (!e) return
      if (state.mode === "magnetic") return
      const zone = getTextZone(e.target)
      if (!zone) return
      if (!ball) return
      const text = zone.getAttribute("data-cursor-text") || ""
      setMode(ball, "text", { text })
   }, true)

   document.addEventListener("pointerout", (e) => {
      if (!e) return
      if (state.mode === "magnetic") return
      const fromZone = getTextZone(e.target)
      if (!fromZone) return
      const toZone = getTextZone(e.relatedTarget)
      if (toZone) return
      if (!ball) return
      setMode(ball, "default")
   }, true)
}

export const initMagneticEffect = (userConfig = {}) => {
   state.magnetic = deepMerge(state.magnetic, userConfig)

   const ball = document.querySelector("#ball")
   const items = document.querySelectorAll(state.magnetic.selector)
   if (!items || !items.length) return

   items.forEach(item => {
      if (!item || !item.parentNode) return

      const wrap = document.createElement("div")
      wrap.classList.add("magnetic-wrap")
      item.parentNode.insertBefore(wrap, item)
      wrap.appendChild(item)

      wrap.addEventListener("pointermove", (e) => {
         if (!e) return

         const rect = wrap.getBoundingClientRect?.()
         if (!rect) return

         const relX = e.clientX - rect.left
         const relY = e.clientY - rect.top

         gsap.to(item, {
            x: ((relX - rect.width / 2) / rect.width) * state.magnetic.movement,
            y: ((relY - rect.height / 2) / rect.height) * state.magnetic.movement,
            duration: state.magnetic.duration,
            overwrite: "auto"
         })

         state.pos.x = rect.left + rect.width / 2 + (relX - rect.width / 2) / 2
         state.pos.y = rect.top + rect.height / 2 + (relY - rect.height / 2) / 2

         if (ball) {
            gsap.to(ball, {
               x: state.pos.x,
               y: state.pos.y,
               duration: state.magnetic.duration,
               overwrite: "auto"
            })
         }
      }, { passive: true })

      wrap.addEventListener("pointerenter", () => {
         state.isLocked = true
         if (ball) setMode(ball, "magnetic")
      })

      wrap.addEventListener("pointerleave", (e) => {
         state.isLocked = false

         if (ball) {
            ball.classList.remove(state.magnetic.activeClass)
            gsap.to(ball, { scale: 1, duration: state.magnetic.duration, overwrite: "auto" })
         }

         gsap.to(item, {
            x: 0,
            y: 0,
            duration: state.magnetic.duration + 0.1,
            clearProps: "all",
            overwrite: "auto"
         })

         if (!ball || !e) return

         const x = Number.isFinite(e.clientX) ? e.clientX : 0
         const y = Number.isFinite(e.clientY) ? e.clientY : 0

         const el = document.elementFromPoint?.(x, y)
         const zone = getTextZone(el)

         if (zone) {
            const text = zone.getAttribute("data-cursor-text") || ""
            setMode(ball, "text", { text })
         } else {
            setMode(ball, "default")
         }
      })
   })

   document.addEventListener("pointerover", (e) => {
      if (!e || !ball) return
      const wrap = getMagnetWrap(e.target)
      if (!wrap) return
      setMode(ball, "magnetic")
   }, true)
}

//========================================================================================================================================================
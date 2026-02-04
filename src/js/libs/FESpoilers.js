class FESpoilers {
  constructor(selector, options = {}) {
    this.defaultOptions = {
      selector: selector || '[data-spoiler]',
      imageSelector: '[data-spoiler-image]',
      contentSelector: '[data-spoiler-content]',
      titleSelector: '[data-spoiler-title]',
      resizeAttribute: 'data-spoiler-resize',
      stateAttribute: 'data-spoiler-state',
      groupAttribute: 'data-spoiler-group',
      indexAttribute: 'data-sp-index-el',
      imageGroupAttr: 'data-spoiler-image-group',
      imageIndexAttr: 'data-spoiler-image-index',
      activeImageClass: 'spoiler-img-active',
      showClass: 'spoiler-open',
      activeContentClass: 'show',
      hideAttr: 'hide',
      showAttr: 'show',
      initClass: 'init',
      initShowClass: 'init-show',
      initHiddenClass: 'init-hidden',
      duration: 350,
      initDelay: 0,
    }

    this.settings = { ...this.defaultOptions, ...options }
    this.spoilers = document.querySelectorAll(this.settings.selector)

    if (!this.spoilers.length) return

    this.timeoutMap = new WeakMap()
    this.groupCounters = {}
    this.clickHandler = this.clickHandler.bind(this)

    this.spoilers.forEach(spoiler => this.setupSpoiler(spoiler))
  }

  setupSpoiler(spoiler) {
    spoiler.screen = spoiler.hasAttribute(this.settings.resizeAttribute)
      ? parseInt(spoiler.getAttribute(this.settings.resizeAttribute))
      : null
    spoiler.group = spoiler.getAttribute(this.settings.groupAttribute)

    spoiler.content = spoiler.querySelector(this.settings.contentSelector)
    spoiler.titleBtn = spoiler.querySelector(this.settings.titleSelector)

    if (!spoiler.content || !spoiler.titleBtn) {
      console.warn('FESpoilers: Content or Title missing for', spoiler)
      return
    }

    // --- Розумна індексація ---
    if (spoiler.group) {
      if (!this.groupCounters[spoiler.group]) {
        this.groupCounters[spoiler.group] = 1
        this.indexImagesInGroup(spoiler.group)
      }

      // 1. Шукаємо ручний індекс у спойлера. 
      // 2. Якщо немає — беремо поточне значення лічильника.
      const manualIndex = spoiler.getAttribute(this.settings.indexAttribute)
      if (manualIndex) {
        spoiler._index = manualIndex
      } else {
        spoiler._index = this.groupCounters[spoiler.group].toString()
        this.groupCounters[spoiler.group]++
      }
    }

    this.startClasses(spoiler)

    if (spoiler.screen) {
      this.resizeHandler(spoiler)
    } else {
      this.init(spoiler)
    }

    if (this.getIsOpenState(spoiler)) {
      this.syncImages(spoiler, true)
    }
  }

  // Метод автоматично індексує тільки ті зображення, де індекс не вказано вручну
  indexImagesInGroup(groupName) {
    const images = document.querySelectorAll(`[${this.settings.imageGroupAttr}="${groupName}"]`)
    let autoIndex = 1

    images.forEach((img) => {
      if (!img.hasAttribute(this.settings.imageIndexAttr)) {
        // Пропускаємо значення, які вже зайняті ручним введенням в інших картинках (опціонально, але для простоти — просто інкремент)
        img.setAttribute(this.settings.imageIndexAttr, autoIndex.toString())
        autoIndex++
      }
    })
  }

  syncImages(spoiler, isOpen) {
    const group = spoiler.group
    const index = spoiler._index

    if (!group || !index) return

    const images = document.querySelectorAll(`[${this.settings.imageGroupAttr}="${group}"]`)

    images.forEach((img) => {
      const imgIndex = img.getAttribute(this.settings.imageIndexAttr)
      if (isOpen) {
        img.classList.toggle(this.settings.activeImageClass, imgIndex === index)
      } else {
        if (imgIndex === index) {
          img.classList.remove(this.settings.activeImageClass)
        }
      }
    })
  }

  dispatchEvents(spoiler, isOpen) {
    const eventName = isOpen ? 'feSpoilerOpen' : 'feSpoilerClose'
    const event = new CustomEvent(eventName, {
      detail: { spoiler },
      bubbles: true
    })
    spoiler.dispatchEvent(event)
    this.syncImages(spoiler, isOpen)
  }

  open(spoiler) {
    spoiler.setAttribute(this.settings.stateAttribute, this.settings.showAttr)
    spoiler.classList.add(this.settings.activeContentClass, this.settings.showClass)
    spoiler.titleBtn.setAttribute('aria-expanded', 'true')
    spoiler.content.setAttribute('aria-hidden', 'false')

    this.animation(spoiler, true)
    this.dispatchEvents(spoiler, true)
  }

  close(spoiler) {
    spoiler.setAttribute(this.settings.stateAttribute, this.settings.hideAttr)
    spoiler.classList.remove(this.settings.showClass)
    spoiler.titleBtn.setAttribute('aria-expanded', 'false')
    spoiler.content.setAttribute('aria-hidden', 'true')

    this.animation(spoiler, false)
    this.dispatchEvents(spoiler, false)
  }

  startClasses(spoiler) {
    const initState = spoiler.getAttribute(this.settings.stateAttribute) || this.settings.hideAttr

    if (initState === this.settings.showAttr) {
      spoiler.classList.add(this.settings.initShowClass)
      spoiler.titleBtn.setAttribute('aria-expanded', 'true')
      spoiler.content.setAttribute('aria-hidden', 'false')
    } else {
      spoiler.classList.add(this.settings.initHiddenClass)
      spoiler.titleBtn.setAttribute('aria-expanded', 'false')
      spoiler.content.setAttribute('aria-hidden', 'true')
    }
  }

  init(spoiler) {
    if (spoiler.classList.contains(this.settings.initClass)) return

    spoiler._clickHandler = (event) => {
      if (event.type === 'click' || event.key === 'Enter' || event.key === ' ') {
        if (event.key === ' ') event.preventDefault()
        this.clickHandler(spoiler)
      }
    }

    spoiler.titleBtn.addEventListener('click', spoiler._clickHandler)
    spoiler.titleBtn.addEventListener('keydown', spoiler._clickHandler)
    spoiler.classList.add(this.settings.initClass)
  }

  destroy(spoiler) {
    spoiler.classList.remove(this.settings.initClass, this.settings.initShowClass, this.settings.initHiddenClass)
    if (spoiler._clickHandler) {
      spoiler.titleBtn.removeEventListener('click', spoiler._clickHandler)
      spoiler.titleBtn.removeEventListener('keydown', spoiler._clickHandler)
      delete spoiler._clickHandler
    }
    if (spoiler._resizeHandler) {
      window.removeEventListener('resize', spoiler._resizeHandler)
      delete spoiler._resizeHandler
    }
    spoiler.content.style.height = ''
    spoiler.content.style.transition = ''
    spoiler.classList.remove(this.settings.showClass, this.settings.activeContentClass)
    spoiler.titleBtn.removeAttribute('aria-expanded')
    spoiler.content.removeAttribute('aria-hidden')
    this.syncImages(spoiler, false)
  }

  resizeHandler(spoiler) {
    const mediaQuery = window.matchMedia(`(max-width: ${spoiler.screen}px)`)
    const handleMedia = (e) => {
      e.matches ? this.init(spoiler) : this.destroy(spoiler)
    }
    handleMedia(mediaQuery)
    const listener = (e) => handleMedia(e)
    mediaQuery.addEventListener('change', listener)
    spoiler._mediaQuery = mediaQuery
    spoiler._mediaListener = listener
  }

  clickHandler(spoiler) {
    spoiler.group ? this.closeGroup(spoiler) : this.toggle(spoiler)
  }

  toggle(spoiler) {
    this.getIsOpenState(spoiler) ? this.close(spoiler) : this.open(spoiler)
  }

  getIsOpenState(spoiler) {
    return spoiler.getAttribute(this.settings.stateAttribute) === this.settings.showAttr
  }

  closeGroup(targetSpoiler) {
    const groupName = targetSpoiler.group
    this.spoilers.forEach(spoiler => {
      if (spoiler.group === groupName && spoiler !== targetSpoiler && this.getIsOpenState(spoiler)) {
        this.close(spoiler)
      }
    })
    this.toggle(targetSpoiler)
  }

  animation(spoiler, isOpen) {
    const element = spoiler.content
    const duration = this.settings.duration
    const previousTimeoutId = this.timeoutMap.get(element)
    if (previousTimeoutId) clearTimeout(previousTimeoutId)

    if (isOpen) {
      element.style.height = '0px'
      element.style.transition = `height ${duration}ms ease`
      element.offsetHeight
      element.style.height = `${element.scrollHeight}px`
      const timeoutId = setTimeout(() => {
        element.style.height = ''
        element.style.transition = ''
        this.timeoutMap.delete(element)
      }, duration)
      this.timeoutMap.set(element, timeoutId)
    } else {
      element.style.height = `${element.scrollHeight}px`
      element.style.transition = `height ${duration}ms ease`
      element.offsetHeight
      element.style.height = '0px'
      const timeoutId = setTimeout(() => {
        element.style.height = ''
        element.style.transition = ''
        spoiler.classList.remove(this.settings.activeContentClass)
        this.timeoutMap.delete(element)
      }, duration)
      this.timeoutMap.set(element, timeoutId)
    }
  }

  update() {
    const newSpoilers = document.querySelectorAll(this.settings.selector)
    this.spoilers.forEach(spoiler => {
      if (!Array.from(newSpoilers).includes(spoiler)) this.destroy(spoiler)
    })
    this.groupCounters = {}
    this.spoilers = newSpoilers
    this.spoilers.forEach(spoiler => this.setupSpoiler(spoiler))
  }
}

export default FESpoilers
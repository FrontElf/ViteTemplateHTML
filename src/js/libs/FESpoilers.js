
class FESpoilers {
  constructor(selector, options = {}) {
    this.defaultOptions = {
      selector: selector || '[data-spoiler]',
      contentSelector: '[data-spoiler-content]',
      titleSelector: '[data-spoiler-title]',
      resizeAttribute: 'data-spoiler-resize',
      stateAttribute: 'data-spoiler-state',
      groupAttribute: 'data-spoiler-group',
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
    this.spoilers.forEach(spoiler => this.setupSpoiler(spoiler))
  }

  setupSpoiler(spoiler) {
    spoiler.screen = spoiler.hasAttribute(this.settings.resizeAttribute)
      ? parseInt(spoiler.getAttribute(this.settings.resizeAttribute))
      : null
    spoiler.group = spoiler.hasAttribute(this.settings.groupAttribute)
      ? spoiler.getAttribute(this.settings.groupAttribute)
      : null
    spoiler.content = spoiler.querySelector(this.settings.contentSelector)
    spoiler.titleBtn = spoiler.querySelector(this.settings.titleSelector)

    spoiler._content = spoiler.content
    spoiler._titleBtn = spoiler.titleBtn

    this.startClasses(spoiler)

    if (spoiler.screen) {
      this.resizeHandler(spoiler)
    } else {
      this.init(spoiler)
    }
  }

  startClasses(spoiler) {
    const initState = spoiler.hasAttribute(this.settings.stateAttribute)
      ? spoiler.getAttribute(this.settings.stateAttribute)
      : this.settings.hideAttr

    if (initState === this.settings.showAttr) {
      spoiler.classList.add(this.settings.initShowClass)
    } else if (initState === this.settings.hideAttr) {
      spoiler.classList.add(this.settings.initHiddenClass)
    }
  }

  init(spoiler) {
    if (!spoiler.titleBtn || !spoiler.content) return

    spoiler.titleBtn.setAttribute('aria-expanded', this.getIsOpenState(spoiler))
    spoiler.content.setAttribute('aria-hidden', !this.getIsOpenState(spoiler))

    const handler = (event) => {
      if (event.type === 'click' || event.key === 'Enter' || event.key === ' ') {
        this.clickHandler(spoiler)
      }
    }
    spoiler.titleBtn.addEventListener('click', handler)
    spoiler._clickHandler = handler
    spoiler.classList.add(this.settings.initClass)

    if (this.getIsOpenState(spoiler)) {
      this.open(spoiler)
    }
  }

  destroy(spoiler) {
    spoiler.classList.remove(this.settings.initClass)
    spoiler.setAttribute(this.settings.stateAttribute, this.settings.hideAttr)
    if (spoiler._clickHandler) {
      spoiler.titleBtn.removeEventListener('click', spoiler._clickHandler)
      delete spoiler._clickHandler
    }
  }

  destroyAll() {
    this.spoilers.forEach(spoiler => this.destroy(spoiler))
  }

  resizeHandler(spoiler) {
    let isInit = false

    const initAction = () => {
      this.init(spoiler)
      isInit = true
    }

    const destroyAction = () => {
      this.destroy(spoiler)
      isInit = false
    }

    const handleResize = () => {
      if (window.innerWidth <= spoiler.screen && !isInit) {
        initAction()
      } else if (window.innerWidth > spoiler.screen && isInit) {
        destroyAction()
      }
    }

    const debouncedResize = this.debounce(handleResize, 200)
    window.addEventListener('resize', debouncedResize)
  }

  debounce(func, wait) {
    let timeout
    return function (...args) {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(this, args), wait)
    }
  }

  clickHandler(spoiler) {
    if (spoiler.group) {
      this.closeGroup(spoiler)
    } else {
      this.toggle(spoiler)
    }
  }

  toggle(spoiler) {
    if (this.getIsOpenState(spoiler)) {
      this.close(spoiler)
    } else {
      this.open(spoiler)
    }
  }

  open(spoiler) {
    spoiler.setAttribute(this.settings.stateAttribute, this.settings.showAttr)
    spoiler.classList.add(this.settings.activeContentClass, this.settings.showClass)
    spoiler.titleBtn.setAttribute('aria-expanded', 'true')
    spoiler.content.setAttribute('aria-hidden', 'false')
    this.animation(spoiler, true)
  }

  close(spoiler) {
    spoiler.setAttribute(this.settings.stateAttribute, this.settings.hideAttr)
    spoiler.classList.remove(this.settings.showClass)
    spoiler.titleBtn.setAttribute('aria-expanded', 'false')
    spoiler.content.setAttribute('aria-hidden', 'true')
    this.animation(spoiler, false)
  }

  getIsOpenState(spoiler) {
    return spoiler.getAttribute(this.settings.stateAttribute) === this.settings.showAttr
  }

  closeGroup(targetSpoiler) {
    this.spoilers.forEach(spoiler => {
      if (
        spoiler.group &&
        spoiler.getAttribute(this.settings.groupAttribute) === targetSpoiler.group
      ) {
        if (targetSpoiler !== spoiler) {
          this.close(spoiler)
        } else {
          this.toggle(spoiler)
        }
      }
    })
  }

  animation(spoiler, isOpen) {
    const element = spoiler.content
    const duration = this.settings.duration

    const setTransitionStyles = (height) => {
      element.style.height = height
      element.style.transition = `height ${duration}ms ease`
    }

    const resetStyles = () => {
      element.style.height = ''
      element.style.transition = ''
      if (!isOpen) {
        spoiler.classList.remove(this.settings.activeContentClass)
      }
    }

    const handleTimeout = (callback) => {
      const previousTimeoutId = this.timeoutMap.get(element)
      if (previousTimeoutId) {
        clearTimeout(previousTimeoutId)
      }
      const timeoutId = setTimeout(() => {
        callback()
        this.timeoutMap.delete(element)
      }, duration)
      this.timeoutMap.set(element, timeoutId)
    }

    if (isOpen) {
      const height = element.offsetHeight
      setTransitionStyles('0')
      element.offsetHeight
      setTransitionStyles(`${height}px`)
      handleTimeout(resetStyles)
    } else {
      setTransitionStyles(`${element.offsetHeight}px`)
      element.offsetHeight
      setTransitionStyles('0')
      handleTimeout(resetStyles)
    }
  }

  update() {
    const newSpoilers = document.querySelectorAll(this.settings.selector)

    this.spoilers.forEach(spoiler => {
      if (![...newSpoilers].includes(spoiler)) {
        this.destroy(spoiler)
      }
    })

    this.spoilers = newSpoilers

    this.spoilers.forEach(spoiler => {
      if (!spoiler.classList.contains(this.settings.initClass)) {
        this.setupSpoiler(spoiler)
      }
    })
  }
}

export default FESpoilers

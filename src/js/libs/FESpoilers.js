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
    // Прив'язуємо методи, щоб не губити контекст
    this.clickHandler = this.clickHandler.bind(this)

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

    if (!spoiler.content || !spoiler.titleBtn) {
      console.warn('FESpoilers: Content or Title missing for', spoiler)
      return
    }

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
      // Встановлюємо початкові aria атрибути, якщо він відкритий за замовчуванням
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

    // Зберігаємо посилання на обробник кліку прямо в елементі для коректного видалення
    spoiler._clickHandler = (event) => {
      if (event.type === 'click' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault() // Корисно, якщо це <a> або <button> у формі
        this.clickHandler(spoiler)
      }
    }

    spoiler.titleBtn.addEventListener('click', spoiler._clickHandler)
    // Додаємо клавіатурну доступність (опціонально, бо button і так це вміє, але для div корисно)
    spoiler.titleBtn.addEventListener('keydown', spoiler._clickHandler)

    spoiler.classList.add(this.settings.initClass)
  }

  destroy(spoiler) {
    spoiler.classList.remove(this.settings.initClass, this.settings.initShowClass, this.settings.initHiddenClass)

    // Видаляємо слухач кліків
    if (spoiler._clickHandler) {
      spoiler.titleBtn.removeEventListener('click', spoiler._clickHandler)
      spoiler.titleBtn.removeEventListener('keydown', spoiler._clickHandler)
      delete spoiler._clickHandler
    }

    // ВАЖЛИВО: Видаляємо слухач resize
    if (spoiler._resizeHandler) {
      window.removeEventListener('resize', spoiler._resizeHandler)
      delete spoiler._resizeHandler
    }

    // Скидаємо стилі
    spoiler.content.style.height = ''
    spoiler.content.style.transition = ''
    spoiler.classList.remove(this.settings.showClass, this.settings.activeContentClass)

    // Скидаємо атрибути
    spoiler.removeAttribute(this.settings.stateAttribute)
    spoiler.titleBtn.removeAttribute('aria-expanded')
    spoiler.content.removeAttribute('aria-hidden')
  }

  destroyAll() {
    this.spoilers.forEach(spoiler => this.destroy(spoiler))
  }

  resizeHandler(spoiler) {
    // Використовуємо matchMedia замість resize event, це продуктивніше
    const mediaQuery = window.matchMedia(`(max-width: ${spoiler.screen}px)`)

    const handleMedia = (e) => {
      if (e.matches) {
        this.init(spoiler)
      } else {
        this.destroy(spoiler)
      }
    }

    // Запускаємо один раз при старті
    handleMedia(mediaQuery)

    // Зберігаємо посилання на функцію для видалення (хоча для matchMedia це addListener/removeListener)
    // Але сучасний підхід через addEventListener('change')
    const listener = (e) => handleMedia(e)
    mediaQuery.addEventListener('change', listener)

    // Зберігаємо, щоб потім можна було зробити removeEventListener, якщо потрібно (хоча matchMedia живе окремо)
    // Для повної чистоти можна зберегти посилання на сам mediaQuery і listener
    spoiler._mediaQuery = mediaQuery
    spoiler._mediaListener = listener

    // Перевизначаємо destroy для цього конкретного кейсу, щоб чистити медіа-запити
    const originalDestroy = this.destroy.bind(this)
    this.destroy = (targetSpoiler) => {
      if (targetSpoiler === spoiler && targetSpoiler._mediaQuery) {
        targetSpoiler._mediaQuery.removeEventListener('change', targetSpoiler._mediaListener)
      }
      originalDestroy(targetSpoiler) // Але тут обережно з рекурсією, краще винести логіку очищення в окремий метод
    }

    // --- АБО простіший варіант через старий добрий resize з фіксом витоку: ---
    /*
    const debouncedResize = this.debounce(() => {
        if (window.innerWidth <= spoiler.screen && !spoiler.classList.contains(this.settings.initClass)) {
            this.init(spoiler)
        } else if (window.innerWidth > spoiler.screen && spoiler.classList.contains(this.settings.initClass)) {
            this.destroy(spoiler)
        }
    }, 200)

    window.addEventListener('resize', debouncedResize)
    spoiler._resizeHandler = debouncedResize // Зберігаємо для видалення в destroy()
    */
  }

  // ... (debounce залишаємо без змін або видаляємо, якщо юзаємо matchMedia) ...

  clickHandler(spoiler) {
    if (spoiler.group) {
      this.closeGroup(spoiler)
    } else {
      this.toggle(spoiler)
    }
  }

  toggle(spoiler) {
    this.getIsOpenState(spoiler) ? this.close(spoiler) : this.open(spoiler)
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
    const groupName = targetSpoiler.group
    this.spoilers.forEach(spoiler => {
      if (spoiler.group === groupName) {
        if (spoiler !== targetSpoiler && this.getIsOpenState(spoiler)) {
          this.close(spoiler)
        }
      }
    })
    // Після закриття інших, перемикаємо поточний
    this.toggle(targetSpoiler)
  }

  animation(spoiler, isOpen) {
    const element = spoiler.content
    const duration = this.settings.duration

    // Очищаємо попередні таймери для цього елемента
    const previousTimeoutId = this.timeoutMap.get(element)
    if (previousTimeoutId) clearTimeout(previousTimeoutId)

    if (isOpen) {
      // 1. Спочатку ставимо height: 0 (якщо він ще не 0)
      element.style.height = '0px'
      element.style.transition = `height ${duration}ms ease`

      // 2. Форсуємо reflow, щоб браузер "побачив" зміну з 0
      // eslint-disable-next-line no-unused-expressions
      element.offsetHeight

      // 3. Ставимо повну висоту (scrollHeight надійніше)
      element.style.height = `${element.scrollHeight}px`

      // 4. Після завершення анімації прибираємо жорстку висоту, щоб контент був адаптивним
      const timeoutId = setTimeout(() => {
        element.style.height = ''
        element.style.transition = ''
        this.timeoutMap.delete(element)
      }, duration)
      this.timeoutMap.set(element, timeoutId)

    } else {
      // 1. Ставимо поточну висоту в пікселях (бо transition не працює з auto на 0)
      element.style.height = `${element.scrollHeight}px`
      element.style.transition = `height ${duration}ms ease`

      // 2. Форсуємо reflow
      // eslint-disable-next-line no-unused-expressions
      element.offsetHeight

      // 3. Ставимо 0
      element.style.height = '0px'

      // 4. Клін-ап після закриття
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
    const currentSpoilersArr = Array.from(this.spoilers)

    // 1. Знищуємо ті, яких більше немає в DOM
    currentSpoilersArr.forEach(spoiler => {
      let stillExists = false
      newSpoilers.forEach(n => { if (n === spoiler) stillExists = true })
      if (!stillExists) this.destroy(spoiler)
    })

    // 2. Ініціалізуємо нові
    this.spoilers = newSpoilers
    this.spoilers.forEach(spoiler => {
      // Перевіряємо чи вже ініціалізований за наявністю класу або приватної властивості
      if (!spoiler.classList.contains(this.settings.initClass) && !spoiler._clickHandler) {
        this.setupSpoiler(spoiler)
      }
    })
  }
}

export default FESpoilers
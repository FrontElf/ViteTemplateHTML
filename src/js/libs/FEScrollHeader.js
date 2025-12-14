class FEScrollHeader {
  constructor(options = {}) {
    this.settings = {
      headerSelector: 'header',
      startScrolledClass: 'scrolled-page',
      scrolledDownClass: 'scrolled-down',
      scrollTrigger: 10,
      ...options,
    }

    this.header = document.querySelector(this.settings.headerSelector)
    this.lastScrollTop = 0
    this.ticking = false
    this.isInitialized = false

    this.handleScroll = this.handleScroll.bind(this)
    this.update = this.update.bind(this)
    this.init()
  }

  init() {
    if (!this.header || this.isInitialized) return

    window.addEventListener('scroll', this.handleScroll, { passive: true })
    this.isInitialized = true
    this.update()
  }

  destroy() {
    if (!this.isInitialized) return
    window.removeEventListener('scroll', this.handleScroll)
    document.documentElement.classList.remove(
      this.settings.startScrolledClass,
      this.settings.scrolledDownClass
    )

    this.isInitialized = false
    console.log('ScrollHeader instance destroyed 🗑️')
  }

  handleScroll() {
    if (!this.ticking) {
      window.requestAnimationFrame(this.update)
      this.ticking = true
    }
  }

  update() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const html = document.documentElement
    const { scrollTrigger, startScrolledClass, scrolledDownClass } = this.settings
    const currentScroll = scrollTop <= 0 ? 0 : scrollTop

    if (currentScroll > scrollTrigger) {
      html.classList.add(startScrolledClass)

      if (currentScroll > this.lastScrollTop) {
        html.classList.add(scrolledDownClass)
      } else {
        html.classList.remove(scrolledDownClass)
      }
    } else {
      html.classList.remove(startScrolledClass, scrolledDownClass)
    }

    this.lastScrollTop = currentScroll
    this.ticking = false
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const myHeader = new FEScrollHeader({
    scrollTrigger: 50,
  })
})
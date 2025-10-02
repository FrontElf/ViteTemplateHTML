class SmoothScrollNavigation {
  constructor({ headerSelector = "header", useHeaderOffset = true, extraOffset = 0 } = {}) {
    this.settings = { headerSelector, useHeaderOffset, extraOffset }
    this.init()
  }

  init() {
    this.scrollToBlock()
    window.addEventListener("load", () => this.scrollToHashOnLoad())
  }

  getOffset() {
    const header = this.settings.useHeaderOffset
      ? document.querySelector(this.settings.headerSelector)
      : null

    const headerOffset = header?.offsetHeight || 0
    return headerOffset + this.settings.extraOffset
  }

  scrollToTarget(el) {
    if (!el) return

    const offset = this.getOffset(el)
    const top = el.getBoundingClientRect().top + window.pageYOffset - offset

    window.scrollTo({
      top,
      behavior: "smooth"
    })
  }

  scrollToBlock() {
    document.addEventListener("click", (e) => {
      const link = e.target.closest('a[href^="#"], a[href^="/"], a[href^="http"]')
      if (!link) return

      const href = link.getAttribute("href")
      if (!href) return

      const isExternal = link.hostname && link.hostname !== location.hostname

      if (href.startsWith("#")) {
        e.preventDefault()
        const id = href.slice(1)
        if (!id) return
        const target = document.querySelector(`#${CSS.escape(id)}`)
        this.scrollToTarget(target)
      } else if (href.includes("#") && href.startsWith("/")) {
        e.preventDefault()
        const [page, hash] = href.split("#")
        if (!hash) return

        if (window.location.pathname === page) {
          const target = document.querySelector(`#${CSS.escape(hash)}`)
          this.scrollToTarget(target)
        } else {
          window.location.href = `${page}#${hash}`
        }
      } else if (href.includes("#") && href.startsWith("http") && !isExternal) {
        e.preventDefault()
        window.location.href = href
      }
    })
  }

  scrollToHashOnLoad() {
    const hash = window.location.hash
    if (!hash || hash.length <= 1) return

    const el = document.querySelector(`#${CSS.escape(hash.slice(1))}`)
    if (el) {
      setTimeout(() => this.scrollToTarget(el), 100)
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new SmoothScrollNavigation({
    headerSelector: ".header",
    useHeaderOffset: true,
    extraOffset: 0
  })
})

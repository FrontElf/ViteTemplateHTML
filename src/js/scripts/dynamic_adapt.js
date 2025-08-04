// Dynamic Adapt v.1
// HTML data-da="where(uniq class name),when(breakpoint),position(digi)"
// e.x. data-da=".item,992,2"
// Andrikanych Yevhen 2020
// https://www.youtube.com/c/freelancerlifestyle

class DynamicAdapt {
  constructor(type = 'max') {
    this.type = type
    this.className = '_dynamic_adapt_'
    this.objects = []
    this.mediaQueries = []
  }

  init() {
    this.nodes = Array.from(document.querySelectorAll('[data-da]'))
    this.objects = this.nodes.map((node) => this.parseNode(node)).filter(Boolean)
    this.sortObjects()

    this.mediaQueries = [...new Set(
      this.objects.map(({ breakpoint }) => `(${this.type}-width: ${breakpoint}px),${breakpoint}`)
    )]

    this.mediaQueries.forEach((media) => {
      const [query, bp] = media.split(',')
      const matchMedia = window.matchMedia(query)
      const group = this.objects.filter(obj => obj.breakpoint === bp)

      const handler = () => this.mediaHandler(matchMedia, group)
      matchMedia.addEventListener('change', handler)
      handler()
    })
  }

  parseNode(node) {
    const raw = node.dataset.da?.trim()
    if (!raw) return null

    const [selector, breakpoint = '767', place = 'last'] = raw.split(',').map(s => s.trim())

    // Шукаємо батьківський елемент з data-da-parent, або глобально
    const parentScope = node.closest('[data-da-parent]') || document
    const destination = parentScope.querySelector(selector)

    if (!destination) {
      console.warn(`DynamicAdapt: destination not found "${selector}"`, parentScope)
      return null
    }

    return {
      element: node,
      parent: node.parentNode,
      destination,
      breakpoint,
      place,
      index: this.getIndexInParent(node.parentNode, node),
    }
  }

  mediaHandler(media, objects) {
    if (media.matches) {
      objects.forEach(obj => this.moveTo(obj))
    } else {
      objects.forEach(obj => this.moveBack(obj))
    }
  }

  moveTo({ element, destination, place }) {
    if (!destination || !element) return
    element.classList.add(this.className)

    if (place === 'first') {
      destination.prepend(element)
    } else if (place === 'last' || place >= destination.children.length) {
      destination.append(element)
    } else {
      const index = parseInt(place, 10)
      const ref = destination.children[index]
      ref ? ref.before(element) : destination.append(element)
    }
  }

  moveBack({ parent, element, index }) {
    if (!parent || !element) return
    if (!element.classList.contains(this.className)) return

    element.classList.remove(this.className)

    const ref = parent.children[index]
    ref ? ref.before(element) : parent.append(element)
  }

  getIndexInParent(parent, element) {
    return Array.prototype.indexOf.call(parent.children, element)
  }

  sortObjects() {
    const getWeight = (place) => {
      if (place === 'first') return -1
      if (place === 'last') return 9999
      return parseInt(place, 10)
    }

    const dir = this.type === 'min' ? 1 : -1

    this.objects.sort((a, b) => {
      if (a.breakpoint !== b.breakpoint) {
        return dir * (a.breakpoint - b.breakpoint)
      }
      return getWeight(a.place) - getWeight(b.place)
    })
  }
}

// ініціалізація
document.addEventListener('DOMContentLoaded', () => {
  const da = new DynamicAdapt('max')
  da.init()
})

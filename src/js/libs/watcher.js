/**
 * ScrollWatcher (на базі Intersection Observer API)
 * Призначення: Ефективне відстеження видимості елементів на основі
 * атрибутів data-watch-*, групуючи їх за однаковими параметрами спостереження.
 */

class ScrollWatcher {
  constructor(props = {}) {
    let defaultConfig = {
      logging: true,
      selector: '[data-watch]',
      viewClass: '_watcher-view',
    }

    this.config = Object.assign(defaultConfig, props)
    this.observers = new Map()

    if (!document.documentElement.classList.contains('watcher')) {
      this.scrollWatcherRun()
    }
  }

  scrollWatcherUpdate() {
    this.scrollWatcherRun()
  }

  scrollWatcherRun() {
    document.documentElement.classList.add('watcher')
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()

    const items = document.querySelectorAll(this.config.selector)
    this.scrollWatcherConstructor(items)
  }

  scrollWatcherConstructor(items) {
    if (items.length === 0) return

    const groups = new Map()
    const elementsArray = Array.from(items)

    elementsArray.forEach((item) => {
      const watchRoot = item.dataset.watchRoot ?? null
      const watchMargin = item.dataset.watchMargin ?? '0px'
      const watchThreshold = item.dataset.watchThreshold ?? 0

      const key = `${watchRoot}|${watchMargin}|${watchThreshold}`

      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key).push(item)
    })

    groups.forEach((groupItems, key) => {
      const [root, margin, threshold] = key.split('|')
      const paramsWatch = { root, margin, threshold }

      const configWatcher = this.getScrollWatcherConfig(paramsWatch)

      if (configWatcher) {
        this.scrollWatcherInit(groupItems, configWatcher, key)
      }
    })
  }

  getScrollWatcherConfig(paramsWatch) {
    let configWatcher = {}

    if (paramsWatch.root && paramsWatch.root !== 'null') {
      configWatcher.root = document.querySelector(paramsWatch.root)
    }

    configWatcher.rootMargin = paramsWatch.margin
    if (
      paramsWatch.margin.indexOf('px') < 0 &&
      paramsWatch.margin.indexOf('%') < 0
    ) {
      return
    }

    if (paramsWatch.threshold === 'prx') {
      paramsWatch.threshold = []
      for (let i = 0; i <= 1.0; i += 0.005) {
        paramsWatch.threshold.push(i)
      }
    } else {
      paramsWatch.threshold = String(paramsWatch.threshold).split(',').map(Number)
    }
    configWatcher.threshold = paramsWatch.threshold

    return configWatcher
  }

  scrollWatcherCreate(configWatcher, key) {
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        this.scrollWatcherCallback(entry, observer)
      })
    }, configWatcher)
    this.observers.set(key, observer)
    return observer
  }

  scrollWatcherInit(items, configWatcher, key) {
    const observer = this.scrollWatcherCreate(configWatcher, key)
    items.forEach((item) => observer.observe(item))
  }

  scrollWatcherIntersecting(entry, targetElement) {
    const viewClass = this.config.viewClass

    if (entry.isIntersecting) {
      if (!targetElement.classList.contains(viewClass)) {
        targetElement.classList.add(viewClass)
      }
    } else {
      if (targetElement.classList.contains(viewClass)) {
        targetElement.classList.remove(viewClass)
      }
    }
  }

  scrollWatcherOff(targetElement, observer) {
    observer.unobserve(targetElement)
  }

  scrollWatcherCallback(entry, observer) {
    const targetElement = entry.target
    this.scrollWatcherIntersecting(entry, targetElement)

    if (targetElement.hasAttribute('data-watch-once') && entry.isIntersecting) {
      this.scrollWatcherOff(targetElement, observer)
    }

    document.dispatchEvent(
      new CustomEvent('watcherCallback', {
        detail: {
          entry: entry,
          target: targetElement,
        },
      })
    )
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const watcher = new ScrollWatcher()
})
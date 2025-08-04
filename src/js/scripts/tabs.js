import { getHash, setHash, _slideUp, _slideDown, dataMediaQueries } from './functions.js'

class TabsController {
   constructor() {
      this.tabs = []
      this.hashData = this.getHashData()

      this.config = {
         selectorTabs: '[data-tabs]',
         selectorBody: '[data-tabs-body]',
         selectorTitle: '[data-tabs-title]',
         selectorContent: '[data-tab]',
         classInit: '_tab-init',
         classActive: '_tab-active',
         classSpoller: '_tab-spoller',
         attrContent: 'data-tabs-item',
         attrHash: 'data-tabs-hash',
         classPrefixActiveTab: 'active-tab-',
         classSlide: '_slide',
      }
   }

   init() {
      this.tabs = Array.from(document.querySelectorAll(this.config.selectorTabs))
      if (!this.tabs.length) return

      this.tabs.forEach((block, index) => {
         block.classList.add(this.config.classInit)
         block.dataset.tabsIndex = index
         block.addEventListener('click', (e) => this.onClick(e, block))
         this.initBlock(block)
      })

      const mdQueries = dataMediaQueries(this.tabs, 'tabs')
      if (Array.isArray(mdQueries) && mdQueries.length) {
         mdQueries.forEach(({ matchMedia, itemsArray }) => {
            matchMedia.addEventListener('change', () => this.setTitlePosition(itemsArray, matchMedia))
            this.setTitlePosition(itemsArray, matchMedia)
         })
      }
   }

   getHashData() {
      const hash = getHash()
      const match = hash?.match(/^tab-(\d+)-(\d+)$/)
      return match ? [match[1], match[2]] : []
   }

   initBlock(block) {
      const titles = this.filter(block, this.config.selectorTitle)
      const contents = this.filter(block, this.config.selectorContent)
      const blockIndex = block.dataset.tabsIndex
      const isActiveFromHash = this.hashData[0] === blockIndex

      titles.forEach((title, i) => {
         const content = contents[i]
         if (!content) return

         const tabId = `tab-${blockIndex}-${i}`
         const panelId = `tabpanel-${blockIndex}-${i}`

         title.setAttribute('role', 'tab')
         title.setAttribute('id', tabId)
         title.setAttribute('aria-controls', panelId)
         title.setAttribute('tabindex', '-1')

         content.setAttribute('role', 'tabpanel')
         content.setAttribute('id', panelId)
         content.setAttribute('aria-labelledby', tabId)
         content.setAttribute(this.config.attrContent, '')

         if (isActiveFromHash && +this.hashData[1] === i) {
            title.classList.add(this.config.classActive)
         }
      })

      this.setStatus(block)
   }

   setStatus(block) {
      const titles = this.filter(block, this.config.selectorTitle)
      const contents = this.filter(block, this.config.selectorContent)
      const duration = block.dataset.tabsAnimate ? +block.dataset.tabsAnimate : 0
      const updateHash = block.hasAttribute(this.config.attrHash)

      block.className = block.className.replace(
         new RegExp(`\\b${this.config.classPrefixActiveTab}\\d+\\b`, 'g'),
         ''
      )

      titles.forEach((title, i) => {
         const content = contents[i]
         if (!content) return

         const isActive = title.classList.contains(this.config.classActive)

         title.setAttribute('aria-selected', isActive)
         title.setAttribute('tabindex', isActive ? '0' : '-1')

         if (isActive) {
            block.classList.add(`${this.config.classPrefixActiveTab}${i}`)
            duration ? _slideDown(content, duration) : (content.hidden = false)
            if (updateHash && !content.closest('.popup')) {
               setHash(`tab-${block.dataset.tabsIndex}-${i}`)
            }
         } else {
            duration ? _slideUp(content, duration) : (content.hidden = true)
         }
      })
   }

   setTitlePosition(blocks, media) {
      blocks.forEach(({ item }) => {
         const titles = this.filter(item, this.config.selectorTitle)
         const contents = this.filter(item, this.config.selectorContent)
         const contentWrapper = item.querySelector(this.config.selectorBody)

         contents.forEach((content, i) => {
            if (!titles[i]) return
            if (media.matches) {
               contentWrapper.append(titles[i])
               contentWrapper.append(content)
               item.classList.add(this.config.classSpoller)
            } else {
               content.before(titles[i])
               item.classList.remove(this.config.classSpoller)
            }
         })
      })
   }

   onClick(e, block) {
      const tab = e.target.closest(this.config.selectorTitle)
      if (!tab || tab.classList.contains(this.config.classActive) || block.querySelector(`.${this.config.classSlide}`)) return

      const currentTabs = this.filter(block, this.config.selectorTitle)
      currentTabs.forEach((t) => t.classList.remove(this.config.classActive))
      tab.classList.add(this.config.classActive)
      this.setStatus(block)
      e.preventDefault()
   }

   filter(scope, selector) {
      return Array.from(scope.querySelectorAll(selector)).filter(el => el.closest(this.config.selectorTabs) === scope)
   }
}

document.addEventListener('DOMContentLoaded', () => {
   new TabsController().init()
})

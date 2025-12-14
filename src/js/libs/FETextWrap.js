export default class FETextWrap {
   constructor({
      selector,
      splitType = 'letter',
      baseClass = 'anim-text',
      wordClass = null,
      letterClass = null,
      wrapperClass = 'text-wrapper',
      addIndices = true
   } = {}) {
      this.elements = document.querySelectorAll(selector)
      this.splitType = splitType
      this.baseClass = baseClass
      this.wordClass = wordClass || `${baseClass}--word`
      this.letterClass = letterClass || `${baseClass}--letter`
      this.wrapperClass = wrapperClass
      this.addIndices = addIndices
      this.originalState = new Map()

      this.init()
   }

   init() {
      this.elements.forEach(el => {
         if (!this.originalState.has(el)) {
            this.originalState.set(el, el.innerHTML)
         }

         if (!el.getAttribute('aria-label')) {
            el.setAttribute('aria-label', el.textContent.trim())
         }
         el.setAttribute('aria-hidden', 'false')

         const indexCounter = { value: 0 }

         const traverseAndWrap = (node) => {
            if (node.nodeType === 3) {
               const text = node.nodeValue
               if (!text.trim()) return

               const wrapper = document.createElement('span')
               if (this.wrapperClass) wrapper.classList.add(this.wrapperClass)
               wrapper.setAttribute('aria-hidden', 'true')

               wrapper.innerHTML = this._processText(text, indexCounter)
               node.replaceWith(wrapper)
            }
            else if (node.nodeType === 1 && !node.classList.contains(this.baseClass)) {
               Array.from(node.childNodes).forEach(child => traverseAndWrap(child))
            }
         }

         Array.from(el.childNodes).forEach(child => traverseAndWrap(child))
      })
   }

   _processText(text, indexCounter) {
      if (this.splitType === 'word') {
         return text.split(' ').map(word => {
            if (!word) return ''
            return this._wrap(word, this.wordClass, indexCounter)
         }).join(' ')
      }

      if (this.splitType === 'letter') {
         return text.split('').map(char => {
            if (char === ' ') return ' '
            return this._wrap(char, this.letterClass, indexCounter)
         }).join('')
      }

      if (this.splitType === 'full') {
         return text.split(' ').map(word => {
            if (!word) return ''

            const wrappedLetters = word.split('').map(char => {
               return this._wrap(char, this.letterClass, indexCounter)
            }).join('')

            return `<span class="${this.wordClass}" style="display: inline-block; white-space: nowrap;">${wrappedLetters}</span>`
         }).join(' ')
      }

      return text
   }

   _wrap(content, className, indexCounter) {
      let style = 'display: inline-block;'
      if (this.addIndices) {
         style += ` --i: ${indexCounter.value++};`
      }
      return `<span class="${className}" style="${style}">${content}</span>`
   }

   destroy() {
      this.elements.forEach(el => {
         if (this.originalState.has(el)) {
            el.innerHTML = this.originalState.get(el)
            el.removeAttribute('aria-label')
            el.removeAttribute('aria-hidden')
         }
      })
      this.originalState.clear()
   }

   refresh() {
      this.destroy()
      this.init()
   }
}
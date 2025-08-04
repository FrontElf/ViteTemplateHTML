class FiltersPage {
   constructor(container, {
      pagesSelector,
      nextButtonSelector,
      prevButtonSelector,
      submitButtonSelector,
   }) {
      this.filtersPagesContainer = container
      this.submitBtn = this.filtersPagesContainer.querySelector(submitButtonSelector)
      this.nextBtn = this.filtersPagesContainer.querySelectorAll(nextButtonSelector)
      this.prevBtn = this.filtersPagesContainer.querySelector(prevButtonSelector)
      this.filtersPages = Array.from(this.filtersPagesContainer.querySelectorAll(pagesSelector))
      this.currentPageIndex = 0

      if (this.filtersPages.length === 0) return

      this.init()
   }

   init() {
      this.submitBtn.disabled = true
      this.nextBtn.forEach(button => button.setAttribute('disabled', ''))

      this.filtersPagesContainer.closest('form')?.addEventListener('reset', () => {
         this.resetForm()
      })

      this.hiddenAllPages()
      this.showPage(this.filtersPages[this.currentPageIndex])
      this.renderQuizCounter(this.filtersPagesContainer, this.currentPageIndex + 1, this.filtersPages.length)

      this.filtersPagesContainer.addEventListener('click', (e) => {
         const target = e.target
         if (target.hasAttribute('data-filter-next')) {
            this.showNextPage()
         } else if (target.hasAttribute('data-filter-prev')) {
            this.showPrevPage()
         }
      })

      this.watchFilters()
   }

   resetForm() {
      this.hiddenAllPages()
      this.showPage(this.filtersPages[0])
      this.renderQuizCounter(this.filtersPagesContainer, 1, this.filtersPages.length)
      this.currentPageIndex = 0
      this.nextBtn.forEach(button => button.setAttribute('disabled', ''))
   }

   showNextPage() {
      if (this.currentPageIndex < this.filtersPages.length - 1 && this.isPageValid(this.filtersPages[this.currentPageIndex])) {
         this.hiddenAllPages()
         this.currentPageIndex++
         this.showPage(this.filtersPages[this.currentPageIndex])
         this.renderQuizCounter(this.filtersPagesContainer, this.currentPageIndex + 1, this.filtersPages.length)
      }
   }

   isPageValid(page) {
      const inputs = Array.from(page.querySelectorAll('input, select, textarea'))
      return inputs.every(input => {
         if (input.type === 'checkbox') {
            const checkboxes = Array.from(page.querySelectorAll(`input[type="checkbox"][name="${input.name}"]`))
            return checkboxes.some(checkbox => checkbox.checked)
         } else if (input.type === 'radio') {
            const groupInputs = Array.from(page.querySelectorAll(`input[name="${input.name}"]`))
            return groupInputs.some(inp => inp.checked)
         } else {
            return input.value.trim() !== ''
         }
      })
   }

   showPrevPage() {
      if (this.currentPageIndex > 0) {
         this.hiddenAllPages()
         this.clearPageInputs(this.filtersPages[this.currentPageIndex])
         this.clearPageInputs(this.filtersPages[this.currentPageIndex - 1])
         this.currentPageIndex--
         this.showPage(this.filtersPages[this.currentPageIndex])
         this.renderQuizCounter(this.filtersPagesContainer, this.currentPageIndex + 1, this.filtersPages.length)
      }
   }

   hiddenAllPages() {
      this.filtersPages.forEach(page => page.setAttribute('hidden', ''))
   }

   showPage(page) {
      page.removeAttribute('hidden')
      const firstInput = page.querySelector('input, select, textarea, button')
      if (firstInput) {
         firstInput.focus()
      }
   }

   renderQuizCounter(container, current, total) {
      const modal = container.closest('.modal')
      const currentQuizPage = modal?.querySelector('[data-current-page-quiz]')
      const allQuizPages = modal?.querySelector('[data-all-pages-quiz]')
      if (currentQuizPage) {
         currentQuizPage.textContent = current
      }
      if (allQuizPages) {
         allQuizPages.textContent = total
      }
   }

   watchFilters() {
      this.filtersPages.forEach(page => {
         page.addEventListener('input', () => {
            this.updateNextButtonState(page)
         })
      })
   }

   updateNextButtonState(page) {
      const nextButton = page.querySelector('button[data-filter-next]')
      if (nextButton) {
         const isValid = this.isPageValid(page)
         if (isValid) {
            nextButton.disabled = false
         } else {
            nextButton.disabled = true
         }
      }

      if (this.currentPageIndex === this.filtersPages.length - 1) {
         this.submitBtn.disabled = false
      } else {
         this.submitBtn.disabled = true
      }
   }

   clearPageInputs(page) {
      Array.from(page.querySelectorAll('input-quiz')).forEach(input => {
         if (input.type === 'radio') {
            input.checked = false
         } else if (input.type === 'text' || input.type === 'email' || input.type === 'number') {
            input.value = ''
         } else {
            input.checked = false
         }
      })
      page.classList.remove('checked-filter')
      this.updateNextButtonState(page)
   }
}

const quizContainers = document.querySelectorAll('[data-filters-pages]')
quizContainers.forEach(container => {
   new FiltersPage(container, {
      pagesSelector: '[data-filters-page]',
      nextButtonSelector: '[data-filter-next]',
      prevButtonSelector: '[data-filter-prev]',
      submitButtonSelector: 'button[type="submit"]'
   })
})

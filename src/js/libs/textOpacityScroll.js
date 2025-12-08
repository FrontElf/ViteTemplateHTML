/**
 * FETextReveal — Реалізує ефект прогресивного розкриття тексту при прокручуванні.
 * Використовує requestAnimationFrame для оптимізації продуктивності.
 */
function textOpacityScrollOptimized() {
	const sections = []
	let isTicking = false

	document.querySelectorAll('.text-section').forEach(item => {
		const itemValue = item.querySelector('.text-section__value')
		const itemMask = item.querySelector('.text-section__mask')

		if (!itemValue || !itemMask) return

		const speed = +itemValue.dataset.textSpeed || 300
		const defaultOpacity = +itemValue.dataset.textOpacity || 0.2

		itemValue.innerHTML = itemValue.innerText.replace(/(\S|\s)/g,
			`<span style="transition: opacity ${speed}ms; opacity: ${defaultOpacity};">$1</span>`
		)

		sections.push({
			element: item,
			mask: itemMask,
			words: Array.from(itemValue.querySelectorAll('span')),
			defaultOpacity: defaultOpacity,
			lastCalculatedIndex: -1
		})
	})

	if (sections.length === 0) return

	function updateTextOpacity() {
		sections.forEach(section => {
			const { mask, words, defaultOpacity, lastCalculatedIndex } = section
			const maskRect = mask.getBoundingClientRect()
			const viewportHeight = window.innerHeight
			const startPosition = viewportHeight
			const totalDistance = viewportHeight + maskRect.height
			let progress = 0

			if (maskRect.top < viewportHeight && maskRect.bottom > 0) {
				progress = Math.min(1, Math.max(0, (startPosition - maskRect.top) / totalDistance))
			} else if (maskRect.bottom <= 0) {
				progress = 1
			}

			const newIndex = Math.floor(words.length * progress) - 1

			if (newIndex !== lastCalculatedIndex) {
				section.lastCalculatedIndex = newIndex
				addOpacity(words, newIndex, defaultOpacity)
			}
		})
		isTicking = false
	}

	function addOpacity(itemWords, currentWord, defaultOpacity) {
		itemWords.forEach((itemWord, index) => {
			const newOpacity = index <= currentWord ? 1 : defaultOpacity

			if (parseFloat(itemWord.style.opacity) !== newOpacity) {
				itemWord.style.opacity = newOpacity
			}
		})
	}

	window.addEventListener('scroll', () => {
		if (!isTicking) {
			window.requestAnimationFrame(updateTextOpacity)
			isTicking = true
		}
	})
	updateTextOpacity()
}

window.addEventListener('DOMContentLoaded', function () {
	textOpacityScrollOptimized()
})
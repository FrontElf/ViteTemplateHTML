export function textOpacityScroll() {
	const items = document.querySelectorAll('.text-section')
	if (items.length) {
		items.forEach(item => {
			const itemValue = item.querySelector('.text-section__value')
			const itemMask = item.querySelector('.text-section__mask')
			const itemSpeed = +itemValue.dataset.textSpeed || 300
			const itemOpacity = +itemValue.dataset.textOpacity || 0.2

			itemValue.innerHTML =
				itemValue.innerText.replace(/(\S|\s)/g,
					`<span style="transition: opacity ${itemSpeed}ms; opacity:${itemOpacity};">$1</span>`)

			window.addEventListener('scroll', function () {
				const maskPosition = itemMask.getBoundingClientRect().top - window.innerHeight
				const itemWay = Math.abs(maskPosition) / (window.innerHeight + itemMask.offsetHeight) * 100
				const itemWords = itemValue.querySelectorAll('span')
				const currentWord = maskPosition <= 0 ? Math.floor(itemWords.length / 100 * itemWay) : -1
				addOpacity(itemWords, currentWord)
			})

			function addOpacity(itemWords, currentWord) {
				itemWords.forEach((itemWord, index) => {
					itemWord.style.opacity = itemOpacity
					if (index <= currentWord) {
						itemWord.style.opacity = 1
					}
				})
			}
		})
	}
}

window.addEventListener('DOMContentLoaded', function () {
	textOpacityScroll()
});


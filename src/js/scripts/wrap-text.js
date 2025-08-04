function wrappText(params) {
	const { method, selector, className } = params
	const titles = document.querySelectorAll(selector)
	if (titles.length) {
		if (method === 'word') {
			titles.forEach(title => {
				title.innerHTML =
					title.innerText.replace(/\S+/g, `<span class="${className}-parrent"><span class="${className}-children">$&</span></span>`)
			})
		} else if (method === 'letter') {
			titles.forEach(title => {
				title.innerHTML =
					title.innerText.replace(/(\S|\s)/g, '<span>$1</span>')
			})
		}
	}
}
document.addEventListener('DOMContentLoaded', function () {
	wrappText({
		method: 'word',
		selector: '[data-title-anim]',
		className: 'word'
	})
})
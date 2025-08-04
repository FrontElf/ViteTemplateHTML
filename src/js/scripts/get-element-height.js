import * as TF from "./functions.js"

function watchElementHeights() {
	let existingHeightVars = {}
	let scheduled = false

	const getElemHeight = () => {
		const getHeightEls = document.querySelectorAll('[data-get-height]')
		if (getHeightEls.length === 0) {
			clearStyles('watcher_height')
			TF.logger('No elements with [data-get-height] found. No styles added.', 'info')
			existingHeightVars = {}
			return
		}

		const styles = []
		const newVars = {}

		getHeightEls.forEach(el => {
			const id = el.getAttribute('data-get-height')
			const height = el.offsetHeight
			const varName = `--${id}-height`
			newVars[varName] = height

			if (existingHeightVars[varName] !== height) {
				styles.push(`${varName}: ${height}px;`)
				TF.logger(`Set variable: ${varName}: ${height}px;`, 'success')
			}
		})

		if (styles.length > 0) {
			createStylesToHead(styles, 'watcher_height')
		}

		existingHeightVars = newVars
	}

	const createStylesToHead = (stylesArray, id) => {
		let styleElement = document.querySelector(`#${id}`)
		if (!styleElement) {
			styleElement = document.createElement('style')
			styleElement.id = id
			document.head.appendChild(styleElement)
		}

		let stylesString = ':root {\n'
		stylesString += stylesArray.join('\n    ')
		stylesString += '\n}'

		if (styleElement.textContent !== stylesString) {
			styleElement.textContent = stylesString
		}
	}

	const clearStyles = (id) => {
		const styleElement = document.querySelector(`#${id}`)
		if (styleElement) styleElement.remove()
	}

	const scheduleUpdate = () => {
		if (!scheduled) {
			scheduled = true
			requestAnimationFrame(() => {
				getElemHeight()
				scheduled = false
			})
		}
	}

	const observer = new MutationObserver(() => scheduleUpdate())

	document.addEventListener('DOMContentLoaded', () => {
		getElemHeight()
		observer.observe(document.body, { childList: true, subtree: true })
	})

	window.addEventListener('resize', scheduleUpdate)
}

watchElementHeights()

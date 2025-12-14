class FEHeightWatcher {
	constructor(options = {}) {
		this.selector = options.selector || '[data-get-height]'
		this.mode = options.mode === 'tag' ? 'tag' : 'inline'
		this.styleTagId = options.styleTagId || 'watcher-styles'

		this.resizeObserver = null
		this.mutationObserver = null

		this.elements = new Map()

		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', () => this.init())
		} else {
			this.init()
		}
	}

	init() {
		if (this.resizeObserver) return
		if (this.mode === 'tag') {
			this.createStyleTag()
		}

		this.resizeObserver = new ResizeObserver((entries) => {
			window.requestAnimationFrame(() => {
				let hasChanges = false
				for (let entry of entries) {
					if (this.updateHeight(entry.target)) {
						hasChanges = true
					}
				}
				if (this.mode === 'tag' && hasChanges) {
					this.flushStylesToTag()
				}
			})
		})

		this.scanAndObserve()

		this.mutationObserver = new MutationObserver((mutations) => {
			let shouldScan = false
			for (const mutation of mutations) {
				if (mutation.addedNodes.length) shouldScan = true
			}
			if (shouldScan) this.scanAndObserve()
		})

		this.mutationObserver.observe(document.body, { childList: true, subtree: true })

		console.log(`HeightWatcher started in "${this.mode}" mode`)
	}

	scanAndObserve() {
		const els = document.querySelectorAll(this.selector)
		let hasNewElements = false

		els.forEach(el => {
			if (!this.elements.has(el)) {
				const id = el.getAttribute('data-get-height')
				if (!id) return

				const varName = `--${id}-height`
				this.elements.set(el, { varName, value: 0 })
				this.resizeObserver.observe(el)
				if (this.updateHeight(el)) {
					hasNewElements = true
				}
			}
		})

		if (this.mode === 'tag' && hasNewElements) {
			this.flushStylesToTag()
		}
	}

	updateHeight(el) {
		const data = this.elements.get(el)
		if (!data) return false
		const height = el.offsetHeight
		if (data.value === height) return false

		data.value = height
		this.elements.set(el, data)

		if (this.mode === 'inline') {
			document.documentElement.style.setProperty(data.varName, `${height}px`)
		}

		return true
	}

	createStyleTag() {
		if (!document.getElementById(this.styleTagId)) {
			const style = document.createElement('style')
			style.id = this.styleTagId
			document.head.appendChild(style)
		}
	}

	flushStylesToTag() {
		const styleEl = document.getElementById(this.styleTagId)
		if (!styleEl) return

		const lines = []
		this.elements.forEach((data) => {
			lines.push(`${data.varName}: ${data.value}px;`)
		})

		const css = `:root {\n  ${lines.join('\n  ')}\n}`
		styleEl.textContent = css
	}

	destroy() {
		if (this.resizeObserver) {
			this.resizeObserver.disconnect()
			this.resizeObserver = null
		}
		if (this.mutationObserver) {
			this.mutationObserver.disconnect()
			this.mutationObserver = null
		}

		if (this.mode === 'inline') {
			this.elements.forEach((data) => {
				document.documentElement.style.removeProperty(data.varName)
			})
		} else {
			const styleEl = document.getElementById(this.styleTagId)
			if (styleEl) styleEl.remove()
		}

		this.elements.clear()
		console.log('HeightWatcher destroyed')
	}
}

const watcher = new FEHeightWatcher({
	mode: 'tag',
	styleTagId: 'my-custom-styles'
})
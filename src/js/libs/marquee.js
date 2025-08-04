class Marquee {
	constructor({ parent = '[data-marquee]' } = {}) {
		this.selector = parent
		this.instances = []
		this.resizeHandler = null
		this.CLASS_NAMES = {
			wrapper: "marquee-wrapper",
			inner: "marquee-inner",
			item: "marquee-item",
			clone: "marquee-clone"
		}

		this.init()
	}

	debounce(delay, fn) {
		let timerId
		return (...args) => {
			clearTimeout(timerId)
			timerId = setTimeout(() => {
				fn(...args)
				timerId = null
			}, delay)
		}
	}

	onResize(callback) {
		this.resizeHandler = this.debounce(15, callback)
		window.addEventListener("resize", this.resizeHandler)
		callback()
	}

	getSize($el, isVertical) {
		return isVertical ? $el.getBoundingClientRect().height : $el.getBoundingClientRect().width
	}

	buildStructure($marquee) {
		const $children = $marquee.children
		if (!$children.length) return

		$marquee.classList.add(this.CLASS_NAMES.wrapper)
		Array.from($children).forEach(el => el.classList.add(this.CLASS_NAMES.item))
		const html = `<div class="${this.CLASS_NAMES.inner}">${$marquee.innerHTML}</div>`
		$marquee.innerHTML = html
	}

	init() {
		const $marquees = document.querySelectorAll(this.selector)
		if (!$marquees.length) return

		$marquees.forEach(($wrapper) => {
			this.buildStructure($wrapper)

			const $inner = $wrapper.firstElementChild
			const originalChildren = Array.from($inner.children).map(el => el.cloneNode(true))

			const space = parseFloat($wrapper.getAttribute("data-marquee-space")) || 30
			const speed = parseFloat($wrapper.getAttribute("data-marquee-speed")) / 10 || 100
			const pauseOnHover = $wrapper.hasAttribute("data-marquee-pause-mouse-enter")
			const direction = $wrapper.getAttribute("data-marquee-direction")
			const vertical = direction === "bottom" || direction === "top"
			const animName = `marqueeAnimation-${Math.floor(Math.random() * 1e7)}`
			let start = parseFloat($wrapper.getAttribute("data-marquee-start")) || 0

			let sum = 0, visible = 0, base = 0
			let originalLength = $inner.children.length
			let index = 0, clones = 0

			const setBaseStyles = () => {
				let style = "display:flex;flex-wrap:nowrap;"
				if (vertical) {
					style += "flex-direction:column;position:relative;will-change:transform;"
					if (direction === "bottom") style += `top:-${visible}px;`
				} else {
					style += "position:relative;will-change:transform;"
					if (direction === "right") style += `left:-${visible}px;`
				}
				$inner.style.cssText = style
			}

			const getAnimDirection = (total) => (direction === "right" || direction === "bottom") ? total : -total

			const createAnimation = () => {
				const keyframes = `
					@keyframes ${animName} {
						0% { transform: translate${vertical ? "Y" : "X"}(${start}%); }
						100% { transform: translate${vertical ? "Y" : "X"}(${getAnimDirection(visible)}px); }
					}`
				const $style = document.createElement("style")
				$style.classList.add(animName)
				$style.innerHTML = keyframes
				document.head.append($style)

				$inner.style.animation = `${animName} ${(visible + (start * visible) / 100) / speed}s infinite linear`
			}

			const duplicateElements = () => {
				sum = visible = base = clones = index = 0
				const containerSize = this.getSize($wrapper, vertical)
				const children = originalChildren.map(el => el.cloneNode(true))

				$inner.innerHTML = ""
				children.forEach(el => {
					el.classList.remove(this.CLASS_NAMES.clone)
					$inner.append(el)
				})

				children.forEach(el => {
					if (vertical) el.style.marginBottom = `${space}px`
					else {
						el.style.marginRight = `${space}px`
						el.style.flexShrink = 0
					}

					const size = this.getSize(el, vertical)
					sum += size + space
					visible += size + space
					base += size + space
					clones++
				})

				const target = containerSize * 2 + base
				while (sum < target) {
					if (!children[index]) index = 0
					const clone = children[index].cloneNode(true)
					clone.classList.add(this.CLASS_NAMES.clone)
					$inner.append(clone)

					const size = this.getSize(clone, vertical) + space
					sum += size
					if (visible < containerSize || clones % originalLength !== 0) {
						visible += size
						clones++
					}
					index++
				}

				setBaseStyles()
			}

			const pauseHandler = (e) => {
				e.target.style.animationPlayState = e.type === "mouseenter" ? "paused" : "running"
			}

			const resetAnimation = () => {
				document.head.querySelector(`.${animName}`)?.remove()
				duplicateElements()
				createAnimation()
			}

			const handleStart = () => {
				start = 0
				$inner.removeEventListener("animationiteration", handleStart)
				resetAnimation()
			}

			const addEvents = () => {
				if (start) $inner.addEventListener("animationiteration", handleStart)
				if (pauseOnHover) {
					$inner.addEventListener("mouseenter", pauseHandler)
					$inner.addEventListener("mouseleave", pauseHandler)
				}
			}

			duplicateElements()
			createAnimation()
			addEvents()
			this.onResize(resetAnimation)

			this.instances.push({
				wrapper: $wrapper,
				inner: $inner,
				animName,
			})
		})
	}

	destroy() {
		this.instances.forEach(({ wrapper, inner, animName }) => {
			inner.style.animation = ""
			document.head.querySelector(`.${animName}`)?.remove()

			inner.querySelectorAll(`.${this.CLASS_NAMES.clone}`).forEach(el => el.remove())

			const originalChildren = Array.from(inner.children)
			inner.remove()
			wrapper.innerHTML = ""
			originalChildren.forEach(child => {
				child.classList.remove(this.CLASS_NAMES.item)
				wrapper.appendChild(child)
			})

			wrapper.classList.remove(this.CLASS_NAMES.wrapper)
		})

		if (this.resizeHandler) {
			window.removeEventListener("resize", this.resizeHandler)
			this.resizeHandler = null
		}

		this.instances = []
		window.dispatchEvent(new CustomEvent("marquee:destroy"))
	}
}

const marquee = new Marquee({
	parent: '[data-marquee]',
})

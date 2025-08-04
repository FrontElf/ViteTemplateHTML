import gsap from "gsap"
// Import modules
import ScrollTrigger from "gsap/ScrollTrigger.js"
import Swiper from 'swiper'
import { Navigation } from 'swiper/modules'
import { ScrollToPlugin } from "gsap/ScrollToPlugin"
import { ScrollSmoother } from "gsap/ScrollSmoother"

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, ScrollSmoother)

//========================================================================================================================================================

class ScrollAnimations {
   constructor(selectors) {
      this.mm = gsap.matchMedia()
      this.selectors = { ...selectors }
      this.supportsSVH = CSS.supports('height', '100svh')
      this.loops = []
      this.offsetHeader = true
      this.swipers = {}
      this.init()
   }

   init() {
      this.createSwiper('.slider-services', {
         spaceBetween: 40,
         slidesPerView: 1,
         freeMode: true,
         loop: false,
         speed: 1300,
         navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
         },
         breakpoints: {
            991.98: { slidesPerView: 3 },
            767.98: { slidesPerView: 2 },
         }
      })
      this.createSwiper('.slider-testimonials', {
         spaceBetween: 40,
         slidesPerView: 1,
         autoHeight: true,
         loop: false,
         speed: 1300,
         navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
         },
         breakpoints: {
            1280.98: { slidesPerView: 3.85 },
            991.98: { slidesPerView: 2.85 },
            767.98: { slidesPerView: 1.85 },
         }
      })

      this.scrollToBlock()
      this.scrolledPageClass()
      this.watchFooterReach()
      this.initRefresh()
      this.initToTopClick()
   }

   initRefresh() {
      this.scrolledPageClass()
      this.watchFooterReach()
      this.initParallaxSection()
      this.scrolledSlider('.services-slider', this.swipers['.slider-services'])
      this.scrolledSlider('.testimonials-slider', this.swipers['.slider-testimonials'])
      this.initTripleCardsSection()
      this.initTableSection()
      this.initVideoBgSection()
      this.initGuaranteeBgSection()
   }

   createSwiper(selector, options) {
      if (document.querySelector(selector)) {
         const swiper = new Swiper(selector, { modules: [Navigation], ...options })
         this.swipers[selector] = swiper
         return swiper
      }
      return null
   }

   scrolledPageClass() {
      ScrollTrigger.create({
         start: `${window.innerHeight}px top`,
         onEnter: () => document.documentElement.classList.add('scrolled'),
         onLeaveBack: () => document.documentElement.classList.remove('scrolled')
      })

      ScrollTrigger.create({
         start: `10px top`,
         onEnter: () => document.documentElement.classList.add('scrolled-header'),
         onLeaveBack: () => document.documentElement.classList.remove('scrolled-header')
      })
   }

   scrolledSlider(selector, swiperInstance) {
      const slider = document.querySelector(selector)
      const sliderBody = slider.querySelector('.swiper')
      const sliderSlides = slider.querySelectorAll('.swiper-slide')

      if (!slider || !sliderBody || !sliderSlides.length) {
         return
      }

      const maxSlides = 3
      const slideWidth = sliderSlides[0].getBoundingClientRect().width
      const gap = 40
      const scrollDistance = (slideWidth + gap) * (maxSlides - 1)

      let currentIndex = -1

      ScrollTrigger.create({
         trigger: selector,
         start: 'top 2vh',
         end: `+=${scrollDistance}`,
         scrub: true,
         pin: true,
         pinSpacing: true,
         anticipatePin: 1,
         invalidateOnRefresh: true,
         onUpdate: (self) => {
            const targetIndex = Math.round(self.progress * (maxSlides - 1))
            if (targetIndex !== currentIndex) {
               currentIndex = targetIndex
               swiperInstance.slideTo(targetIndex, 1000, false)
            }
         }
      })
   }

   watchFooterReach() {
      const footer = document.querySelector('.footer__bottom')
      if (!footer) return

      const checkFooter = () => {
         const footerTop = footer.getBoundingClientRect().top + window.scrollY
         const reached = window.scrollY + window.innerHeight >= footerTop
         document.documentElement.classList.toggle('footer-visible', reached)
      }

      window.addEventListener('scroll', checkFooter)
      window.addEventListener('resize', checkFooter)
      checkFooter()
   }

   initParallaxSection() {
      const parallaxSection = document.querySelector('[data-parallax-section]')
      if (!parallaxSection) return

      this.parallaxTimelines = []
      this.parallaxTriggers = []

      const sectionHeader = parallaxSection.querySelector('.steps-section__header')
      const dirtyChirtImage = parallaxSection.querySelector('.step-dirty-chirt')
      const phoneImage = parallaxSection.querySelector('.step-phone')
      const phoneImageRound = phoneImage.querySelector('.step-phone-round')
      const bagImage = parallaxSection.querySelector('.step-bag')
      const busImage = parallaxSection.querySelector('.step-bus')
      const dryerVideo = parallaxSection.querySelector('.step-dryer')
      const dryerVideoEl = dryerVideo.querySelector('video')
      const cleanChirtImage = parallaxSection.querySelector('.step-clean-chirt')
      const busImage_2 = parallaxSection.querySelector('.step-bus-2')

      const section_01 = parallaxSection.querySelector('.section-step-1')
      const section_02 = parallaxSection.querySelector('.section-step-2')
      const section_03 = parallaxSection.querySelector('.section-step-3')
      const section_04 = parallaxSection.querySelector('.section-step-4')

      const sectionHeader_02 = section_02.querySelector('.section-step__header')
      const sectionHeader_03 = section_03.querySelector('.section-step__header')
      const sectionHeader_04 = section_04.querySelector('.section-step__header')

      const getDefaultOptions = (tl) => {
         return {
            trigger: parallaxSection,
            animation: tl,
            start: "top top",
            end: "+=7000vh",
            pin: true,
            scrub: 2.2,
            anticipatePin: 1,
            invalidateOnRefresh: true
         }
      }

      this.mm.add("(min-width: 1199.98px)", () => {
         const tl = gsap.timeline()

         tl.to(phoneImage, { x: '0%', opacity: 1 })
         tl.to(phoneImageRound, { scale: 1, duration: 1, ease: "elastic.out(1, 0.4)" }, "+=0.1")
         tl.to(section_01, { opacity: 1, y: this.getVH(-100), duration: 1 }, "+=0.1")
         tl.to(section_02, { opacity: 1, y: this.getVH(0), duration: 1, ease: "back.out(1.1)" }, "<")
         tl.to(dirtyChirtImage, { x: "42vw", y: this.getVH(85), duration: 1 }, "<")
         tl.to(bagImage, { x: '+=100%', opacity: 1, duration: 1, ease: "back.out(1.1)" }, "+=0.1")
         tl.to(dirtyChirtImage, { x: "5vw", y: '+=15vh', scale: 0.2, opacity: 0, duration: 1 }, "<")
         tl.to(busImage, { x: '0%', opacity: 1, duration: 1 }, "+=0.1")
         tl.to(sectionHeader_02, { '--before-opacity': 1, duration: 1 }, "<")
         tl.to(bagImage, { x: "+=142.5%", y: this.getVH(-40.5), rotate: -12, filter: "brightness(0.8) contrast(1.2)", scale: 0.4, duration: 1 }, "+=0.1")
         tl.to(section_02, { y: this.getVH(-100), duration: 1 })
         tl.to(section_03, { opacity: 1, y: this.getVH(0), duration: 1 }, "<")
         tl.to(dryerVideo, { opacity: 1, y: 0, duration: 1 }, "<")
         tl.to(dryerVideoEl, { scale: 1, height: this.getVH(100), borderRadius: 0, duration: 1 })
         tl.to(sectionHeader_03, { '--before-opacity': 1, duration: 1 }, "<")
         tl.to(section_03, { y: this.getVH(-100), duration: 1 })
         tl.to(section_04, { opacity: 1, y: this.getVH(0), duration: 1 }, "<")
         tl.to(cleanChirtImage, { opacity: 1, y: this.getVH(10), duration: 1 })
         tl.to(busImage_2, { x: '0%', opacity: 1, duration: 1 }, "+=0.1")
         tl.to(sectionHeader_04, { '--before-opacity': 1, duration: 1 }, "<")
         tl.to(cleanChirtImage, { x: "-28.5vw", y: this.getVH(-20), scale: 0.5, filter: "brightness(0.9)", duration: 1 }, "<")
         tl.to({}, { duration: 1 })

         ScrollTrigger.create({
            ...getDefaultOptions(tl),
         })
      })

      this.mm.add("(min-width: 991.98px) and (max-width: 1199.98px)", () => {
         const tl = gsap.timeline()

         tl.to(phoneImage, { x: '0%', opacity: 1 })
         tl.to(phoneImageRound, { scale: 1, duration: 1, ease: "elastic.out(1, 0.4)" }, "+=0.1")
         tl.to(section_01, { opacity: 1, y: this.getVH(-100), duration: 1 }, "+=0.1")
         tl.to(section_02, { opacity: 1, y: this.getVH(0), duration: 1, ease: "back.out(1.1)" }, "<")
         tl.to(dirtyChirtImage, { x: "42vw", y: this.getVH(85), duration: 1 }, "<")
         tl.to(bagImage, { x: '+=100%', opacity: 1, duration: 1, ease: "back.out(1.1)" }, "+=0.1")
         tl.to(dirtyChirtImage, { x: "1vw", y: '+=15vh', scale: 0.2, opacity: 0, duration: 1 }, "<")
         tl.to(busImage, { x: '0%', opacity: 1, duration: 1 }, "+=0.1")
         tl.to(sectionHeader_02, { '--before-opacity': 1, duration: 1 }, "<")
         tl.to(bagImage, { x: "+=162.5%", y: this.getVH(-40.5), rotate: -12, filter: "brightness(0.8) contrast(1.2)", scale: 0.4, duration: 1 }, "+=0.1")
         tl.to(section_02, { y: this.getVH(-100), duration: 1 })
         tl.to(section_03, { opacity: 1, y: this.getVH(0), duration: 1 }, "<")
         tl.to(dryerVideo, { opacity: 1, y: 0, duration: 1 }, "<")
         tl.to(dryerVideoEl, { scale: 1, height: this.getVH(100), borderRadius: 0, duration: 1 })
         tl.to(sectionHeader_03, { '--before-opacity': 1, duration: 1 }, "<")
         tl.to(section_03, { y: this.getVH(-100), duration: 1 })
         tl.to(section_04, { opacity: 1, y: this.getVH(0), duration: 1 }, "<")
         tl.to(cleanChirtImage, { opacity: 1, y: this.getVH(15), duration: 1 })
         tl.to(busImage_2, { x: '0%', opacity: 1, duration: 1 }, "+=0.1")
         tl.to(sectionHeader_04, { '--before-opacity': 1, duration: 1 }, "<")
         tl.to(cleanChirtImage, { x: "-27.5vw", y: this.getVH(-12), scale: 0.5, filter: "brightness(0.9)", duration: 1 }, "<")
         tl.to({}, { duration: 1 })

         ScrollTrigger.create({
            ...getDefaultOptions(tl),
         })
      })

      this.mm.add("(min-width: 767.98px) and (max-width: 991.98px)", () => {
         const tl = gsap.timeline()

         tl.to(phoneImage, { x: '0%', opacity: 1 })
         tl.to(phoneImageRound, { scale: 1, duration: 1, ease: "elastic.out(1, 0.4)" }, "+=0.1")
         tl.to(section_01, { opacity: 1, y: this.getVH(-100), duration: 1 }, "+=0.1")
         tl.to(section_02, { opacity: 1, y: this.getVH(0), duration: 1, ease: "back.out(1.1)" }, "<")
         tl.to(dirtyChirtImage, { x: "42vw", y: this.getVH(90), duration: 1 }, "<")
         tl.to(bagImage, { x: '+=100%', opacity: 1, duration: 1, ease: "back.out(1.1)" }, "+=0.1")
         tl.to(dirtyChirtImage, { x: "1vw", y: '+=15vh', scale: 0.2, opacity: 0, duration: 1 }, "<")
         tl.to(busImage, { x: '0%', opacity: 1, duration: 1 }, "+=0.1")
         tl.to(sectionHeader_02, { '--before-opacity': 1, duration: 1 }, "<")
         tl.to(bagImage, { x: "+=160.5%", y: this.getVH(-40), rotate: -12, filter: "brightness(0.8) contrast(1.2)", scale: 0.4, duration: 1 }, "+=0.1")
         tl.to(section_02, { y: this.getVH(-100), duration: 1 })
         tl.to(section_03, { opacity: 1, y: this.getVH(0), duration: 1 }, "<")
         tl.to(dryerVideo, { opacity: 1, y: 0, duration: 1 }, "<")
         tl.to(dryerVideoEl, { scale: 1, height: this.getVH(100), borderRadius: 0, duration: 1 })
         tl.to(sectionHeader_03, { '--before-opacity': 1, duration: 1 }, "<")
         tl.to(section_03, { y: this.getVH(-100), duration: 1 })
         tl.to(section_04, { opacity: 1, y: this.getVH(0), duration: 1 }, "<")
         tl.to(cleanChirtImage, { opacity: 1, y: this.getVH(22), duration: 1 })
         tl.to(busImage_2, { x: '0%', opacity: 1, duration: 1 }, "+=0.1")
         tl.to(sectionHeader_04, { '--before-opacity': 1, duration: 1 }, "<")
         tl.to(cleanChirtImage, { x: "-25vw", y: this.getVH(2), scale: 0.5, filter: "brightness(0.9)", duration: 1 }, "<")
         tl.to({}, { duration: 1 })

         ScrollTrigger.create({
            ...getDefaultOptions(tl),
         })
      })

      this.mm.add("(min-width: 450.98px) and (max-width: 767.98px)", () => {
         const tl = gsap.timeline()

         tl.to(phoneImage, { x: '0%', opacity: 1 })
         tl.to(phoneImageRound, { scale: 1, duration: 1, ease: "elastic.out(1, 0.4)" }, "+=0.1")
         tl.to(section_01, { opacity: 1, y: this.getVH(-100), duration: 1 }, "+=0.1")
         tl.to(phoneImage, { opacity: 0, y: "+=150%", scale: 0.5, duration: 0.4 }, "<")
         tl.to(section_02, { opacity: 1, y: this.getVH(0), duration: 1, ease: "back.out(1.1)" }, "<")
         tl.to(dirtyChirtImage, { y: this.getVH(90), duration: 1 }, "<")
         tl.to(bagImage, { x: '30vw', opacity: 1, duration: 1, ease: "back.out(1.1)" }, "+=0.1")
         tl.to(dirtyChirtImage, { x: "1vw", y: '+=25vh', scale: 0.2, opacity: 0, duration: 1 }, "<")
         tl.to(busImage, { x: '0%', opacity: 1, duration: 1 }, "+=0.1")
         tl.to(sectionHeader_02, { '--before-opacity': 1, duration: 1 }, "<")
         tl.to(bagImage, { x: "38vw", y: this.getVH(-42), rotate: -12, filter: "brightness(0.8) contrast(1.2)", scale: 0.3, duration: 1 }, "+=0.1")
         tl.to(section_02, { y: this.getVH(-100), duration: 1 })
         tl.to(section_03, { opacity: 1, y: this.getVH(0), duration: 1 }, "<")
         tl.to(dryerVideo, { opacity: 1, y: 0, duration: 1 }, "<")
         tl.to(dryerVideoEl, { scale: 1, height: this.getVH(100), borderRadius: 0, duration: 1 })
         tl.to(sectionHeader_03, { '--before-opacity': 1, duration: 1 }, "<")
         tl.to(section_03, { y: this.getVH(-100), duration: 1 })
         tl.to(section_04, { opacity: 1, y: this.getVH(0), duration: 1 }, "<")
         tl.to(cleanChirtImage, { opacity: 1, y: this.getVH(38), duration: 1 })
         tl.to(busImage_2, { x: '0%', opacity: 1, duration: 1 }, "+=0.1")
         tl.to(sectionHeader_04, { '--before-opacity': 1, duration: 1 }, "<")
         tl.to(cleanChirtImage, { x: "+=10vw", y: this.getVH(20), scale: 0.5, filter: "brightness(0.9)", duration: 1 }, "<")
         tl.to({}, { duration: 1 })

         ScrollTrigger.create({
            ...getDefaultOptions(tl),
         })
      })

      this.mm.add("(min-width: 309.98px) and (max-width: 450.98px)", () => {
         const tl = gsap.timeline()

         tl.to(phoneImage, { x: '0%', opacity: 1 })
         tl.to(phoneImageRound, { scale: 1, duration: 1, ease: "elastic.out(1, 0.4)" }, "+=0.1")
         tl.to(section_01, { opacity: 1, y: this.getVH(-100), duration: 1 }, "+=0.1")
         tl.to(phoneImage, { opacity: 0, y: "+=150%", scale: 0.5, duration: 0.4 }, "<")
         tl.to(section_02, { opacity: 1, y: this.getVH(0), duration: 1, ease: "back.out(1.1)" }, "<")
         tl.to(dirtyChirtImage, { y: this.getVH(90), duration: 1 }, "<")
         tl.to(bagImage, { x: '26vw', opacity: 1, duration: 1, ease: "back.out(1.1)" }, "+=0.1")
         tl.to(dirtyChirtImage, { x: "1vw", y: '+=32vh', scale: 0.2, opacity: 0, duration: 1 }, "<")
         tl.to(busImage, { x: '0%', opacity: 1, duration: 1 }, "+=0.1")
         tl.to(sectionHeader_02, { '--before-opacity': 1, duration: 1 }, "<")
         tl.to(bagImage, { x: "33vw", y: this.getVH(-40), rotate: -12, filter: "brightness(0.8) contrast(1.2)", scale: 0.3, duration: 1 }, "+=0.1")
         tl.to(section_02, { y: this.getVH(-100), duration: 1 })
         tl.to(section_03, { opacity: 1, y: this.getVH(0), duration: 1 }, "<")
         tl.to(dryerVideo, { opacity: 1, y: 0, duration: 1 }, "<")
         tl.to(dryerVideoEl, { scale: 1, height: this.getVH(100), borderRadius: 0, duration: 1 })
         tl.to(sectionHeader_03, { '--before-opacity': 1, duration: 1 }, "<")
         tl.to(section_03, { y: this.getVH(-100), duration: 1 })
         tl.to(section_04, { opacity: 1, y: this.getVH(0), duration: 1 }, "<")
         tl.to(cleanChirtImage, { opacity: 1, y: this.getVH(38), duration: 1 })
         tl.to(busImage_2, { x: '0%', opacity: 1, duration: 1 }, "+=0.1")
         tl.to(sectionHeader_04, { '--before-opacity': 1, duration: 1 }, "<")
         tl.to(cleanChirtImage, { x: "+=8vw", y: this.getVH(20), scale: 0.4, filter: "brightness(0.9)", duration: 1 }, "<")
         tl.to({}, { duration: 1 })

         ScrollTrigger.create({
            ...getDefaultOptions(tl),
         })
      })

   }

   initTripleCardsSection() {
      const tripleCardsSection = document.querySelector('[data-triple-cards]')
      if (!tripleCardsSection) return

      const allCards = tripleCardsSection.querySelectorAll('.triple-card')
      const card_01 = allCards?.[0]
      const card_03 = allCards?.[2]

      const trogerOptionsDesctop = {
         scrollTrigger: {
            trigger: tripleCardsSection,
            start: "30% 90%",
            end: "70% 90%",
            toggleActions: "play reverse play reverse",
            scrub: 1.1,
         },
      }

      const getTriggerOptionsMobile = (card) => {
         return {
            scrollTrigger: {
               trigger: card,
               start: "top 80%",
               end: "bottom 80%",
               scrub: 1.1,
            },
         }
      }

      this.mm.add("(min-width: 767.98px)", () => {
         gsap.to([card_01, card_03], { ...trogerOptionsDesctop, rotate: 0, x: 0, y: 0 })
      })

      this.mm.add("(max-width: 767.98px)", () => {
         allCards.forEach((card) => {
            gsap.to(card, { ...getTriggerOptionsMobile(card), y: 0, opacity: 1, scale: 1 })
         })
      })
   }

   initTableSection() {
      const tableSection = document.querySelector('[data-table-section]')
      if (!tableSection) return
      const table = tableSection.querySelector('.price-table')

      gsap.to(table, {
         scrollTrigger: {
            trigger: tableSection,
            start: "40% 80%",
            end: "90% 90%",
            toggleActions: "play reverse play reverse",
            scrub: 1.1,
         },
         opacity: 1, x: 0,
      })
   }

   initVideoBgSection() {
      const videoBgSection = document.querySelector('[data-video-bg-section]')
      if (!videoBgSection) return
      const video = videoBgSection.querySelector('[data-video-bg]')

      gsap.to(video, {
         scrollTrigger: {
            trigger: videoBgSection,
            start: "40% 80%",
            end: "80% 90%",
            toggleActions: "play reverse play reverse",
            scrub: 1.1,
         },
         scale: 1, opacity: 0.9, borderRadius: 0,
      })
   }

   initGuaranteeBgSection() {
      const guaranteeBgSection = document.querySelector('[data-guarantee-bg-section]')
      if (!guaranteeBgSection) return

      gsap.to(guaranteeBgSection, {
         scrollTrigger: {
            trigger: guaranteeBgSection,
            start: "40% 80%",
            end: "70% 90%",
            toggleActions: "play reverse play reverse",
            scrub: 1.1,
         },
         "--bg-opacity": 1,
      })
   }

   initToTopClick() {
      const scrollToTopBtns = document.querySelectorAll('[data-scroll-top]')
      if (!scrollToTopBtns.length) return

      scrollToTopBtns.forEach(btn => {
         btn.addEventListener('click', () => {
            this.scrollToTop()
         })
      })
   }

   getVH(value) {
      return this.supportsSVH ? `${value}svh` : `${value}vh`
      // return `${value}vh`
   }

   scrollToTarget(el) {
      if (!el) return

      const pinnedTrigger = ScrollTrigger.getAll().find(t => t.pin && t.trigger?.contains(el))
      const isPinned = pinnedTrigger && typeof pinnedTrigger.start === 'number'

      const scrollTarget = isPinned ? pinnedTrigger.start : el

      // Атрибут на елементі, не залежно від типу scrollTarget
      const shouldOffset = el.hasAttribute('data-scroll-offset-header')
      const offset = shouldOffset ? (document.querySelector('header')?.offsetHeight || 0) : 0

      const smoother = ScrollSmoother.get()
      if (smoother) {
         if (typeof scrollTarget === 'number') {
            smoother.scrollTo(scrollTarget - offset, true)
         } else {
            smoother.scrollTo(scrollTarget, true, `top-=${offset}`)
         }
      } else {
         if (typeof scrollTarget === 'number') {
            window.scrollTo({ top: scrollTarget - offset, behavior: 'smooth' })
         } else {
            const top = el.getBoundingClientRect().top + window.pageYOffset - offset
            window.scrollTo({ top, behavior: 'smooth' })
         }
      }
   }

   scrollToBlock() {
      document.addEventListener("click", (e) => {
         const link = e.target.closest('a[href^="#"], a[href^="/"], a[href^="http"]')
         if (!link) return

         const href = link.getAttribute('href')
         const isExternal = link.hostname && link.hostname !== location.hostname

         // Якір
         if (href.startsWith('#')) {
            e.preventDefault()
            this.scrollToTarget(document.querySelector(href))
         }

         // Внутрішня з хешем
         else if (href.includes('#') && href.startsWith('/')) {
            const [page, hash] = href.split('#')
            e.preventDefault()
            if (window.location.pathname === page) {
               this.scrollToTarget(document.querySelector(`#${hash}`))
            } else {
               window.location.href = `${page}#${hash}`
            }
         }

         // Повний URL з хешем
         else if (href.includes('#') && href.startsWith('http') && !isExternal) {
            e.preventDefault()
            window.location.href = href
         }

         // Інші випадки — дозволяємо переходити
         else if (isExternal) {
            return // нічого не блокуємо
         }
      })
   }

   refreshAnimations() {
      this.mm.revert()
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())

      this.initRefresh()
   }

   destroy() {
      this.mm.kill()
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
   }
}

// =========================

let templateScrollAnimations

function debounce(fn, delay = 250) {
   let timeout
   return (...args) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => fn(...args), delay)
   }
}

document.addEventListener("DOMContentLoaded", debounce(() => {
   templateScrollAnimations = new ScrollAnimations()
}, 500))

window.addEventListener("orientationchange", debounce(() => {
   templateScrollAnimations?.refreshAnimations()
}, 500))

// window.addEventListener("resize", debounce(() => {
//    templateScrollAnimations?.refreshAnimations()
// }, 800))





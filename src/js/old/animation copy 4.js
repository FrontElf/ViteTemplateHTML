import gsap from "gsap"
// Import modules
import ScrollTrigger from "gsap/ScrollTrigger.js"
import { Observer } from "gsap/Observer"
import { ScrollToPlugin } from "gsap/ScrollToPlugin"
import ScrollSmoother from "gsap/ScrollSmoother.js"
import Swiper from 'swiper'
import { Navigation } from 'swiper/modules'

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, ScrollToPlugin, Observer)

//========================================================================================================================================================

class ScrollAnimations {
   constructor(selectors) {
      this.selectors = { ...selectors }
      this.mm = gsap.matchMedia()
      this.supportsSVH = CSS.supports('height', '100svh')
      this.isSmoother = ScrollSmoother.get() || null
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
         speed: 500,
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
         speed: 500,
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
      window.addEventListener("load", () => this.initStartScroll())
      this.scrolledPageClass()
      this.watchFooterReach()
      this.initParallaxSection()
      this.scrolledSlider('.services-slider', this.swipers['.slider-services'])
      this.scrolledSlider('.testimonials-slider', this.swipers['.slider-testimonials'])
      this.initTripleCardsSection()
      this.initTableSection()
      this.initVideoBgSection()
      this.initGuaranteeBgSection()
      this.initToTopClick()
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
         start: 'top top',
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
               swiperInstance.slideTo(targetIndex, 500, false)
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

      // Витягуємо всі DOM-елементи ОДИН раз
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
            end: "+=5000",
            pin: true,
            scrub: 1.2,
            anticipatePin: 1,
            invalidateOnRefresh: true
         }
      }

      this.mm.add("(min-width: 1280.98px)", () => {
         const tl = gsap.timeline()
         const scrollTopArray_01 = [section_01, phoneImage, sectionHeader]
         const scrollTopArray_02 = [section_02, busImage]
         const scrollTopArray_03 = [section_03, dryerVideo]
         tl.to(phoneImage, { x: '0', opacity: 1 })
            .to(phoneImageRound, { scale: 1, duration: 1, ease: "elastic.out(1, 0.4)" }, "+=0.1")
            .to(scrollTopArray_01, { opacity: 0, y: this.getVH(-100), duration: 1 }, "+=0.1")
            .to(section_02, { opacity: 1, y: 0, duration: 1, ease: "back.out(1.1)" }, "<")
            .to(dirtyChirtImage, { x: "42vw", y: this.getVH(-10), duration: 1, ease: "back.out(1.1)" }, "<")
            .to(bagImage, { x: 0, opacity: 1, duration: 1, ease: "back.out(1.1)" }, "+=0.1")
            .to(dirtyChirtImage, { x: "5cqw", y: this.getVH(1), scale: 0.2, opacity: 0, duration: 1 }, "<")
            .to(busImage, { x: 0, opacity: 1, duration: 1 }, "+=0.1")
            .to(sectionHeader_02, { '--before-opacity': 1, duration: 1 }, "<")
            .to(bagImage, { x: "19.5vw", y: this.getVH(-40.5), rotate: -12, filter: "brightness(0.8) contrast(1.2)", scale: 0.4, duration: 1 }, "+=0.1")
            .to(scrollTopArray_02, { y: this.getVH(-100), duration: 1 })
            .to(bagImage, { y: this.getVH(-140.5), duration: 1 }, "<")
            .to(section_03, { opacity: 1, y: 0, duration: 1 }, "<")
            .to(dryerVideo, { opacity: 1, y: 0, duration: 1 }, "<")
            .to(dryerVideoEl, { scale: 1, height: this.getVH(100), borderRadius: 0, duration: 1 })
            .to(sectionHeader_03, { '--before-opacity': 1, duration: 1 }, "<")
            .to(scrollTopArray_03, { y: this.getVH(-100), duration: 1 })
            .to(section_04, { opacity: 1, y: 0, duration: 1 }, "<")
            .to(cleanChirtImage, { opacity: 1, y: 0, duration: 1 })
            .to(busImage_2, { x: 0, opacity: 1, duration: 1 }, "+=0.1")
            .to(sectionHeader_04, { '--before-opacity': 1, duration: 1 }, "<")
            .to(cleanChirtImage, { x: "-28.5vw", y: this.getVH(-22), scale: 0.55, filter: "brightness(0.9)", duration: 1 }, "<")
            .to({}, { duration: 1 })

         ScrollTrigger.create({
            ...getDefaultOptions(tl),
         })
      })

      this.mm.add("(min-width: 767.98px) and (max-width: 1280.98px)", () => {
         const tl = gsap.timeline()
         const scrollTopArray_01 = [section_01, phoneImage, sectionHeader]
         const scrollTopArray_02 = [section_02, busImage]
         const scrollTopArray_03 = [section_03, dryerVideo]
         tl.to(phoneImage, { x: '0', opacity: 1 })
            .to(phoneImageRound, { scale: 1, duration: 1, ease: "elastic.out(1, 0.4)" }, "+=0.1")
            .to(scrollTopArray_01, { opacity: 0, y: this.getVH(-100), duration: 1 }, "+=0.1")
            .to(section_02, { opacity: 1, y: 0, duration: 1, ease: "back.out(1.1)" }, "<")
            .to(dirtyChirtImage, { x: "54vw", y: this.getVH(-8), duration: 1, ease: "back.out(1.1)" }, "<")
            .to(bagImage, { x: 0, opacity: 1, duration: 1, ease: "back.out(1.1)" }, "+=0.1")
            .to(dirtyChirtImage, { x: "5cqw", y: this.getVH(1), scale: 0.2, opacity: 0, duration: 1 }, "<")
            .to(busImage, { x: 0, opacity: 1, duration: 1 }, "+=0.1")
            .to(sectionHeader_02, { '--before-opacity': 1, duration: 1 }, "<")
            .to(bagImage, { x: "29.4vw", y: this.getVH(-40.5), rotate: -12, filter: "brightness(0.8) contrast(1.2)", scale: 0.4, duration: 1 }, "+=0.1")
            .to(scrollTopArray_02, { y: this.getVH(-100), duration: 1 })
            .to(bagImage, { y: this.getVH(-140.5), duration: 1 }, "<")
            .to(section_03, { opacity: 1, y: 0, duration: 1 }, "<")
            .to(dryerVideo, { opacity: 1, y: 0, duration: 1 }, "<")
            .to(dryerVideoEl, { scale: 1, height: this.getVH(100), borderRadius: 0, duration: 1 })
            .to(sectionHeader_03, { '--before-opacity': 1, duration: 1 }, "<")
            .to(scrollTopArray_03, { y: this.getVH(-100), duration: 1 })
            .to(section_04, { opacity: 1, y: 0, duration: 1 }, "<")
            .to(cleanChirtImage, { opacity: 1, y: 0, duration: 1 })
            .to(busImage_2, { x: 0, opacity: 1, duration: 1 }, "+=0.1")
            .to(sectionHeader_04, { '--before-opacity': 1, duration: 1 }, "<")
            .to(cleanChirtImage, { x: "-37.5vw", y: this.getVH(-22), scale: 0.55, filter: "brightness(0.9)", duration: 1 }, "<")
            .to({}, { duration: 1 })

         ScrollTrigger.create({
            ...getDefaultOptions(tl),
            end: "+=5000",
         })
      })
      // (min - width: 549.98px) and 
      this.mm.add("(max-width: 767.98px) and (min-width: 619.98px)", () => {
         const tl = gsap.timeline()
         const scrollTopArray_01 = [section_01, sectionHeader]
         const scrollTopArray_02 = [section_02, busImage]
         const scrollTopArray_03 = [section_03, dryerVideo]
         tl.to(phoneImage, { x: '0', opacity: 1 })
            .to(phoneImageRound, { scale: 1, duration: 1, ease: "elastic.out(1, 0.4)" }, "+=0.1")
            .to(scrollTopArray_01, { opacity: 0, y: this.getVH(-100), duration: 1 }, "+=0.1")
            .to(sectionHeader, { height: 0, duration: 1 }, "<")
            .to(section_02, { opacity: 1, y: 0, duration: 1, ease: "back.out(1.1)" }, "<")
            .to(dirtyChirtImage, { y: this.getVH(-4), duration: 1 }, "<")
            .to(phoneImage, { y: this.getVH(40), opacity: 0, duration: 1 }, "<")
            .to(bagImage, { x: 0, opacity: 1, duration: 1, ease: "back.out(1.1)" }, "+=0.1")
            .to(dirtyChirtImage, { x: "5cqw", y: this.getVH(40), scale: 0.2, opacity: 0, duration: 1 }, "<")
            .to(busImage, { x: 0, opacity: 1, duration: 1 }, "+=0.1")
            .to(sectionHeader_02, { '--before-opacity': 1, duration: 1 }, "<")
            .to(bagImage, { x: "8vw", y: this.getVH(-35), rotate: -12, scale: 0.4, filter: "brightness(0.8) contrast(1.2)", duration: 1 }, "+=0.1")
            .to(scrollTopArray_02, { y: this.getVH(-100), duration: 1 })
            .to(bagImage, { y: this.getVH(-135), duration: 1 }, "<")
            .to(section_03, { opacity: 1, y: 0, duration: 1 }, "<")
            .to(dryerVideo, { opacity: 1, y: 0, duration: 1 }, "<")
            .to(dryerVideoEl, { scale: 1, height: this.getVH(100), margin: 0, borderRadius: 0, duration: 1 })
            .to(sectionHeader_03, { '--before-opacity': 1, duration: 1 }, "<")
            .to(scrollTopArray_03, { y: this.getVH(-100), duration: 1 })
            .to(section_04, { opacity: 1, y: 0, duration: 1 }, "<")
            .to(cleanChirtImage, { opacity: 1, y: 0, duration: 1 })
            .to(busImage_2, { x: 0, opacity: 1, duration: 1 }, "+=0.1")
            .to(sectionHeader_04, { '--before-opacity': 1, duration: 1 }, "<")
            .to(cleanChirtImage, { x: "22vw", y: this.getVH(-20), scale: 0.3, filter: "brightness(0.9)", duration: 1 }, "<")
            .to({}, { duration: 1 })

         ScrollTrigger.create({
            ...getDefaultOptions(tl),
            end: "+=5000",
         })
      })

      this.mm.add("(max-width: 619.98px) and (min-width: 479.98px)", () => {
         const tl = gsap.timeline()
         const scrollTopArray_01 = [section_01, sectionHeader]
         const scrollTopArray_02 = [section_02, busImage]
         const scrollTopArray_03 = [section_03, dryerVideo]
         tl.to(phoneImage, { x: '0', opacity: 1 })
            .to(phoneImageRound, { scale: 1, duration: 1, ease: "elastic.out(1, 0.4)" }, "+=0.1")
            .to(scrollTopArray_01, { opacity: 0, y: this.getVH(-100), duration: 1 }, "+=0.1")
            .to(sectionHeader, { height: 0, duration: 1 }, "<")
            .to(section_02, { opacity: 1, y: 0, duration: 1 }, "<")
            .to(dirtyChirtImage, { y: this.getVH(-4), duration: 1 }, "<")
            .to(phoneImage, { y: this.getVH(40), opacity: 0, duration: 1 }, "<")
            .to(bagImage, { x: 0, opacity: 1, duration: 1, ease: "back.out(1.1)" }, "+=0.1")
            .to(dirtyChirtImage, { x: "5cqw", y: this.getVH(40), scale: 0.2, opacity: 0, duration: 1 }, "<")
            .to(busImage, { x: 0, opacity: 1, duration: 1 }, "+=0.1")
            .to(sectionHeader_02, { '--before-opacity': 1, duration: 1 }, "<")
            .to(bagImage, { x: "8vw", y: this.getVH(-35), rotate: -12, scale: 0.4, filter: "brightness(0.8) contrast(1.2)", duration: 1 }, "+=0.1")
            .to(scrollTopArray_02, { y: this.getVH(-100), duration: 1 })
            .to(bagImage, { y: this.getVH(-135), duration: 1 }, "<")
            .to(section_03, { opacity: 1, y: 0, duration: 1 }, "<")
            .to(dryerVideo, { opacity: 1, y: 0, duration: 1 }, "<")
            .to(dryerVideoEl, { scale: 1, height: this.getVH(100), margin: 0, borderRadius: 0, duration: 1 })
            .to(sectionHeader_03, { '--before-opacity': 1, duration: 1 }, "<")
            .to(scrollTopArray_03, { y: this.getVH(-100), duration: 1 })
            .to(section_04, { opacity: 1, y: 0, duration: 1 }, "<")
            .to(cleanChirtImage, { opacity: 1, y: 0, duration: 1 })
            .to(busImage_2, { x: 0, opacity: 1, duration: 1 }, "+=0.1")
            .to(sectionHeader_04, { '--before-opacity': 1, duration: 1 }, "<")
            .to(cleanChirtImage, { x: "26vw", y: this.getVH(-24), scale: 0.28, filter: "brightness(0.9)", duration: 1 }, "<")
            .to({}, { duration: 1 })

         ScrollTrigger.create({
            ...getDefaultOptions(tl),
            end: "+=5000",
         })
      })

      this.mm.add("(max-width: 479.98px)", () => {
         const tl = gsap.timeline()
         const scrollTopArray_01 = [section_01, sectionHeader]
         const scrollTopArray_02 = [section_02, busImage]
         const scrollTopArray_03 = [section_03, dryerVideo]
         tl.to(phoneImage, { x: '0', opacity: 1 }, "+=0.2")
            .to(phoneImageRound, { scale: 1, duration: 1, ease: "elastic.out(1, 0.4)" }, "+=0.1")
            .to(scrollTopArray_01, { opacity: 0, y: this.getVH(-100), duration: 1 }, "+=0.1")
            .to(sectionHeader, { height: 0, duration: 1 }, "<")
            .to(section_02, { opacity: 1, y: 0, duration: 1 }, "<")
            .to(dirtyChirtImage, { y: this.getVH(-4), duration: 1 }, "<")
            .to(phoneImage, { y: this.getVH(40), opacity: 0, duration: 1 }, "<")
            .to(bagImage, { x: 0, opacity: 1, duration: 1, ease: "back.out(1.1)" }, "+=0.1")
            .to(dirtyChirtImage, { x: "5cqw", y: this.getVH(40), scale: 0.2, opacity: 0, duration: 1 }, "<")
            .to(busImage, { x: 0, opacity: 1, duration: 1 }, "+=0.1")
            .to(sectionHeader_02, { '--before-opacity': 1, duration: 1 }, "<")
            .to(bagImage, { x: "8vw", y: this.getVH(-35), rotate: -12, scale: 0.4, filter: "brightness(0.8) contrast(1.2)", duration: 1 }, "+=0.1")
            .to(scrollTopArray_02, { y: this.getVH(-100), duration: 1 })
            .to(bagImage, { y: this.getVH(-135), duration: 1 }, "<")
            .to(section_03, { opacity: 1, y: 0, duration: 1 }, "<")
            .to(dryerVideo, { opacity: 1, y: 0, duration: 1 }, "<")
            .to(dryerVideoEl, { scale: 1, height: this.getVH(100), margin: 0, borderRadius: 0, duration: 1 })
            .to(sectionHeader_03, { '--before-opacity': 1, duration: 1 }, "<")
            .to(scrollTopArray_03, { y: this.getVH(-100), duration: 1 })
            .to(section_04, { opacity: 1, y: 0, duration: 1 }, "<")
            .to(cleanChirtImage, { opacity: 1, y: 0, duration: 1 })
            .to(busImage_2, { x: 0, opacity: 1, duration: 1 }, "+=0.1")
            .to(sectionHeader_04, { '--before-opacity': 1, duration: 1 }, "<")
            .to(cleanChirtImage, { x: "32vw", y: this.getVH(-27), scale: 0.28, filter: "brightness(0.9)", duration: 1 }, "<")
            .to({}, { duration: 1 })

         ScrollTrigger.create({
            ...getDefaultOptions(tl),
            end: "+=5000",
         })
      })
   }

   createTimeLine(timelineData) {
      const tl = gsap.timeline()
      Object.values(timelineData).forEach(step => {
         const [target, params, position] = step
         if (position !== undefined) {
            tl.to(target, params, position)
         } else {
            tl.to(target, params)
         }
      })
      return tl
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
      // return this.supportsSVH ? `${value}svh` : `${value}vh`
      return `${value}vh`
   }

   scrollToTarget(el) {
      if (!el) return

      let scrollTarget = el
      const pinnedTrigger = ScrollTrigger.getAll().find(t => t.pin && t.trigger?.contains(el))

      if (pinnedTrigger && typeof pinnedTrigger.start === 'number') {
         scrollTarget = pinnedTrigger.start
      }

      // Визначаємо, чи враховувати шапку
      const shouldOffset = typeof scrollTarget !== 'number' && el.hasAttribute('data-scroll-offset-header')
      const offset = shouldOffset
         ? document.querySelector('header')?.offsetHeight || 0
         : 0

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

   initStartScroll() {
      const hash = window.loadingHash || window.location.hash
      if (!hash) return

      const el = document.querySelector(hash)
      if (!el) return

      setTimeout(() => this.scrollToTarget(el), 200)
   }

   scrollToTop() {
      if (this.isSmoother) {
         this.isSmoother.scrollTo(0, true, "top top")
      } else {
         window.scrollTo({ top: 0, behavior: "smooth" })
      }
   }

   refresh() {
      ScrollTrigger.refresh()
      clearTimeout(this.resizeTimeout)
      this.resizeTimeout = setTimeout(() => {
         ScrollTrigger.refresh()
      }, 300)
   }

   destroy() {
      this.mm.kill()
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
   }
}

// =========================

document.addEventListener("DOMContentLoaded", () => {
   const templateScrollAnimations = new ScrollAnimations()
})
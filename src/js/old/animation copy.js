import gsap from "gsap"
// Import modules
import ScrollTrigger from "gsap/ScrollTrigger.js"
import { Observer } from "gsap/Observer"
import { ScrollToPlugin } from "gsap/ScrollToPlugin"
import ScrollSmoother from "./libs/ScrollSmoother.js"

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, ScrollToPlugin, Observer)

class ScrollAnimations {
   constructor(selectors) {
      this.selectors = {
         marqueeTextSelector: '.marquee-text',
         showElSelector: '[data-show]',
         anchorSelector: '.ancor',
         parallaxSelector: '[data-parallax]',
         ...selectors
      }
      this.mm = gsap.matchMedia()
      this.supportsSVH = CSS.supports('height', '100svh')
      this.loops = []
      this.init()
   }

   init() {
      this.scrolledPageClass()
      this.watchFooterReach()
      this.initParallaxSection()
      this.initTripleCardsSection()
      this.initTableSection()
      this.initVideoBgSection()
      this.initGuaranteeBgSection()
   }

   scrolledPageClass() {
      ScrollTrigger.create({
         start: `${window.innerHeight}px top`,
         onEnter: () => document.documentElement.classList.add('scrolled'),
         onLeaveBack: () => document.documentElement.classList.remove('scrolled')
      })
   }

   watchFooterReach() {
      const footer = document.querySelector('footer')
      if (!footer) return

      const checkFooter = () => {
         const reached = window.scrollY + window.innerHeight >= footer.offsetTop
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
            scrub: 1.2,
         },
      }

      const getTriggerOptionsMobile = (card) => {
         return {
            scrollTrigger: {
               trigger: card,
               start: "top 80%",
               end: "bottom 80%",
               scrub: 1.3,
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
            scrub: 1.2,
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
            scrub: 1.3,
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
            scrub: 1.2,
         },
         "--bg-opacity": 1,
      })
   }

   //========================================================================================================================================================

   getVH(value) {
      return this.supportsSVH ? `${value}svh` : `${value}vh`
   }

   refresh() {
      clearTimeout(this.resizeTimeout)
      this.resizeTimeout = setTimeout(() => {
         ScrollTrigger.refresh()
      }, 300)
   }
}

document.addEventListener("DOMContentLoaded", () => {
   const templateScrollAnimations = new ScrollAnimations()
})

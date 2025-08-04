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

   //! ========================================================================================================================================================

   initParallaxSection() {
      const parallaxSection = document.querySelector('[data-parallax-section]')
      if (!parallaxSection) return

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

      const scrollTopArray_01 = [section_01, phoneImage, sectionHeader]
      const scrollTopArray_02 = [section_02, busImage]
      const scrollTopArray_03 = [section_03, dryerVideo]

      const defaultTimeLine = {
         phoneImage_1: [phoneImage, { x: '0', opacity: 1 }],
         phoneImageRound_1: [phoneImageRound, { scale: 1, duration: 1, ease: "elastic.out(1, 0.4)" }, "+=0.1"],
         scrollTopArray_01_1: [scrollTopArray_01, { opacity: 0, y: '-100vh', duration: 1 }, "+=0.1"],
         section_02_1: [section_02, { opacity: 1, y: 0, duration: 1, ease: "back.out(1.1)" }, "<"],
         dirtyChirtImage_1: [dirtyChirtImage, { x: "42vw", y: '-10vh', duration: 1, ease: "back.out(1.1)" }, "<"],
         bagImage_1: [bagImage, { x: 0, opacity: 1, duration: 1, ease: "back.out(1.1)" }, "+=0.1"],
         dirtyChirtImage_2: [dirtyChirtImage, { x: "5cqw", y: '1vh', scale: 0.2, opacity: 0, duration: 1 }, "<"],
         busImage_1: [busImage, { x: 0, opacity: 1, duration: 1 }, "+=0.1"],
         sectionHeader_02_1: [sectionHeader_02, { '--before-opacity': 1, duration: 1 }, "<"],
         bagImage_2: [bagImage, { x: "19.5vw", y: '-40.5vh', rotate: -12, filter: "brightness(0.8) contrast(1.2)", scale: 0.4, duration: 1 }, "+=0.1"],
         scrollTopArray_02_1: [scrollTopArray_02, { y: '-100vh', duration: 1 }],
         bagImage_3: [bagImage, { y: '-140.5vh', duration: 1 }, "<"],
         section_03_1: [section_03, { opacity: 1, y: 0, duration: 1 }, "<"],
         dryerVideo_1: [dryerVideo, { opacity: 1, y: 0, duration: 1 }, "<"],
         dryerVideoEl_1: [dryerVideoEl, { scale: 1, height: '100vh', borderRadius: 0, duration: 1 }],
         sectionHeader_03_1: [sectionHeader_03, { '--before-opacity': 1, duration: 1 }, "<"],
         scrollTopArray_03_1: [scrollTopArray_03, { y: '-100vh', duration: 1 }],
         section_04_1: [section_04, { opacity: 1, y: 0, duration: 1 }, "<"],
         cleanChirtImage_1: [cleanChirtImage, { opacity: 1, y: 0, duration: 1 }],
         busImage_2_1: [busImage_2, { x: 0, opacity: 1, duration: 1 }, "+=0.1"],
         sectionHeader_04_1: [sectionHeader_04, { '--before-opacity': 1, duration: 1 }, "<"],
         cleanChirtImage_2: [cleanChirtImage, { x: "-28.5vw", y: '-22vh', scale: 0.55, filter: "brightness(0.9)", duration: 1 }, "<"],
         empty_1: [null, { duration: 1 }]
      }

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

      // ===========================================

      this.mm.add("(min-width: 767.98px) and (max-width: 1280.98px)", () => {
         const myTl = this.createTimeLine(defaultTimeLine)
         ScrollTrigger.create({
            ...getDefaultOptions(myTl),
         })
      })

      // ===========================================
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

   //! ========================================================================================================================================================

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

/*
Slider Documentation: https://swiperjs.com/
*/
import Swiper from 'swiper'

// Base styles ====================================================================================

// Modules: =======================================================================================
// Navigation, Pagination, Autoplay, EffectFade, Lazy, Manipulation

import { Navigation } from 'swiper/modules'

//=================================================================================================

function initSliders() {
  if (document.querySelector('.test__slider')) {
    productSlider = new Swiper('.test__slider', {
      modules: [Navigation],
      spaceBetween: 0,
      slidesPerView: 1,
      freeMode: true,
      loop: false,
      speed: 500,
      effect: 'fade',
    })
  }
}

document.addEventListener('DOMContentLoaded', function () {
  initSliders()
})

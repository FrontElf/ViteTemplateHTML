import FEMediaQuery from '../libs/FEMediaQuery.js'

// Callbacks
const onMobile = () => {
   console.log('📱 Mobile mode activated')
}
const onTablet = () => {
   console.log('📱 Tablet mode activated')
}
const onDesktop = () => {
   console.log('💻 Desktop mode activated')
}

// Init
document.addEventListener('DOMContentLoaded', () => {
   const mqManager = new FEMediaQuery([
      { media: '(min-width: 998px)', callback: onDesktop },
      { media: '(max-width: 998px) and (min-width: 768px)', callback: onTablet },
      { media: '(max-width: 767px)', callback: onMobile },
   ])
})
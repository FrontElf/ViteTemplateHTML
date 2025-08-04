function showHideHeader(params) {
  const header = document.querySelector('header')

  if (!header) return
  let lastScrollTop = 0

  window.addEventListener('scroll', function (event) {
    scrollEvent()
  })

  function scrollEvent() {
    let scrollTop = window.scrollY || document.documentElement.scrollTop

    if (scrollTop > params.scrollTrigger) {
      document.documentElement.classList.add(params.startScrolledClass)

      if (scrollTop > lastScrollTop) {
        document.documentElement.classList.add(params.scrolledDownClass)
      } else {
        document.documentElement.classList.remove(params.scrolledDownClass)
      }

    } else {
      document.documentElement.classList.remove(params.startScrolledClass)
    }
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop
  }
  scrollEvent()
}

document.addEventListener('DOMContentLoaded', () => {
  showHideHeader({
    startScrolledClass: 'scrolled-page',
    scrolledDownClass: 'scrolled-down',
    scrollTrigger: 10,
  })
})

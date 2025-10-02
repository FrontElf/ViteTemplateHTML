import '../libs/cookie.js'

function handlerCookie() {
  const cookieName = 'kontapel_age_verification'
  const cookieValue = '21+'
  const setBtnSelector = 'data-age-verification'
  const showModalClass = 'no-age-verification'
  const isCookie = Cookies.get(cookieName) || false

  if (!isCookie) {
    document.documentElement.classList.add(showModalClass)

    document.addEventListener('click', (e) => {
      if (e.target.closest(`[${setBtnSelector}]`)) {
        const cookieButton = e.target.closest(`[${setBtnSelector}]`)
        const cookieTime = cookieButton.getAttribute(setBtnSelector)
        const cookieExpires = parseInt(cookieTime)
        setCookie(cookieName, cookieValue, cookieExpires)
        document.documentElement.classList.remove(showModalClass)
      }
    })
  } else {
    return
  }

  function setCookie(name, value, cookieExpires) {
    Cookies.set(name, value, { expires: cookieExpires || 1 })
  }
}

window.addEventListener('load', handlerCookie)

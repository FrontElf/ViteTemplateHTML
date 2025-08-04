function addResponsiveSourceSwitcher(selector) {
   document.querySelectorAll(selector).forEach((videoElement) => {
      const sources = Array.from(videoElement.querySelectorAll('source'))
      let currentSrc = null

      function updateVideoSource() {
         const matchedSource = sources.find(source => {
            const media = source.getAttribute('media')
            return !media || window.matchMedia(media).matches
         })

         if (!matchedSource) return

         const newSrc = matchedSource.getAttribute('src')
         if (newSrc !== currentSrc) {
            videoElement.innerHTML = ''
            const newSource = document.createElement('source')
            newSource.setAttribute('src', newSrc)
            videoElement.appendChild(newSource)
            videoElement.load()
            currentSrc = newSrc
         }
      }

      updateVideoSource()
      window.addEventListener('resize', updateVideoSource)
   })
}

addResponsiveSourceSwitcher('[data-resize-video]')


/**
 * Selects all video elements with the given selector and adds a source switching
 * logic. The logic is as follows:
 * 1. It finds all the source elements inside the video element
 * 2. It checks which source element has a media query that matches the current
 *    window size
 * 3. If it found a matching source, it sets the src attribute of the video
 *    element to the src attribute of the matching source
 * 4. It adds an event listener to window's resize event to update the video
 *    source whenever the window size changes
 *
 * @param {string} selector - The selector to select the video elements
 */
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


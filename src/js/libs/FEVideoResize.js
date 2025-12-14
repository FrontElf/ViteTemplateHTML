/* 
<video data-resize-video poster="assets/poster.jpg" muted loop autoplay playsinline>
   <source src="assets/video-mobile.mp4" media="(max-width: 767.98px)">
   <source src="assets/video-tablet.mp4" media="(max-width: 1024px)">
   <source src="assets/video-desktop.mp4">
</video> 
*/

class ResponsiveVideo {
   constructor(selector) {
      this.videos = Array.from(document.querySelectorAll(selector))
      this.instances = []
      this.init()
   }

   init() {
      this.videos.forEach(video => {
         const sources = Array.from(video.querySelectorAll('source')).map(source => ({
            src: source.getAttribute('src'),
            media: source.getAttribute('media') || 'all'
         }))

         if (!sources.length) return
         const mediaListeners = []

         const updateSource = () => {
            const matched = sources.find(s => window.matchMedia(s.media).matches)
            if (matched && !video.src.includes(matched.src)) {
               video.src = matched.src
               video.load()
               console.log(`Switched to: ${matched.src}`)
            }
         }

         sources.forEach(source => {
            if (source.media === 'all') return
            const mql = window.matchMedia(source.media)
            const listener = () => updateSource()
            mql.addEventListener('change', listener)
            mediaListeners.push({ mql, listener })
         })
         updateSource()

         this.instances.push({
            video,
            mediaListeners
         })
      })
   }

   destroy() {
      this.instances.forEach(instance => {
         instance.mediaListeners.forEach(({ mql, listener }) => {
            mql.removeEventListener('change', listener)
         })
      })
      this.instances = []
      this.videos = []
      console.log('ResponsiveVideo: Listeners removed, memory cleared.')
   }
}

document.addEventListener('DOMContentLoaded', () => {
   const responsiveVideos = new ResponsiveVideo('[data-resize-video]')
})

export default class FEMediaQuery {
   constructor(queries = []) {
      this.queries = queries
      this.activeListeners = []
      this.initialized = false

      if (this.queries.length > 0) {
         this.init()
      }
   }

   init() {
      if (this.initialized) return

      this.queries.forEach((query) => {
         this._setupListener(query)
      })

      this.initialized = true
   }

   _setupListener({ media, callback }) {
      const mql = window.matchMedia(media)
      const listener = (e) => {
         if (e.matches && typeof callback === 'function') {
            callback()
         }
      }
      listener(mql)
      mql.addEventListener('change', listener)
      this.activeListeners.push({ mql, listener })
   }

   add(queryObject) {
      if (Array.isArray(queryObject)) {
         queryObject.forEach(q => this._setupListener(q))
      } else {
         this._setupListener(queryObject)
      }
   }

   destroy() {
      this.activeListeners.forEach(({ mql, listener }) => {
         mql.removeEventListener('change', listener)
      })

      this.activeListeners = []
      this.initialized = false
   }
}



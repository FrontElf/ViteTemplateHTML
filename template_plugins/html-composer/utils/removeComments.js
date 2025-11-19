import { logger } from './logger.js'

export function removeHtmlComments(html, baseOptions = {}) {
   const {
      isLogger = false,
      loggerPrefix = '[HTML-Comments]'
   } = baseOptions.commentsCleaner || {}

   try {
      isLogger && logger(loggerPrefix, 'Removing HTML comments', 'info')
      return html.replace(/<!--[\s\S]*?-->/g, '')
   } catch (e) {
      isLogger && logger(loggerPrefix, `Failed to remove HTML comments: ${e.message}`, 'error')
      return html
   }
}

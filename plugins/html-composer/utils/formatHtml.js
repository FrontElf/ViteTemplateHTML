import prettier from 'prettier'
import { logger } from './logger.js'

export function formatHtml(html, baseOptions = {}) {
   const {
      isLogger = false,
      loggerPrefix = '[HTML-Formatter]'
   } = baseOptions.formatter

   try {
      isLogger && logger(loggerPrefix, 'Formatting HTML output', 'info')
      return prettier.format(html, { parser: 'html' })
   } catch (e) {
      isLogger && logger(loggerPrefix, `Failed to format HTML: ${e.message}`, 'error')
      return html
   }
}

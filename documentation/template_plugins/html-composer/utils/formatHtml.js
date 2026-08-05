import prettier from 'prettier'
import { logger } from './logger.js'

export async function formatHtml(html, baseOptions = {}) {
   const {
      isLogger = false,
      loggerPrefix = '[HTML-Formatter]'
   } = baseOptions.formatter || {}

   try {
      isLogger && logger(loggerPrefix, 'Formatting HTML output', 'info')

      return await prettier.format(html, {
         parser: 'html',
         printWidth: 220,
         singleAttributePerLine: false,
         bracketSameLine: false,
         htmlWhitespaceSensitivity: 'css',
      })
   } catch (e) {
      isLogger && logger(loggerPrefix, `Failed to format HTML: ${e.message}`, 'error')
      if (process.env.NODE_ENV === 'production') {
         throw e
      }
      return html
   }
}

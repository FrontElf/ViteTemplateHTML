import logger from '../logger.js'

/**
 * Vite plugin to convert self-closing tags to full tags
 * @param {Object} options - Plugin configuration
 * @param {string[]} options.specialTags - Additional tags to process (e.g., ['Content'])
 * @returns {Object} Vite plugin object
 */
export default function viteFixSelfClosingTags(options = {}) {
   const pluginName = '[self-closing-plugin]'
   const defaultOptions = {
      specialTags: ['Content'],
   }
   const config = { ...defaultOptions, ...options }

   return {
      name: 'vite-fix-self-closing-tags',
      enforce: 'pre',
      transformIndexHtml: {
         order: 'pre',
         handler(html, ctx) {
            let transformedHtml = html

            // Process component tags (starting with uppercase letter)
            try {
               transformedHtml = transformedHtml.replace(
                  /<([A-Z][A-Za-z0-9]*)(\s+[^>]*?)?\/>/g,
                  (full, tag, attrs) => {
                     logger(`${pluginName} Processed self-closing tag "<${tag}>"`, 'info')
                     return `<${tag}${attrs || ''}></${tag}>`
                  }
               )
            } catch (e) {
               logger(`${pluginName} Failed to process component tags "${e.message}"`, 'error')
            }

            // Process special tags (e.g., Content)
            try {
               config.specialTags.forEach((tag) => {
                  const regex = new RegExp(`<${tag}\\s*/>`, 'g')
                  transformedHtml = transformedHtml.replace(regex, () => {
                     logger(`${pluginName} Processed self-closing tag "<${tag}>"`, 'info')
                     return `<${tag}></${tag}>`
                  })
               })
            } catch (e) {
               logger(`${pluginName} Failed to process special tags "${e.message}"`, 'error')
            }

            return transformedHtml
         },
      },
   }
}
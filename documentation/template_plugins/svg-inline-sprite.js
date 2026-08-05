import * as fs from 'fs'
import * as path from 'path'
import { logger } from './html-composer/utils/logger.js'

const pluginName = '[html-svg-sprite]'
const defaultOptions = {
   spriteFileName: 'assets/inline-sprite.svg',
   iconClass: 'icon-svg',
}

const SVG_INLINE_REGEX = /<svg[^>]*>[\s\S]*?<\/svg>/gi

export default function htmlSvgSpritePlugin(userOptions = {}) {
   const options = { ...defaultOptions, ...userOptions }
   let config
   const svgMap = new Map()
   let svgIdCounter = 0

   return {
      name: 'vite-plugin-html-svg-sprite',
      enforce: 'pre',
      apply: 'build',

      configResolved(resolvedConfig) {
         config = resolvedConfig
      },

      transform(code, id) {
         if (!id.endsWith('.html')) return

         let html = code
         const matches = [...html.matchAll(SVG_INLINE_REGEX)]

         if (matches.length === 0) return code
         if (svgMap.size === 0) svgIdCounter = 0

         const spriteRef = options.spriteFileName

         for (const match of matches) {
            const rawSvg = match[0]
            const svgId = `html-icon-id-${svgIdCounter++}`
            svgMap.set(svgId, rawSvg)
            const replacement = `<svg class="${options.iconClass}"><use xlink:href="${spriteRef}#${svgId}"></use></svg>`
            html = html.replace(rawSvg, replacement)
         }

         return html
      },

      closeBundle() {
         if (svgMap.size === 0) return
         let symbols = ''

         for (const [svgId, fullSvg] of svgMap.entries()) {
            const viewBoxMatch = fullSvg.match(/viewBox="([^"]*)"/i)
            const viewBox = viewBoxMatch ? `viewBox="${viewBoxMatch[1]}"` : ''
            const innerMatch = fullSvg.match(/<svg[^>]*>([\s\S]*)<\/svg>/i)
            const inner = innerMatch ? innerMatch[1] : ''
            symbols += `<symbol id="${svgId}" ${viewBox}>${inner}</symbol>`
         }

         const spriteContent = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none;">${symbols}</svg>`
         const outputDir = path.isAbsolute(config.build.outDir)
            ? config.build.outDir
            : path.join(config.root, config.build.outDir)

         const finalPath = path.join(outputDir, options.spriteFileName)
         const dir = path.dirname(finalPath)
         if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
         }

         fs.writeFileSync(finalPath, spriteContent)

         logger(pluginName, ` SVG sprite created: dist/${options.spriteFileName} (${svgMap.size} icons)`, 'info')
      },
   }
}
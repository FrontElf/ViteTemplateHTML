import path from 'path'
import glob from 'fast-glob'
import { parser } from 'posthtml-parser'
import { render } from 'posthtml-render'
import { replaceAliases } from './utils/aliases.js'
import { fixSelfClosingComponents, includeComponents } from './utils/components.js'
import { processConditions } from './utils/conditions.js'
import { processExpressions } from './utils/expressions.js'
import { processEach } from './utils/each.js'
import { moveStylesToHead } from './utils/moveStylesToHead.js'
import { removeHtmlComments } from './utils/removeComments.js'
import { formatHtml } from './utils/formatHtml.js'

export default function htmlComposer(options = {}) {
   const {
      plugins = [],
      includeBaseDir = 'src/html',
      aliases = {},
      context = {},
      conditions = {},
      expressions = {},
      components = {},
      HTMLVariables = {},
      each = {},
      stylesToHead = {},
      formatter = {},
      commentsCleaner = {}
   } = options

   const baseOptions = {
      encoding: 'utf-8',
      HTMLVariables: { isLogger: false, ...HTMLVariables },
      components: { isLogger: false, maxDepth: 10, isNotFound: true, ...components },
      conditions: { isLogger: false, if: 'if', else: 'else', elseif: 'elseif', ...conditions },
      expressions: { isLogger: false, ...expressions },
      each: { isLogger: false, ...each },
      stylesToHead: { isLogger: false, ...stylesToHead },
      formatter: { isLogger: false, ...formatter },
      commentsCleaner: { isLogger: false, ...commentsCleaner }
   }

   // ---- Динамічне збирання карти компонентів ----
   let componentMap = {}
   let componentTags = []

   function rebuildComponentMap() {
      const componentFiles = glob.sync('**/*.html', { cwd: includeBaseDir, absolute: true })
      componentMap = Object.fromEntries(
         componentFiles.map(file => [path.basename(file, '.html'), file])
      )
      componentTags = Object.keys(componentMap)
      if (baseOptions.components.isLogger) {
         console.log(`[HTML-Components] Map rebuilt: ${componentTags.length} components`)
      }
   }

   // зібрати на старті
   rebuildComponentMap()

   return {
      name: 'vite-html-tree',

      // 👉 Підписуємось на файлові події Vite
      configureServer(server) {
         server.watcher.on('add', file => {
            if (file.startsWith(path.resolve(includeBaseDir)) && file.endsWith('.html')) {
               rebuildComponentMap()
            }
         })
         server.watcher.on('unlink', file => {
            if (file.startsWith(path.resolve(includeBaseDir)) && file.endsWith('.html')) {
               rebuildComponentMap()
            }
         })
      },

      transformIndexHtml: {
         order: 'pre',
         async handler(html) {
            const fullContext = { ...baseOptions.HTMLVariables, ...context }
            let tree = parser(fixSelfClosingComponents(html, componentTags))
            tree = processConditions(tree, fullContext, baseOptions)
            tree = await processEach(tree, fullContext, baseOptions, componentMap)
            tree = await includeComponents(tree, componentMap, fullContext, baseOptions)
            tree = processExpressions(tree, fullContext, baseOptions)
            tree = replaceAliases(tree, aliases)

            for (const plugin of plugins) {
               tree = plugin(tree)
            }

            tree = moveStylesToHead(tree, baseOptions)

            let htmlResult = render(tree)
            htmlResult = removeHtmlComments(htmlResult, baseOptions)

            if (process.env.NODE_ENV === 'production') {
               htmlResult = formatHtml(htmlResult, baseOptions)
            }

            return htmlResult
         }
      }
   }
}

import path from 'path'
import glob from 'fast-glob'
import { parser } from 'posthtml-parser'
import { render } from 'posthtml-render'
import { replaceAliases } from './utils/aliases.js'
import { fixSelfClosingComponents, includeComponents } from './utils/components.js'
import { processConditions } from './utils/conditions.js'
import { processSwitches } from './utils/switches.js'
import { processExpressions } from './utils/expressions.js'
import { processEach } from './utils/each.js'
import { processVueDirectives } from './utils/vueDirectives.js'
import { moveStylesToHead } from './utils/moveStylesToHead.js'
import { removeHtmlComments } from './utils/removeComments.js'
import { formatHtml } from './utils/formatHtml.js'
import { createContextError } from './utils/errorContext.js'

export default function htmlComposer(options = {}) {
   const {
      plugins = [],
      includeBaseDir = 'src/html',
      aliases = {},
      context = {},
      conditions = {},
      switches = {},
      expressions = {},
      components = {},
      HTMLVariables = {},
      each = {},
      vueDirectives = {},
      stylesToHead = {},
      formatter = {},
      commentsCleaner = {},
      componentsTrace = false,
   } = options

   const baseOptions = {
      encoding: 'utf-8',
      HTMLVariables: { isLogger: false, ...HTMLVariables },
      components: { isLogger: false, maxDepth: 10, isNotFound: true, ...components },
      conditions: { isLogger: false, if: 'if', else: 'else', elseif: 'elseif', ...conditions },
      switches: { isLogger: false, switch: 'switch', case: 'case', default: 'default', ...switches },
      expressions: { isLogger: false, ...expressions },
      each: { isLogger: false, ...each },
      vueDirectives: { isLogger: false, if: 'v-if', for: 'v-for', range: 'v-range', as: 'v-as', ...vueDirectives },
      stylesToHead: { isLogger: false, ...stylesToHead },
      formatter: { isLogger: false, ...formatter },
      commentsCleaner: { isLogger: false, ...commentsCleaner },
      componentsTrace,
   }

   let componentMap = {}
   let componentTags = []
   let rebuildTimer = null
   const resolvedIncludeBaseDir = path.resolve(includeBaseDir)

   function isInsideIncludeBase(file) {
      const relativeFile = path.relative(resolvedIncludeBaseDir, file)
      return relativeFile && !relativeFile.startsWith('..') && !path.isAbsolute(relativeFile)
   }

   function getComponentNamespace(file) {
      const relativeFile = path.relative(path.resolve(includeBaseDir), file)
      const parsed = path.parse(relativeFile)
      const pathParts = parsed.dir ? parsed.dir.split(path.sep).filter(Boolean) : []
      if (pathParts[0] === 'components') {
         pathParts.shift()
      }
      const nameParts = [...pathParts, parsed.name]

      if (nameParts.length > 1 && nameParts[nameParts.length - 1] === nameParts[nameParts.length - 2]) {
         nameParts.pop()
      }

      return nameParts.join('.')
   }

   function rebuildComponentMap() {
      const componentFiles = glob.sync('**/*.html', { cwd: includeBaseDir, absolute: true })
      const nextComponentMap = {}
      const basenameMap = {}

      for (const file of componentFiles) {
         const componentName = path.basename(file, '.html')
         const componentNamespace = getComponentNamespace(file)

         if (basenameMap[componentName]) {
            const message = `Duplicate component name "${componentName}": ${basenameMap[componentName]} and ${file}. Use namespaced tags to disambiguate.`
            if (process.env.NODE_ENV === 'production') {
               throw new Error(message)
            }
            console.warn(`[HTML-Components] ${message}`)
         }
         basenameMap[componentName] = file

         if (nextComponentMap[componentNamespace] && nextComponentMap[componentNamespace] !== file) {
            throw new Error(`Duplicate namespaced component "${componentNamespace}": ${nextComponentMap[componentNamespace]} and ${file}`)
         }

         nextComponentMap[componentName] = file
         nextComponentMap[componentNamespace] = file
      }

      componentMap = nextComponentMap
      componentTags = [...new Set(Object.keys(componentMap))]
      if (baseOptions.components.isLogger) {
         console.log(`[HTML-Components] Map rebuilt: ${componentTags.length} components`)
      }
   }

   function scheduleComponentMapRebuild() {
      if (rebuildTimer) {
         clearTimeout(rebuildTimer)
      }

      rebuildTimer = setTimeout(() => {
         rebuildTimer = null
         rebuildComponentMap()
      }, 100)
   }

   rebuildComponentMap()

   return {
      name: 'vite-html-tree',

      configureServer(server) {
         const onComponentFileChanged = file => {
            if (isInsideIncludeBase(file) && file.endsWith('.html')) {
               scheduleComponentMapRebuild()
            }
         }

         server.watcher.on('add', onComponentFileChanged)
         server.watcher.on('unlink', onComponentFileChanged)
      },

      transformIndexHtml: {
         order: 'pre',
         async handler(html, ctx) {
            try {
               const fullContext = { ...baseOptions.HTMLVariables, ...context }
               const pageFile = ctx?.filename || 'unknown'
               baseOptions.contextTrace = [{ stage: 'page', component: 'page', file: pageFile }]
               let tree = parser(fixSelfClosingComponents(html, componentTags))
               tree = processVueDirectives(tree, fullContext, baseOptions)
               tree = processConditions(tree, fullContext, baseOptions)
               tree = processSwitches(tree, fullContext, baseOptions)
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
                  htmlResult = await formatHtml(htmlResult, baseOptions)
               }

               return htmlResult
            } catch (error) {
               const fileName = ctx?.filename || 'unknown'
               const contextualError = error.context
                  ? error
                  : createContextError(`Error processing ${fileName}`, {
                     stage: 'htmlComposer',
                     file: fileName,
                     trace: baseOptions.contextTrace,
                  }, error)
               console.error(`[html-composer] ${contextualError.message}`)
               if (process.env.NODE_ENV === 'production') {
                  throw contextualError
               }
               return html
            }
         }
      },
   }
}

import fs from 'fs/promises'
import fg from 'fast-glob'
import { parser as posthtmlParser } from 'posthtml-parser'
import expressionsPlugin from './expressions.js'

function toArray(val) {
   return Array.isArray(val) ? val : [val]
}

export default function posthtmlComponentInclude(options = {}) {
   const defaultOptions = {
      componentPaths: ['src/html/'],
      cache: new Map(),
      isLogger: false,
      logger: console,
      regex: {
         componentSelfClosing: /<([A-Z][A-Za-z0-9]*)(\s[^>]*)?\/>/g,
         contentSelfClosing: /<Content\s*\/>/g,
      },
      maxDepth: 20,
      globalVariables: {},
      expressions: {
         scriptsDefine: true,
         tagNames: {
            if: 'if',
            elseif: 'elseif',
            else: 'else',
         }
      },
      loop: {
         dataDir: 'src/data',
         tagName: 'each'
      }
   }

   const config = {
      ...defaultOptions,
      ...options,
      regex: { ...defaultOptions.regex, ...options.regex }
   }

   function hasComponentNodes(nodes) {
      for (const node of nodes) {
         if (typeof node === 'string') continue
         if (/^[A-Z]/.test(node.tag)) return true
         if (Array.isArray(node.content) && hasComponentNodes(node.content)) return true
      }
      return false
   }

   return async function componentIncludePlugin(tree) {
      let depth = 0

      tree = await expressionsPlugin(config.globalVariables, config)(tree)
      tree = toArray(tree)

      while (hasComponentNodes(tree)) {
         if (depth++ > config.maxDepth) {
            config.logger.error(`[posthtml-component-include] 🔁 Вкладення компонентів перевищили ${config.maxDepth}. Можливе зациклення.`)
            break
         }
         await processTree(tree)
      }
      return tree
   }

   async function processTree(nodes) {
      for (let i = 0; i < nodes.length; i++) {
         const node = nodes[i]

         if (typeof node === 'string') continue

         if (/^[A-Z]/.test(node.tag)) {
            const componentName = node.tag
            const filePath = await findComponentFile(componentName)

            if (!filePath) {
               if (config.isLogger) config.logger.warn(`[posthtml-component-include] ❌ Компонент <${componentName}> не знайдено`)
               nodes.splice(i, 1)
               i--
               continue
            }

            let fileContent = await fs.readFile(filePath, 'utf-8')
            fileContent = replaceSelfClosingTags(fileContent)

            let subTree = posthtmlParser(fileContent, {
               recognizeSelfClosing: true,
               recognizeCDATA: true,
               lowerCaseTags: false,
            })

            subTree = toArray(subTree)

            const combinedProps = { ...config.globalVariables, ...node.attrs }

            subTree = await expressionsPlugin(combinedProps, config)(subTree)
            subTree = toArray(subTree)
            subTree = injectSlotContent(subTree, node.content || [])

            nodes.splice(i, 1, ...subTree)
            i += subTree.length - 1
            continue
         }

         if (node.content) {
            await processTree(node.content)
         }
      }
   }

   async function findComponentFile(name) {
      if (config.cache.has(name)) {
         const cached = config.cache.get(name)
         if (typeof cached === 'string' && cached.endsWith('.html')) {
            return cached
         }
      }
      const files = await fg(config.componentPaths.map(p => `${p}**/${name}.html`), { onlyFiles: true })
      const file = files[0]
      if (file) {
         config.cache.set(name, file)
      }
      return file
   }

   function injectSlotContent(tree, slotContent) {
      tree = toArray(tree)
      return tree.flatMap(node => {
         if (typeof node === 'string') return node
         if (node.tag === 'Content') {
            return slotContent
         }
         if (Array.isArray(node.content)) {
            node.content = injectSlotContent(node.content, slotContent)
         }
         return node
      })
   }

   function replaceSelfClosingTags(html) {
      return html
         .replace(config.regex.contentSelfClosing, '<Content></Content>')
         .replace(
            config.regex.componentSelfClosing,
            (full, tag, attrs) => `<${tag}${attrs || ''}></${tag}>`
         )
   }
}

import fs from 'fs/promises'
import fg from 'fast-glob'
import { parser as posthtmlParser } from 'posthtml-parser'
import expressionsPlugin from './expressions.js'
import logger from '../logger.js'

export default function posthtmlComponentInclude(options = {}) {
   const pluginName = '[include-plugin]'

   const defaultOptions = {
      componentPaths: ['src/html/'],
      cache: new Map(),
      regex: {
         componentSelfClosing: /<([A-Z][A-Za-z0-9]*)(\s[^>]*)?\/>/g,
         contentSelfClosing: /<Content\s*\/>/g,
      },
      maxDepth: 20,
      globalVariables: {},
      expressions: {
         scriptsDefine: true,
         tagNames: { if: 'if', elseif: 'elseif', else: 'else' },
      },
      loop: {
         dataDir: 'src/data',
         tagName: 'each',
      },
   }

   const config = {
      ...defaultOptions,
      ...options,
      regex: { ...defaultOptions.regex, ...options.regex },
      expressions: { ...defaultOptions.expressions, ...options.expressions },
      loop: { ...defaultOptions.loop, ...options.loop },
   }

   // ⚡ Попереднє кешування всіх компонентів
   async function preloadComponents() {
      const files = await fg(
         config.componentPaths.map((p) => `${p}**/*.html`),
         { onlyFiles: true }
      )
      files.forEach((file) => {
         const name = file.split('/').pop().replace('.html', '')
         config.cache.set(name, file)
      })
   }

   function toArray(val) {
      return Array.isArray(val) ? val : [val]
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
      await preloadComponents() // ⚡ кешуємо перед першим проходом

      let depth = 0
      tree = await expressionsPlugin(config.globalVariables, config)(tree)
      tree = toArray(tree)

      while (hasComponentNodes(tree)) {
         if (depth++ > config.maxDepth) break
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
               // ⚡ Компонента немає — одразу видаляємо
               logger(`${pluginName} Component <${componentName}> not found`, 'warning')
               nodes.splice(i, 1)
               i--
               continue
            }

            try {
               let fileContent = await fs.readFile(filePath, 'utf8')
               fileContent = fileContent.replace(/^\uFEFF/, '') // Прибираємо BOM
               fileContent = replaceSelfClosingTags(fileContent)

               let subTree = posthtmlParser(fileContent, {
                  recognizeSelfClosing: true,
                  recognizeCDATA: true,
                  lowerCaseTags: false,
               })

               const combinedProps = { ...config.globalVariables, ...node.attrs }
               subTree = await expressionsPlugin(combinedProps, config)(toArray(subTree))
               subTree = injectSlotContent(subTree, node.content || [])

               nodes.splice(i, 1, ...subTree)
               i += subTree.length - 1

               logger(`${pluginName} Processed component <${componentName}>`, 'success')
            } catch (error) {
               logger(`${pluginName} Error processing component <${componentName}>`, 'error', { error: error.message })
               nodes.splice(i, 1)
               i--
            }
         }

         if (node.content) {
            await processTree(node.content)
         }
      }
   }

   async function findComponentFile(name) {
      if (config.cache.has(name)) return config.cache.get(name)
      return null
   }

   function injectSlotContent(tree, slotContent) {
      tree = toArray(tree)
      return tree.flatMap((node) => {
         if (typeof node === 'string') return node
         if (node.tag === 'Content') return slotContent
         if (Array.isArray(node.content)) {
            node.content = injectSlotContent(node.content, slotContent)
         }
         return node
      })
   }

   function replaceSelfClosingTags(html) {
      return html
         .replace(config.regex.contentSelfClosing, '<Content></Content>')
         .replace(config.regex.componentSelfClosing, (full, tag, attrs) => `<${tag}${attrs || ''}></${tag}>`)
   }
}

import fs from 'fs/promises'
import fg from 'fast-glob'
import { parser as posthtmlParser } from 'posthtml-parser'
import expressionsPlugin from './expressions.js'
import logger from '../logger.js'
import templateCfg from '../../template.config.js'

function toArray(val) {
   return Array.isArray(val) ? val : [val]
}

/**
 * PostHTML plugin for including components and processing expressions
 * @param {Object} options - Plugin configuration
 * @param {string[]} options.componentPaths - Paths to search for component files
 * @param {Map} options.cache - Cache for component file paths
 * @param {Object} options.regex - Regular expressions for processing tags
 * @param {number} options.maxDepth - Maximum depth for component nesting
 * @param {Object} options.globalVariables - Global variables for expressions
 * @param {Object} options.expressions - Configuration for expressions plugin
 * @param {Object} options.loop - Configuration for loop processing
 */
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
         tagNames: {
            if: 'if',
            elseif: 'elseif',
            else: 'else',
         },
      },
      loop: {
         dataDir: 'src/data',
         tagName: 'each',
      },
   }

   // Deep merge options
   const config = {
      ...defaultOptions,
      ...options,
      regex: { ...defaultOptions.regex, ...options.regex },
      expressions: { ...defaultOptions.expressions, ...options.expressions },
      loop: { ...defaultOptions.loop, ...options.loop },
   }

   // Check if tree contains component nodes (tags starting with uppercase letter)
   function hasComponentNodes(nodes) {
      for (const node of nodes) {
         if (typeof node === 'string') continue
         if (/^[A-Z]/.test(node.tag)) return true
         if (Array.isArray(node.content) && hasComponentNodes(node.content)) return true
      }
      return false
   }

   // Main plugin function
   return async function componentIncludePlugin(tree) {
      let depth = 0

      tree = await expressionsPlugin(config.globalVariables, config)(tree)
      tree = toArray(tree)

      while (hasComponentNodes(tree)) {
         if (depth++ > config.maxDepth) {
            logger(`${pluginName} Component nesting exceeded max depth (${config.maxDepth})`, 'error', { maxDepth: config.maxDepth })
            break
         }
         await processTree(tree)
      }
      return tree
   }

   // Process the tree, replacing component tags with their content
   async function processTree(nodes) {
      for (let i = 0; i < nodes.length; i++) {
         const node = nodes[i]

         if (typeof node === 'string') continue

         if (/^[A-Z]/.test(node.tag)) {
            const componentName = node.tag
            const filePath = await findComponentFile(componentName)

            if (!filePath) {
               logger(`${pluginName} Component <${componentName}> not found "${config.componentPaths.join(', ')}"`, 'warning')
               nodes.splice(i, 1)
               i--
               continue
            }

            try {
               let fileContent = await fs.readFile(filePath, 'utf8')

               fileContent = fileContent.replace(/^\uFEFF/, '')
               fileContent = Buffer.from(fileContent, 'utf8').toString()
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

               logger(`${pluginName} Processed component <${componentName}> "${filePath}"`, 'success')
            } catch (error) {
               logger(`${pluginName} Error processing component <${componentName}> "${filePath}"`, 'error', { error: error.message })
               nodes.splice(i, 1)
               i--
            }
            continue
         }

         if (node.content) {
            await processTree(node.content)
         }
      }
   }

   // Find component file in configured paths
   async function findComponentFile(name) {
      if (config.cache.has(name)) {
         const cached = config.cache.get(name)
         try {
            await fs.access(cached) // Verify file exists
            return cached
         } catch {
            config.cache.delete(name) // Remove invalid cache entry
         }
      }

      const files = await fg(config.componentPaths.map((p) => `${p}**/${name}.html`), {
         onlyFiles: true,
      })
      const file = files[0]
      if (file) {
         config.cache.set(name, file)
      }
      return file
   }

   // Inject slot content into <Content> tags
   function injectSlotContent(tree, slotContent) {
      tree = toArray(tree)
      return tree.flatMap((node) => {
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

   // Replace self-closing component and content tags
   function replaceSelfClosingTags(html) {
      return html
         .replace(config.regex.contentSelfClosing, '<Content></Content>')
         .replace(
            config.regex.componentSelfClosing,
            (full, tag, attrs) => `<${tag}${attrs || ''}></${tag}>`
         )
   }
}
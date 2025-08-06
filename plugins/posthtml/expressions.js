import { processEachNode } from './each-plugin.js'
import logger from '../logger.js'

/**
 * PostHTML plugin for processing expressions and conditional tags
 * @param {Object} initProps - Initial properties for expressions
 * @param {Object} options - Plugin configuration
 * @param {Object} options.expressions - Expression settings (e.g., tag names, scriptsDefine)
 * @returns {Function} - Function to process the PostHTML tree
 */
export default function expressionsPlugin(initProps = {}, options = {}) {
   const pluginName = '[expressions-plugin]'
   const expressionsOpts = {
      scriptsDefine: true,
      tagNames: {
         if: 'if',
         elseif: 'elseif',
         else: 'else',
      },
      ...options.expressions,
   }

   const tagIf = expressionsOpts.tagNames.if
   const tagElseIf = expressionsOpts.tagNames.elseif
   const tagElse = expressionsOpts.tagNames.else

   // Extract variables defined in <script define> tags
   function extractDefineVars(nodes) {
      let defineProps = {}
      let cleanNodes = []
      for (const node of nodes) {
         if (
            !expressionsOpts.scriptsDefine ||
            typeof node !== 'object' ||
            node.tag !== 'script' ||
            node.attrs?.define === undefined
         ) {
            cleanNodes.push(node)
            continue
         }

         const code = Array.isArray(node.content)
            ? node.content.filter((x) => typeof x === 'string').join('\n')
            : ''

         try {
            const func = new Function(`
          ${code}
          return {${getDefinedVars(code).join(',')}}
        `)
            defineProps = { ...defineProps, ...func() }
            logger(`${pluginName} Extracted variables from <script define> "${Object.keys(defineProps).join(', ')}"`, 'info')
         } catch (e) {
            logger(`${pluginName} Failed to execute <script define> "${e.message}"`, 'error')
         }
      }
      return { defineProps, cleanNodes }
   }

   // Get variable names defined in code
   function getDefinedVars(code) {
      const matches = Array.from(code.matchAll(/\b(?:var|let|const)\s+([a-zA-Z0-9_$]+)\s*=/g))
      return matches.map((m) => m[1])
   }

   // Evaluate an expression with given properties
   async function evalExpression(expr, props) {
      if (expr in props) {
         let val = props[expr]
         if (typeof val === 'string' && val.trim().startsWith('[')) {
            try {
               return (new Function(`return (${val})`))()
            } catch {
               try {
                  return JSON.parse(val)
               } catch {
                  return ''
               }
            }
         }
         if (typeof val === 'string' && val.trim().startsWith('{')) {
            try {
               return (new Function(`return (${val})`))()
            } catch {
               try {
                  return JSON.parse(val)
               } catch {
                  return ''
               }
            }
         }
         return val ?? ''
      }

      try {
         const val = Function(...Object.keys(props), `return (${expr})`)(...Object.values(props))
         return val === false || val === null || typeof val === 'undefined' ? '' : val
      } catch (e) {
         logger(`${pluginName} Failed to evaluate expression "${expr}" "${e.message}"`, 'question')
         return ''
      }
   }

   // Process nodes, handling expressions, conditionals, and loops
   async function processNodes(nodes, props = initProps) {
      const { defineProps, cleanNodes } = extractDefineVars(nodes)
      props = { ...props, ...defineProps }

      let result = []

      for (let i = 0; i < cleanNodes.length; i++) {
         let node = cleanNodes[i]

         if (typeof node === 'string') {
            let str = node
            const matches = Array.from(str.matchAll(/\{\{\s*(.+?)\s*\}\}/g))
            if (matches.length) {
               const replacements = await Promise.all(matches.map((m) => evalExpression(m[1], props)))
               matches.forEach((match, idx) => {
                  str = str.replace(match[0], replacements[idx])
               })
            }
            result.push(str)
            continue
         }

         const eachNodes = await processEachNode(node, props, processNodes, evalExpression, options)
         if (eachNodes !== null) {
            result.push(...eachNodes)
            logger(`${pluginName} Processed <each> node`, 'info')
            continue
         }

         if (node.tag === tagIf) {
            let handled = false
            let j = i
            const branches = [cleanNodes[j]]
            while (cleanNodes[j + 1]) {
               const next = cleanNodes[j + 1]
               if (typeof next === 'string' && next.trim() === '') {
                  j++
                  continue
               }
               if (next.tag === tagElseIf || next.tag === tagElse) {
                  j++
                  branches.push(next)
                  continue
               }
               break
            }

            for (const branch of branches) {
               if (branch.tag === tagIf || branch.tag === tagElseIf) {
                  if (branch.attrs?.condition && (await evalExpression(branch.attrs.condition, props))) {
                     if (branch.content) result.push(...(await processNodes(branch.content, props)))
                     handled = true
                     logger(`${pluginName} Processed <${branch.tag}> condition "${branch.attrs.condition}"`, 'info')

                     break
                  }
               } else if (branch.tag === tagElse) {
                  if (branch.content) result.push(...(await processNodes(branch.content, props)))
                  handled = true
                  logger(`${pluginName} Processed <else> condition`, 'info')

                  break
               }
            }
            i = j
            continue
         }

         if (node.tag === tagElseIf || node.tag === tagElse) continue

         if (node.attrs) {
            for (const [key, val] of Object.entries(node.attrs)) {
               if (typeof val === 'string') {
                  const singleVarMatch = val.match(/^\s*\{\{\s*([a-zA-Z0-9_$]+)\s*\}\}\s*$/)
                  if (singleVarMatch) {
                     node.attrs[key] = props[singleVarMatch[1]]
                  } else {
                     const matches = Array.from(val.matchAll(/\{\{\s*(.+?)\s*\}\}/g))
                     let replaced = val
                     if (matches.length) {
                        const replacements = await Promise.all(
                           matches.map((m) => evalExpression(m[1], props))
                        )
                        matches.forEach((match, idx) => {
                           replaced = replaced.replace(match[0], replacements[idx])
                        })
                        node.attrs[key] = replaced
                     }
                  }
               }
            }
         }

         if (node.content) {
            node.content = await processNodes(node.content, props)
         }

         result.push(node)
      }

      return result
   }

   return processNodes
}
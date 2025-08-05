import { processEachNode } from './each-plugin.js'

export default function expressionsPlugin(initProps = {}, options = {}) {
   const pluginName = '[expressions-plugin]'
   const logger = options.logger ?? console
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
            ? node.content.filter(x => typeof x === 'string').join('\n')
            : ''

         try {
            const func = new Function(`
               ${code}
               return {${getDefinedVars(code).join(',')}}
            `)
            defineProps = { ...defineProps, ...func() }
         } catch (e) {
            if (options.isLogger) logger.warn(`${pluginName} ❌ Не вдалося виконати <script define>`, e)
         }
      }
      return { defineProps, cleanNodes }
   }

   function getDefinedVars(code) {
      const matches = Array.from(code.matchAll(/\b(?:var|let|const)\s+([a-zA-Z0-9_$]+)\s*=/g))
      return matches.map(m => m[1])
   }

   async function evalExpression(expr, props) {
      if (expr in props) {
         let val = props[expr]
         if (typeof val === 'string' && val.trim().startsWith('[')) {
            try { return (new Function(`return (${val})`))() } catch (e) { try { return JSON.parse(val) } catch { } }
         }
         if (typeof val === 'string' && val.trim().startsWith('{')) {
            try { return (new Function(`return (${val})`))() } catch (e) { try { return JSON.parse(val) } catch { } }
         }
         return val ?? ''
      }

      try {
         const val = Function(...Object.keys(props), `return (${expr})`)(...Object.values(props))
         return (val === false || val === null || typeof val === 'undefined') ? '' : val
      } catch (e) {
         return ''
      }
   }

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
               const replacements = await Promise.all(matches.map(m => evalExpression(m[1], props)))
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
            continue
         }

         if (node.tag === tagIf) {
            let handled = false
            let j = i
            // Збираємо всі elseif/else, які йдуть підряд після if, пропускаючи пробіли/переноси
            const branches = []
            branches.push(cleanNodes[j])
            while (cleanNodes[j + 1]) {
               const next = cleanNodes[j + 1]
               // Пропускаємо текстові вузли (пробіли, переноси)
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
            if (options.isLogger) {
               logger.log('[expressions-plugin][DEBUG] props:', props)
            }
            for (const branch of branches) {
               if (branch.tag === tagIf || branch.tag === tagElseIf) {
                  if (branch.attrs?.condition && await evalExpression(branch.attrs.condition, props)) {
                     if (branch.content) result.push(...await processNodes(branch.content, props))
                     handled = true
                     break
                  }
               } else if (branch.tag === tagElse) {
                  if (branch.content) result.push(...await processNodes(branch.content, props))
                  handled = true
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
                        const replacements = await Promise.all(matches.map(m => evalExpression(m[1], props)))
                        matches.forEach((match, idx) => {
                           replaced = replaced.replace(match[0], replacements[idx])
                        })
                     }
                     node.attrs[key] = replaced
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

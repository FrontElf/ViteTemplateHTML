import { evalExpression } from './expressions.js'
import { logger } from './logger.js'

/**
 * Збирає ланцюжок умовних вузлів (if/elseif/else) починаючи з поточного індексу
 * @returns {{ chain: Array, nextIndex: number }}
 */
function collectConditionChain(nodes, startIndex, ifTag, elseifTag, elseTag) {
   const chain = [nodes[startIndex]]
   let j = startIndex + 1

   while (j < nodes.length) {
      const node = nodes[j]
      if (typeof node === 'string') {
         j++
         continue
      }
      if ([elseifTag, elseTag].includes(node.tag)) {
         chain.push(node)
         j++
      } else {
         break
      }
   }

   return { chain, nextIndex: j }
}

/**
 * Оцінює ланцюжок умов і повертає контент першої true умови
 */
function evaluateConditionChain(chain, props, config) {
   const { ifTag, elseifTag, elseTag, isLogger, loggerPrefix } = config

   for (const condNode of chain) {
      if (condNode.tag === ifTag && condNode.attrs?.condition) {
         if (evalExpression(condNode.attrs.condition, props)) {
            isLogger && logger(loggerPrefix, `<${ifTag}> condition "${condNode.attrs.condition}" is true`, 'info')
            return condNode.content || []
         }
      } else if (condNode.tag === elseifTag && condNode.attrs?.condition) {
         if (evalExpression(condNode.attrs.condition, props)) {
            isLogger && logger(loggerPrefix, `<${elseifTag}> condition "${condNode.attrs.condition}" is true`, 'info')
            return condNode.content || []
         }
      } else if (condNode.tag === elseTag) {
         isLogger && logger(loggerPrefix, `<${elseTag}> selected`, 'info')
         return condNode.content || []
      }
   }

   return []
}

export function processConditions(tree, props, baseOptions = {}) {
   const {
      if: ifTag,
      elseif: elseifTag,
      else: elseTag,
      isLogger = false,
      loggerPrefix = '[HTML-Conditions]'
   } = baseOptions.conditions

   const config = { ifTag, elseifTag, elseTag, isLogger, loggerPrefix }

   function walk(nodes) {
      if (Array.isArray(nodes)) {
         const result = []
         let i = 0

         while (i < nodes.length) {
            const node = nodes[i]

            if (typeof node === 'string') {
               result.push(node)
               i++
               continue
            }

            if (node.tag === ifTag) {
               const { chain, nextIndex } = collectConditionChain(nodes, i, ifTag, elseifTag, elseTag)
               const selectedContent = evaluateConditionChain(chain, props, config)
               result.push(...walk(selectedContent))
               i = nextIndex
            } else if ([elseifTag, elseTag].includes(node.tag)) {
               isLogger && logger(loggerPrefix, `Skipping standalone <${node.tag}> at index ${i}`, 'warn')
               i++
            } else {
               if (node.content) node.content = walk(node.content)
               result.push(node)
               i++
            }
         }

         return result
      }

      if (nodes?.content) nodes.content = walk(nodes.content)
      return nodes
   }

   return walk(tree)
}

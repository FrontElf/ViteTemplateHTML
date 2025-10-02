import { evalExpression } from './expressions.js'
import { logger } from './logger.js'

// Обробка умовних тегів
export function processConditions(tree, props, baseOptions = {}) {
   const {
      if: ifTag,
      elseif: elseifTag,
      else: elseTag,
      isLogger = false,
      loggerPrefix = '[HTML-Conditions]'
   } = baseOptions.conditions

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
               const conditionNodes = [node]
               let j = i + 1
               while (j < nodes.length && (typeof nodes[j] === 'string' || [elseifTag, elseTag].includes(nodes[j].tag))) {
                  if (typeof nodes[j] !== 'string') conditionNodes.push(nodes[j])
                  j++
               }

               let selectedContent = []
               let conditionMet = false
               for (const condNode of conditionNodes) {
                  if (condNode.tag === ifTag && condNode.attrs?.condition) {
                     if (evalExpression(condNode.attrs.condition, props)) {
                        selectedContent = condNode.content || []
                        conditionMet = true
                        isLogger && logger(loggerPrefix, `<${ifTag}> condition "${condNode.attrs.condition}" is true`, 'info')
                        break
                     }
                  } else if (condNode.tag === elseifTag && !conditionMet && condNode.attrs?.condition) {
                     if (evalExpression(condNode.attrs.condition, props)) {
                        selectedContent = condNode.content || []
                        conditionMet = true
                        isLogger && logger(loggerPrefix, `<${elseifTag}> condition "${condNode.attrs.condition}" is true`, 'info')
                        break
                     }
                  } else if (condNode.tag === elseTag && !conditionMet) {
                     selectedContent = condNode.content || []
                     conditionMet = true
                     isLogger && logger(loggerPrefix, `<${elseTag}> selected`, 'info')
                     break
                  }
               }

               result.push(...walk(selectedContent))
               i += j - i
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

import { evalExpression } from './expressions.js'
import { logger } from './logger.js'

function normalizeLiteralValue(value) {
   if (value === 'true') return true
   if (value === 'false') return false
   if (value === 'null') return null
   if (value === 'undefined') return undefined
   if (value !== '' && !Number.isNaN(Number(value))) return Number(value)
   return value
}

function evaluateCaseNode(caseNode, switchValue, props, config) {
   const { isLogger, loggerPrefix } = config
   const attrs = caseNode.attrs || {}

   if (attrs.condition) {
      const matched = Boolean(evalExpression(attrs.condition, props, isLogger, loggerPrefix, {
         stage: 'switch case',
         expression: attrs.condition,
         context: props,
      }))
      if (matched) {
         isLogger && logger(loggerPrefix, `<case> condition "${attrs.condition}" matched`, 'info')
      }
      return matched
   }

   if (attrs.expression) {
      const caseValue = evalExpression(attrs.expression, props, isLogger, loggerPrefix, {
         stage: 'switch case',
         expression: attrs.expression,
         context: props,
      })
      const matched = Object.is(switchValue, caseValue)
      if (matched) {
         isLogger && logger(loggerPrefix, `<case> expression "${attrs.expression}" matched`, 'info')
      }
      return matched
   }

   if ('value' in attrs) {
      const caseValue = normalizeLiteralValue(attrs.value)
      const matched = Object.is(switchValue, caseValue)
      if (matched) {
         isLogger && logger(loggerPrefix, `<case> value "${attrs.value}" matched`, 'info')
      }
      return matched
   }

   return false
}

function evaluateSwitchNode(node, props, config) {
   const {
      switchTag,
      caseTag,
      defaultTag,
      isLogger,
      loggerPrefix,
   } = config
   const attrs = node.attrs || {}
   const switchExpression = attrs.key

   if (!switchExpression) {
      isLogger && logger(loggerPrefix, `<${switchTag}> missing "key" attribute`, 'warn')
      return []
   }

   const switchValue = evalExpression(switchExpression, props, isLogger, loggerPrefix, {
      stage: 'switch',
      expression: switchExpression,
      context: props,
   })
   const children = Array.isArray(node.content) ? node.content : []
   let defaultContent = []

   for (const child of children) {
      if (!child || typeof child !== 'object') continue

      if (child.tag === caseTag && evaluateCaseNode(child, switchValue, props, config)) {
         return child.content || []
      }

      if (child.tag === defaultTag) {
         defaultContent = child.content || []
      }
   }

   isLogger && logger(loggerPrefix, `<${switchTag}> selected <${defaultTag}>`, 'info')
   return defaultContent
}

export function processSwitches(tree, props, baseOptions = {}) {
   const {
      switch: switchTag = 'switch',
      case: caseTag = 'case',
      default: defaultTag = 'default',
      isLogger = false,
      loggerPrefix = '[HTML-Switch]',
   } = baseOptions.switches || {}

   const config = { switchTag, caseTag, defaultTag, isLogger, loggerPrefix }

   function walk(nodes) {
      if (Array.isArray(nodes)) {
         const result = []

         for (const node of nodes) {
            if (typeof node === 'string') {
               result.push(node)
               continue
            }

            if (node?.tag === switchTag) {
               result.push(...walk(evaluateSwitchNode(node, props, config)))
               continue
            }

            if ([caseTag, defaultTag].includes(node?.tag)) {
               isLogger && logger(loggerPrefix, `Skipping standalone <${node.tag}>`, 'warn')
               continue
            }

            if (node?.tag === 'each') {
               result.push(node)
               continue
            }

            if (node?.content) {
               node.content = walk(node.content)
            }
            result.push(node)
         }

         return result
      }

      if (nodes?.tag === 'each') return nodes
      if (nodes?.tag === switchTag) return walk([nodes])
      if (nodes?.content) nodes.content = walk(nodes.content)
      return nodes
   }

   return walk(tree)
}

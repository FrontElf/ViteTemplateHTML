import { logger } from './logger.js'

export function processVueDirectives(tree, context, baseOptions = {}) {
   const {
      isLogger = false,
      loggerPrefix = '[HTML-VueDirectives]',
      if: ifDirective = 'f-if',
      for: forDirective = 'f-for',
      range: rangeDirective = 'f-range',
      as: asDirective = 'f-as'
   } = baseOptions.vueDirectives || {}

   function processNode(node) {
      if (typeof node === 'string') {
         return node
      }

      if (!node || typeof node !== 'object') {
         return node
      }

      if (node.attrs && node.attrs[ifDirective]) {
         const condition = node.attrs[ifDirective]
         const { [ifDirective]: _, ...restAttrs } = node.attrs

         const ifNode = {
            tag: 'if',
            attrs: { condition },
            content: [{
               ...node,
               attrs: restAttrs,
               content: node.content ? processContent(node.content) : undefined
            }]
         }

         isLogger && logger(loggerPrefix, `Converted ${ifDirective}="${condition}" to <if> tag`, 'info')
         return ifNode
      }

      if (node.attrs && node.attrs[forDirective]) {
         const forExpression = node.attrs[forDirective]
         const { [forDirective]: _, ...restAttrs } = node.attrs

         const forMatch = forExpression.match(/^\s*\(?\s*([a-zA-Z_$][\w$]*)(?:\s*,\s*([a-zA-Z_$][\w$]*))?(?:\s*,\s*([a-zA-Z_$][\w$]*))?\s*\)?\s+in\s+(.+)$/)

         if (!forMatch) {
            isLogger && logger(loggerPrefix, `Invalid ${forDirective} expression format: "${forExpression}"`, 'error')
            return {
               ...node,
               content: node.content ? processContent(node.content) : undefined
            }
         }

         const [, itemName, indexName, lengthName, dataSource] = forMatch
         const dataSourceTrimmed = dataSource.trim()

         const isJsonFile = /\.json$/.test(dataSourceTrimmed) && !dataSourceTrimmed.includes('[') && !dataSourceTrimmed.includes('{')

         let loopExpression
         if (lengthName) {
            loopExpression = `(${itemName}, ${indexName}, ${lengthName}) in ${isJsonFile ? 'data' : dataSourceTrimmed}`
         } else if (indexName) {
            loopExpression = `(${itemName}, ${indexName}) in ${isJsonFile ? 'data' : dataSourceTrimmed}`
         } else {
            loopExpression = `${itemName} in ${isJsonFile ? 'data' : dataSourceTrimmed}`
         }

         const eachNode = {
            tag: 'each',
            attrs: {
               loop: loopExpression,
               ...(isJsonFile && { data: dataSourceTrimmed })
            },
            content: [{
               ...node,
               attrs: restAttrs,
               content: node.content ? processContent(node.content) : undefined
            }]
         }

         isLogger && logger(loggerPrefix, `Converted ${forDirective}="${forExpression}" to <each> tag`, 'info')
         return eachNode
      }

      if (node.attrs && node.attrs[rangeDirective]) {
         const rangeExpression = node.attrs[rangeDirective]
         const varName = node.attrs[asDirective] || 'i'
         const { [rangeDirective]: _, [asDirective]: __, ...restAttrs } = node.attrs

         const rangeMatch = rangeExpression.match(/^\s*(\d+)\s+to\s+(\d+)(?:\s+step\s+(\d+))?\s*$/i)

         if (!rangeMatch) {
            isLogger && logger(loggerPrefix, `Invalid ${rangeDirective} expression format: "${rangeExpression}"`, 'error')
            return {
               ...node,
               content: node.content ? processContent(node.content) : undefined
            }
         }

         const [, startStr, endStr, stepStr] = rangeMatch
         const start = parseInt(startStr, 10)
         const end = parseInt(endStr, 10)
         const step = stepStr ? parseInt(stepStr, 10) : 1

         if (step === 0) {
            isLogger && logger(loggerPrefix, `Invalid ${rangeDirective} step: step cannot be 0`, 'error')
            return {
               ...node,
               content: node.content ? processContent(node.content) : undefined
            }
         }

         const numbers = []
         if (step > 0) {
            for (let i = start; i <= end; i += step) {
               numbers.push(i)
            }
         } else {
            for (let i = start; i >= end; i += step) {
               numbers.push(i)
            }
         }

         const eachNode = {
            tag: 'each',
            attrs: {
               loop: `${varName} in __rangeData__`
            },
            content: [{
               ...node,
               attrs: restAttrs,
               content: node.content ? processContent(node.content) : undefined
            }]
         }

         eachNode._rangeData = numbers

         isLogger && logger(loggerPrefix, `Converted ${rangeDirective}="${rangeExpression}" to <each> tag with ${numbers.length} items`, 'info')
         return eachNode
      }

      return {
         ...node,
         content: node.content ? processContent(node.content) : undefined
      }
   }

   function processContent(content) {
      if (Array.isArray(content)) {
         return content.map(processNode)
      }
      return processNode(content)
   }

   if (Array.isArray(tree)) {
      return tree.map(processNode)
   }

   return processNode(tree)
}


import { logger } from './logger.js'

export function evalExpression(expression, props, isLogger, loggerPrefix) {
   try {
      const context = { ...props }
      const fn = new Function(...Object.keys(context), `return ${expression}`)
      return fn(...Object.values(context))
   } catch (e) {
      isLogger && logger(loggerPrefix, `Failed to evaluate expression: ${expression} - ${e.message}`, 'error')
      return null
   }
}

export function processExpressions(tree, context, baseOptions = {}) {
   const {
      isLogger = false,
      loggerPrefix = '[HTML-Expressions]'
   } = baseOptions.expressions

   function processNode(node) {
      if (typeof node === 'string') {
         return processTextNode(node, context)
      }

      if (!node || typeof node !== 'object') {
         return node
      }

      // Обробка атрибутів
      if (node.attrs) {
         const newAttrs = { ...node.attrs }
         for (const [attr, val] of Object.entries(newAttrs)) {
            if (typeof val === 'string' && val.includes('{{')) {
               const exprMatch = val.match(/^\s*\{\{([^}]+)\}\}\s*$/)
               if (exprMatch) {
                  const result = evalExpression(exprMatch[1].trim(), context, isLogger, loggerPrefix)
                  newAttrs[attr] = result
               } else {
                  newAttrs[attr] = val.replace(/\{\{([^}]+)\}\}/g, (_, expression) => {
                     const result = evalExpression(expression.trim(), context, isLogger, loggerPrefix)
                     return (result === null || result === undefined) ? '' : result
                  })
               }
            }
         }
         node.attrs = newAttrs
      }

      // Обробка контенту
      if (node.content) {
         if (Array.isArray(node.content)) {
            node.content = node.content.map(n => processNode(n))
         } else {
            node.content = processNode(node.content)
         }
      }

      return node
   }

   function processTextNode(text, context) {
      if (typeof text === 'string' && text.includes('{{')) {
         return text.split(/(\{\{[^}]+\}\})/g).flatMap(part => {
            if (part.match(/\{\{([^}]+)\}\}/)) {
               const expression = part.slice(2, -2).trim()
               const result = evalExpression(expression, context, isLogger, loggerPrefix)

               if (Array.isArray(result)) return result
               if (result && typeof result === 'object') return JSON.stringify(result)
               if (result === null || result === undefined) return ''
               return String(result)
            }
            return part
         })
      }
      return text
   }

   if (Array.isArray(tree)) {
      return tree.map(processNode)
   }
   
   return processNode(tree)
}

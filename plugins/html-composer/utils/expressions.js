import { logger } from './logger.js'

// Оцінка виразів
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

// Обробка шаблонних виразів у атрибутах і контенті
export function processExpressions(tree, context, baseOptions = {}) {
   const {
      isLogger = false,
      loggerPrefix = '[HTML-Expressions]'
   } = baseOptions.expressions

   function walk(node) {
      if (Array.isArray(node)) {
         return node.map(n =>
            typeof n === 'string' ? processTextNode(n, context) : walk(n)
         )
      }

      if (node?.attrs) {
         for (const [attr, val] of Object.entries(node.attrs)) {
            if (typeof val === 'string' && val.includes('{{')) {
               const exprMatch = val.match(/^\s*\{\{([^}]+)\}\}\s*$/)
               if (exprMatch) {
                  // атрибут містить тільки вираз → можна напряму присвоїти результат
                  const result = evalExpression(exprMatch[1].trim(), context, isLogger, loggerPrefix)
                  node.attrs[attr] = result
               } else {
                  // звичайний рядок з виразами → робимо replace
                  node.attrs[attr] = val.replace(/\{\{([^}]+)\}\}/g, (_, expression) => {
                     const result = evalExpression(expression.trim(), context, isLogger, loggerPrefix)
                     return (result === null || result === undefined) ? '' : result
                  })

               }
            }
         }
      }

      if (node?.content) {
         node.content = node.content.map(n =>
            typeof n === 'string' ? processTextNode(n, context) : walk(n)
         )
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

   return walk(tree)
}

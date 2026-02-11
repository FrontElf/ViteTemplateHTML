import { logger } from './logger.js'

export function evalExpression(expression, props, isLogger, loggerPrefix) {
   try {
      const proxy = new Proxy({ ...props, props }, {
         has(target, key) {
            // 1. If property exists in props, we claim it
            if (key in target) return true

            // 2. Check if it's a global (like Math, JSON, Infinity)
            // We intentionally let these "escape" the proxy/with block so they resolve to global scope
            try {
               if (global[key] !== undefined) return false
            } catch (e) { }

            // 3. Last check for browser environment globals if needed, or specific whitelisted globals
            // For now, assuming Node environment primarily for build tools, but 'Math' etc should be safe.

            // 4. If not global and not in props, we claim it so `with` doesn't throw ReferenceError
            return true
         },
         get(target, key) {
            // If key exists, return it
            if (key in target) return target[key]
            // If we claimed it in has() but it's not in target, it's undefined
            return undefined
         }
      })

      const fn = new Function('context', `with(context) { return ${expression} }`)
      return fn(proxy)
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
         const newAttrs = {}
         for (const [attr, val] of Object.entries(node.attrs)) {
            const dynamicAttrKeyMatch = attr.match(/^\s*\{\{([^}]+)\}\}\s*$/)

            if (dynamicAttrKeyMatch) {
               const result = evalExpression(dynamicAttrKeyMatch[1].trim(), context, isLogger, loggerPrefix)
               injectDynamicAttributes(newAttrs, result)
               continue
            }

            if (typeof val === 'string' && val.includes('{{')) {
               const exprMatch = val.match(/^\s*\{\{([^}]+)\}\}\s*$/)
               if (exprMatch) {
                  const result = evalExpression(exprMatch[1].trim(), context, isLogger, loggerPrefix)
                  let finalResult = result
                  if (attr === 'src' && result && typeof result === 'object' && !Array.isArray(result)) {
                     finalResult = result.desktop || result.src || ''
                  } else if (attr === 'src' && Array.isArray(result) && result.length > 0 && result[0] && typeof result[0] === 'object') {
                     finalResult = result[0].desktop || result[0].src || ''
                  }
                  setAttribute(newAttrs, attr, finalResult)
               } else {
                  const interpolatedValue = val.replace(/\{\{([^}]+)\}\}/g, (_, expression) => {
                     const result = evalExpression(expression.trim(), context, isLogger, loggerPrefix)
                     return (result === null || result === undefined) ? '' : result
                  })
                  setAttribute(newAttrs, attr, interpolatedValue)
               }
            } else {
               setAttribute(newAttrs, attr, val)
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

function injectDynamicAttributes(target, dynamicValue) {
   if (!dynamicValue || typeof dynamicValue !== 'object' || Array.isArray(dynamicValue)) {
      return
   }

   for (const [dynamicKey, dynamicAttrValue] of Object.entries(dynamicValue)) {
      setAttribute(target, dynamicKey, dynamicAttrValue)
   }
}

function setAttribute(attrs, key, value) {
   if (!key || value === null || value === undefined || value === false) {
      return
   }

   const normalizedValue = value === true ? '' : String(value)

   if (key === 'class' && attrs.class) {
      attrs.class = `${attrs.class} ${normalizedValue}`.trim()
      return
   }

   if (key === 'style' && attrs.style) {
      const current = attrs.style.trim()
      const next = normalizedValue.trim()
      attrs.style = current && next ? `${current}; ${next}` : `${current}${next}`
      return
   }

   attrs[key] = normalizedValue
}

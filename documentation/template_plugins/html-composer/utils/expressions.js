import { logger } from './logger.js'
import { createContextError } from './errorContext.js'

function isRegexStart(expression, index) {
   let prevIndex = index - 1
   while (prevIndex >= 0 && /\s/.test(expression[prevIndex])) prevIndex--
   if (prevIndex < 0) return true
   return /[({[=,:;!&|?+\-*~^<>]/.test(expression[prevIndex])
}

export function parseMustacheParts(value) {
   const input = String(value)
   const parts = []
   let index = 0

   while (index < input.length) {
      const start = input.indexOf('{{', index)
      if (start === -1) {
         parts.push({ type: 'text', value: input.slice(index) })
         break
      }

      if (start > index) {
         parts.push({ type: 'text', value: input.slice(index, start) })
      }

      let cursor = start + 2
      let quote = null
      let escapeNext = false
      let regexCharClass = false
      let parenDepth = 0
      let bracketDepth = 0
      let braceDepth = 0
      let foundClosing = false

      while (cursor < input.length) {
         const char = input[cursor]
         const next = input[cursor + 1]

         if (escapeNext) {
            escapeNext = false
            cursor++
            continue
         }

         if (quote) {
            if (char === '\\') {
               escapeNext = true
            } else if (quote === '/' && char === '[') {
               regexCharClass = true
            } else if (quote === '/' && char === ']' && regexCharClass) {
               regexCharClass = false
            } else if (char === quote && !(quote === '/' && regexCharClass)) {
               quote = null
            }
            cursor++
            continue
         }

         if (char === '"' || char === "'" || char === '`') {
            quote = char
            cursor++
            continue
         }

         if (char === '/' && isRegexStart(input, cursor)) {
            quote = '/'
            cursor++
            continue
         }

         if (char === '(') parenDepth++
         else if (char === ')' && parenDepth > 0) parenDepth--
         else if (char === '[') bracketDepth++
         else if (char === ']' && bracketDepth > 0) bracketDepth--
         else if (char === '{') braceDepth++
         else if (char === '}' && braceDepth > 0) braceDepth--
         else if (
            char === '}' &&
            next === '}' &&
            parenDepth === 0 &&
            bracketDepth === 0 &&
            braceDepth === 0
         ) {
            parts.push({ type: 'expression', value: input.slice(start + 2, cursor).trim() })
            cursor += 2
            foundClosing = true
            break
         }

         cursor++
      }

      if (!foundClosing) {
         parts.push({ type: 'text', value: input.slice(start) })
         break
      }

      index = cursor
   }

   return parts.filter(part => part.value !== '')
}

export function getSingleMustacheExpression(value) {
   const parts = parseMustacheParts(value)
   const expressionParts = parts.filter(part => part.type === 'expression')
   const textParts = parts.filter(part => part.type === 'text' && part.value.trim() !== '')

   if (expressionParts.length === 1 && textParts.length === 0) {
      return expressionParts[0].value
   }

   return null
}

export function interpolateMustache(value, context, isLogger, loggerPrefix, errorContext = {}) {
   const parts = parseMustacheParts(value)
   if (!parts.some(part => part.type === 'expression')) {
      return value
   }

   return parts.flatMap(part => {
      if (part.type === 'text') return part.value

      const result = evalExpression(part.value, context, isLogger, loggerPrefix, errorContext)
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object') return JSON.stringify(result)
      if (result === null || result === undefined) return ''
      return String(result)
   })
}

export function evalExpression(expression, props, isLogger, loggerPrefix, errorContext = {}) {
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
      const contextualError = createContextError('Failed to evaluate expression', {
         ...errorContext,
         stage: 'expression',
         expression,
         context: props,
      }, e)
      isLogger && logger(loggerPrefix, contextualError.message, 'error')
      if (process.env.NODE_ENV === 'production') {
         throw contextualError
      }
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
            const dynamicAttrExpression = getSingleMustacheExpression(attr)

            if (dynamicAttrExpression) {
               const result = evalExpression(dynamicAttrExpression, context, isLogger, loggerPrefix, baseOptions.errorContext)
               injectDynamicAttributes(newAttrs, result)
               continue
            }

            if (typeof val === 'string' && val.includes('{{')) {
               const singleExpression = getSingleMustacheExpression(val)
               if (singleExpression) {
                  const result = evalExpression(singleExpression, context, isLogger, loggerPrefix, baseOptions.errorContext)
                  let finalResult = result
                  if (attr === 'src' && result && typeof result === 'object' && !Array.isArray(result)) {
                     finalResult = result.desktop || result.src || ''
                  } else if (attr === 'src' && Array.isArray(result) && result.length > 0 && result[0] && typeof result[0] === 'object') {
                     finalResult = result[0].desktop || result[0].src || ''
                  }
                  setAttribute(newAttrs, attr, finalResult)
               } else {
                  const interpolatedValue = interpolateMustache(val, context, isLogger, loggerPrefix, baseOptions.errorContext)
                  setAttribute(newAttrs, attr, Array.isArray(interpolatedValue) ? interpolatedValue.join('') : interpolatedValue)
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
            node.content = node.content.flatMap(n => {
               const processed = processNode(n)
               return Array.isArray(processed) ? processed : [processed]
            })
         } else {
            node.content = processNode(node.content)
         }
      }

      return node
   }

   function processTextNode(text, context) {
      if (typeof text === 'string' && text.includes('{{')) {
         return interpolateMustache(text, context, isLogger, loggerPrefix, baseOptions.errorContext)
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

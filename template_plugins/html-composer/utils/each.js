import fs from 'fs/promises'
import path from 'path'
import { processExpressions, evalExpression, interpolateMustache } from './expressions.js'
import { processConditions } from './conditions.js'
import { processSwitches } from './switches.js'
import { logger } from './logger.js'
import { includeComponents } from './components.js'
import { createContextError } from './errorContext.js'

// Regex patterns for loop parsing
const PATTERNS = {
   // Matches: "item in __rangeData__" or "item, index in __rangeData__"
   rangeLoop: /^\s*([a-zA-Z_$][\w$]*)(?:\s*,\s*([a-zA-Z_$][\w$]*))?\s+in\s+__rangeData__\s*$/,

   // Matches: "item in array" or "(item, index) in array" or "(item, index, length) in array"
   forLoop: /^\s*\(?\s*([a-zA-Z_$][\w$]*)(?:\s*,\s*([a-zA-Z_$][\w$]*))?(?:\s*,\s*([a-zA-Z_$][\w$]*))?\s*\)?\s+in\s+(.+)$/,
}

function cloneAstNode(node) {
   if (Array.isArray(node)) {
      return node.map(cloneAstNode)
   } else if (node && typeof node === 'object') {
      return {
         ...node,
         attrs: node.attrs ? { ...node.attrs } : undefined,
         content: node.content ? cloneAstNode(node.content) : undefined
      }
   }
   return node
}

async function evaluateExpression(expression, context, isLogger, loggerPrefix, errorContext = {}) {
   try {
      const func = new Function(...Object.keys(context), `return ${expression}`)
      return func(...Object.values(context))
   } catch (error) {
      const contextualError = createContextError('Error evaluating loop expression', {
         ...errorContext,
         stage: 'each',
         expression,
         context,
      }, error)
      isLogger && logger(loggerPrefix, contextualError.message, 'error')
      if (process.env.NODE_ENV === 'production') {
         throw contextualError
      }
      return null
   }
}

async function processLoopIteration(items, node, context, baseOptions, componentMap, config) {
   const { itemName, indexName, lengthName, isArray = true } = config
   const newContent = []

   for (const [index, item] of items.entries()) {
      const loopProps = { ...context }
      const componentLoopProps = { ...(config.componentContext || context) }

      if (isArray) {
         loopProps[itemName] = item
         if (indexName) loopProps[indexName] = index
         componentLoopProps[itemName] = item
         if (indexName) componentLoopProps[indexName] = index
      } else {
         loopProps[itemName] = item[1]
         if (indexName) loopProps[indexName] = item[0]
         componentLoopProps[itemName] = item[1]
         if (indexName) componentLoopProps[indexName] = item[0]
      }

      if (lengthName) {
         loopProps[lengthName] = items.length
         componentLoopProps[lengthName] = items.length
      }

      const iterationOptions = config.componentContext
         ? { ...baseOptions, componentChildContext: componentLoopProps }
         : baseOptions
      const iterationContent = cloneAstNode(node.content || [])

      // Process nested loops with the current loop context first
      let processedContent = await processEach(iterationContent, loopProps, iterationOptions, componentMap)
      processedContent = processConditions(processedContent, loopProps, iterationOptions)
      processedContent = processSwitches(processedContent, loopProps, iterationOptions)
      processedContent = await includeComponents(processedContent, componentMap, componentLoopProps, iterationOptions)
      processedContent = processExpressions(processedContent, loopProps, iterationOptions)

      if (Array.isArray(processedContent)) {
         newContent.push(...processedContent)
      } else if (processedContent) {
         newContent.push(processedContent)
      }
   }

   return newContent
}

export async function processEach(tree, context, baseOptions = {}, componentMap) {
   const {
      isLogger = false,
      loggerPrefix = '[HTML-Each]'
   } = baseOptions.each
   const currentErrorContext = baseOptions.errorContext || {}

   async function processNode(node) {
      if (typeof node === 'string') {
         return node
      }

      if (!node || typeof node !== 'object') {
         return node
      }

      // Обробка тегу <each>
      if (node.tag === 'each') {
         const loopAttr = node.attrs?.loop
         if (!loopAttr) {
            isLogger && logger(loggerPrefix, 'Missing "loop" attribute on <each> tag.', 'warn')
            return node
         }

         // Перевірка на спеціальні дані для f-range
         if (node._rangeData) {
            const loopMatch = loopAttr.match(PATTERNS.rangeLoop)
            if (loopMatch) {
               const [, itemName, indexName] = loopMatch
               const componentContext = baseOptions.componentChildContext || context
               return await processLoopIteration(node._rangeData, node, context, baseOptions, componentMap, {
                  itemName, indexName, isArray: true, componentContext
               })
            }
         }

         const loopMatch = loopAttr.match(PATTERNS.forLoop)
         if (!loopMatch) {
            isLogger && logger(loggerPrefix, `Invalid loop attribute format: "${loopAttr}"`, 'error')
            return node
         }

         const [, itemName, indexName, lengthName, arrExpr] = loopMatch
         let localContext = { ...context }
         let dataArray

         if (node.attrs.data) {
            let dataPath = node.attrs.data

            if (typeof dataPath === 'string' && dataPath.includes('{{')) {
               const interpolatedDataPath = interpolateMustache(dataPath, context, isLogger, loggerPrefix, {
                  ...currentErrorContext,
                  stage: 'each data',
               })
               dataPath = Array.isArray(interpolatedDataPath) ? interpolatedDataPath.join('') : interpolatedDataPath
            }

            if (Array.isArray(dataPath) || typeof dataPath === 'object') {
               localContext.data = dataPath
            }

            else if (typeof dataPath === 'string' && /^https?:\/\//.test(dataPath)) {
               try {
                  const response = await fetch(dataPath)
                  if (!response.ok) {
                     throw new Error(`HTTP ${response.status} ${response.statusText}`)
                  }
                  localContext.data = await response.json()
                  isLogger && logger(loggerPrefix, `Loaded data from API "${dataPath}"`, 'info')
               } catch (e) {
                  isLogger && logger(loggerPrefix, `Failed to fetch API "${dataPath}": ${e.message}`, 'error')
                  if (process.env.NODE_ENV === 'production') {
                     throw createContextError('Failed to fetch loop data API', {
                        ...currentErrorContext,
                        stage: 'each data',
                        details: dataPath,
                        context: localContext,
                     }, e)
                  }
                  localContext.data = []
               }
            }

            else if (typeof dataPath === 'string') {
               const dataDir = path.resolve(process.cwd(), 'src/data')
               const filePath = path.isAbsolute(dataPath)
                  ? dataPath
                  : path.join(dataDir, dataPath)

               // Validate path is within allowed directory
               const resolvedPath = path.resolve(filePath)
               if (!resolvedPath.startsWith(dataDir)) {
                  isLogger && logger(loggerPrefix, `Path "${dataPath}" is outside allowed data directory`, 'warning')
                  localContext.data = []
               } else {
                  try {
                     const fileContent = await fs.readFile(filePath, 'utf8')
                     localContext.data = JSON.parse(fileContent)
                     isLogger && logger(loggerPrefix, `Loaded data from "${dataPath}"`, 'info')
                  } catch (e) {
                     isLogger && logger(loggerPrefix, `Failed to read or parse data file "${filePath}": ${e.message}`, 'error')
                     if (process.env.NODE_ENV === 'production') {
                        throw createContextError('Failed to read or parse loop data file', {
                           ...currentErrorContext,
                           stage: 'each data',
                           file: filePath,
                           details: dataPath,
                           context: localContext,
                        }, e)
                     }
                     localContext.data = []
                  }
               }
            }
         }

         dataArray = await evaluateExpression(arrExpr.trim(), localContext, isLogger, loggerPrefix, {
            ...currentErrorContext,
            expression: arrExpr.trim(),
         })

         if (!dataArray) {
            isLogger && logger(loggerPrefix, `Loop expression "${arrExpr}" evaluated to a falsy value.`, 'warn')
            return []
         }

         const isArrayData = Array.isArray(dataArray)
         const items = isArrayData ? dataArray : Object.entries(dataArray)
         const componentContext = baseOptions.componentChildContext
            ? {
               ...baseOptions.componentChildContext,
               ...(localContext.data !== undefined ? { data: localContext.data } : {}),
            }
            : localContext

         return await processLoopIteration(items, node, localContext, baseOptions, componentMap, {
            itemName, indexName, lengthName, isArray: isArrayData, componentContext
         })
      }

      // Обробка вкладеного контенту для звичайних тегів
      if (node.content) {
         if (Array.isArray(node.content)) {
            node.content = await Promise.all(node.content.map(processNode))
         } else {
            node.content = await processNode(node.content)
         }
      }

      return node
   }

   if (Array.isArray(tree)) {
      return await Promise.all(tree.map(processNode))
   }

   return await processNode(tree)
}

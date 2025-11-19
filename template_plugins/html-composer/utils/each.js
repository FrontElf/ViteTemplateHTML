import fs from 'fs/promises'
import path from 'path'
import { processExpressions, evalExpression } from './expressions.js'
import { logger } from './logger.js'
import { includeComponents } from './components.js'

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

async function evaluateExpression(expression, context, isLogger, loggerPrefix) {
   try {
      const func = new Function(...Object.keys(context), `return ${expression}`)
      return func(...Object.values(context))
   } catch (error) {
      isLogger && logger(loggerPrefix, `Error evaluating expression "${expression}": ${error.message}`, 'error')
      return null
   }
}

export async function processEach(tree, context, baseOptions = {}, componentMap) {
   const {
      isLogger = false,
      loggerPrefix = '[HTML-Each]'
   } = baseOptions.each

   async function processNode(node) {
      if (typeof node === 'string') {
         return node
      }

      if (!node || typeof node !== 'object') {
         return node
      }

      // Обробка вкладеного контенту спочатку
      if (node.content) {
         if (Array.isArray(node.content)) {
            node.content = await Promise.all(node.content.map(processNode))
         } else {
            node.content = await processNode(node.content)
         }
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
            const loopMatch = loopAttr.match(/^\s*([a-zA-Z_$][\w$]*)(?:\s*,\s*([a-zA-Z_$][\w$]*))?\s+in\s+__rangeData__\s*$/)
            if (loopMatch) {
               const [, itemName, indexName] = loopMatch
               const dataArray = node._rangeData
               const newContent = []

               for (const [index, item] of dataArray.entries()) {
                  const loopProps = { ...context }
                  loopProps[itemName] = item
                  if (indexName) loopProps[indexName] = index

                  const iterationContent = cloneAstNode(node.content || [])

                  let processedContent = await includeComponents(iterationContent, componentMap, loopProps, baseOptions)
                  processedContent = processExpressions(processedContent, loopProps, baseOptions)

                  if (Array.isArray(processedContent)) {
                     newContent.push(...processedContent)
                  } else if (processedContent) {
                     newContent.push(processedContent)
                  }
               }

               return newContent
            }
         }

         const loopMatch = loopAttr.match(/^\s*\(?\s*([a-zA-Z_$][\w$]*)(?:\s*,\s*([a-zA-Z_$][\w$]*))?(?:\s*,\s*([a-zA-Z_$][\w$]*))?\s*\)?\s+in\s+(.+)$/)
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
               dataPath = dataPath.replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
                  const result = evalExpression(expr.trim(), context, isLogger, loggerPrefix)
                  return (result === null || result === undefined) ? '' : result
               })
            }

            if (Array.isArray(dataPath) || typeof dataPath === 'object') {
               localContext.data = dataPath
            }

            else if (typeof dataPath === 'string' && /^https?:\/\//.test(dataPath)) {
               try {
                  const response = await fetch(dataPath)
                  localContext.data = await response.json()
                  isLogger && logger(loggerPrefix, `Loaded data from API "${dataPath}"`, 'info')
               } catch (e) {
                  isLogger && logger(loggerPrefix, `Failed to fetch API "${dataPath}": ${e.message}`, 'error')
                  localContext.data = []
               }
            }

            else if (typeof dataPath === 'string') {
               const filePath = path.isAbsolute(dataPath)
                  ? dataPath
                  : path.join(process.cwd(), 'src/data', dataPath)

               try {
                  const fileContent = await fs.readFile(filePath, 'utf8')
                  localContext.data = JSON.parse(fileContent)
                  isLogger && logger(loggerPrefix, `Loaded data from "${dataPath}"`, 'info')
               } catch (e) {
                  isLogger && logger(loggerPrefix, `Failed to read or parse data file "${filePath}": ${e.message}`, 'error')
                  localContext.data = []
               }
            }
         }

         dataArray = await evaluateExpression(arrExpr.trim(), localContext, isLogger, loggerPrefix)

         if (!dataArray) {
            isLogger && logger(loggerPrefix, `Loop expression "${arrExpr}" evaluated to a falsy value.`, 'warn')
            return []
         }

         const newContent = []
         const items = Array.isArray(dataArray) ? dataArray : Object.entries(dataArray)

         for (const [index, item] of items.entries()) {
            const loopProps = { ...localContext }

            if (Array.isArray(dataArray)) {
               loopProps[itemName] = item
               if (indexName) loopProps[indexName] = index
            } else {
               loopProps[itemName] = item[1]
               if (indexName) loopProps[indexName] = item[0]
            }

            if (lengthName) {
               loopProps[lengthName] = items.length
            }

            const iterationContent = cloneAstNode(node.content || [])

            let processedContent = await includeComponents(iterationContent, componentMap, loopProps, baseOptions)
            processedContent = processExpressions(processedContent, loopProps, baseOptions)

            if (Array.isArray(processedContent)) {
               newContent.push(...processedContent)
            } else if (processedContent) {
               newContent.push(processedContent)
            }
         }

         return newContent
      }

      return node
   }

   if (Array.isArray(tree)) {
      return await Promise.all(tree.map(processNode))
   }
   
   return await processNode(tree)
}

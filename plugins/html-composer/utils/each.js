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

function walk(tree, callback) {
   if (Array.isArray(tree)) {
      for (const node of tree) {
         callback(node)
         if (node.content) {
            walk(node.content, callback)
         }
      }
   } else {
      callback(tree)
      if (tree.content) {
         walk(tree.content, callback)
      }
   }
}

export async function processEach(tree, context, baseOptions = {}, componentMap) {
   const {
      isLogger = false,
      loggerPrefix = '[HTML-Each]'
   } = baseOptions.each

   const eachNodes = []
   walk(tree, node => {
      if (node.tag === 'each') {
         eachNodes.push(node)
      }
   })

   for (const node of eachNodes) {
      const loopAttr = node.attrs?.loop
      if (!loopAttr) {
         isLogger && logger(loggerPrefix, 'Missing "loop" attribute on <each> tag.', 'warn')
         continue
      }

      const loopMatch = loopAttr.match(/^\s*([a-zA-Z_$][\w$]*)(?:\s*,\s*([a-zA-Z_$][\w$]*))?(?:\s*,\s*([a-zA-Z_$][\w$]*))?\s+in\s+(.+)$/)
      if (!loopMatch) {
         isLogger && logger(loggerPrefix, `Invalid loop attribute format: "${loopAttr}"`, 'error')
         continue
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

      dataArray = await evaluateExpression(arrExpr, localContext, isLogger, loggerPrefix)

      if (!dataArray) {
         isLogger && logger(loggerPrefix, `Loop expression "${arrExpr}" evaluated to a falsy value.`, 'warn')
         continue
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

         const iterationContent = cloneAstNode(node.content)

         let processedContent = processExpressions(iterationContent, loopProps, baseOptions)
         processedContent = await includeComponents(processedContent, componentMap, loopProps, baseOptions)

         newContent.push(...processedContent)
      }

      node.tag = false
      node.content = newContent
      node.attrs = {}
   }

   return tree
}

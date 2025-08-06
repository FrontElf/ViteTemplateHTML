import fs from 'fs/promises'
import path from 'path'
import logger from '../logger.js'

/**
 * Processes <each> nodes in PostHTML tree for looping over data
 * @param {Object} node - PostHTML node to process
 * @param {Object} props - Properties for evaluating expressions
 * @param {Function} processNodes - Function to process child nodes
 * @param {Function} evalExpression - Function to evaluate expressions
 * @param {Object} options - Plugin configuration
 * @param {Object} options.loop - Loop settings (e.g., tagName, dataDir)
 * @returns {Promise<Array|null>} - Processed nodes or null if not an <each> node
 */
export async function processEachNode(node, props, processNodes, evalExpression, options = {}) {
   const pluginName = '[each-plugin]'
   const loopOpts = options.loop ?? {}
   const tagName = loopOpts.tagName ?? 'each'
   const dataDir = loopOpts.dataDir ?? 'src/data'

   if (node.tag !== tagName || !node.attrs?.loop) return null

   // Validate loop attribute format
   const loopMatch = node.attrs.loop.match(/^\s*([a-zA-Z_$][\w$]*)(?:\s*,\s*([a-zA-Z_$][\w$]*))?\s+in\s+(.+)$/) || []
   const [, itemName, keyName, arrExpr] = loopMatch
   if (!loopMatch) {
      logger(`${pluginName} Invalid loop attribute "${node.attrs.loop}"`, 'error')
      return []
   }

   let localProps = { ...props }

   // Handle data attribute (URL or file)
   if (node.attrs.data) {
      let dataValue = node.attrs.data
      const mustacheMatch = dataValue.match(/^\s*\{\{\s*(.+?)\s*\}\}\s*$/)
      if (mustacheMatch) {
         try {
            dataValue = await evalExpression(mustacheMatch[1], localProps)
         } catch (e) {
            logger(`${pluginName} Failed to evaluate data expression "${mustacheMatch[1]}" "${e.message}"`, 'error')
            localProps.data = []
         }
      }

      if (/^https?:\/\//.test(dataValue)) {
         try {
            const res = await fetch(dataValue)
            if (!res.ok) throw new Error(res.statusText)
            localProps.data = await res.json()
            logger(`${pluginName} Processed <each> loop "${dataValue}"`, 'info')
         } catch (e) {
            logger(`${pluginName} Failed to fetch data "${dataValue}" "${e.message}"`, 'error')
            localProps.data = []
         }
      } else {
         const filePath = path.join(process.cwd(), dataDir, dataValue)
         try {
            const fileContent = await fs.readFile(filePath, 'utf8')
            localProps.data = JSON.parse(fileContent)
            logger(`${pluginName} Processed <each> loop "${dataValue}"`, 'info')
         } catch (e) {
            logger(`${pluginName} Failed to read data file "${filePath}" "${e.message}"`, 'error')
            localProps.data = []
         }
      }
   }

   // Evaluate array expression
   let arr
   try {
      arr = await evalExpression(arrExpr, localProps)
   } catch (e) {
      logger(`${pluginName} Failed to evaluate loop expression "${arrExpr}" "${e.message}"`, 'error')
      return []
   }

   const promises = []

   // Process object or array
   if (arr && typeof arr === 'object' && !Array.isArray(arr)) {
      const entries = Object.entries(arr)
      for (const [key, value] of entries) {
         const loopProps = {
            ...localProps,
            [itemName]: value,
            ...(keyName ? { [keyName]: key } : {}),
            length: entries.length,
         }

         // Avoid deep cloning if possible
         const children = node.content?.map((child) =>
            typeof child === 'string' ? child : { ...child }
         )
         if (children) promises.push(processNodes(children, loopProps))
      }
   } else if (Array.isArray(arr)) {
      for (let idx = 0; idx < arr.length; idx++) {
         const loopProps = {
            ...localProps,
            [itemName]: arr[idx],
            ...(keyName ? { [keyName]: idx } : {}),
            length: arr.length,
         }

         // Avoid deep cloning if possible
         const children = node.content?.map((child) =>
            typeof child === 'string' ? child : { ...child }
         )
         if (children) promises.push(processNodes(children, loopProps))
      }
   } else {
      logger(`${pluginName} Invalid loop data for "${arrExpr}"`, 'error')
      return []
   }

   return (await Promise.all(promises)).flat()
}
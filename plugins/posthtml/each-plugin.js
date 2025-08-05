import fs from 'fs/promises'
import path from 'path'

export async function processEachNode(node, props, processNodes, evalExpression, options = {}) {
   const pluginName = '[each-plugin]'
   const loopOpts = options.loop ?? {}
   const tagName = loopOpts.tagName ?? 'each'
   const dataDir = loopOpts.dataDir ?? 'src/data'
   const logger = options.logger ?? console
   const isLogger = options.isLogger ?? true

   if (node.tag !== tagName || !node.attrs?.loop) return null

   let localProps = { ...props }

   if (node.attrs.data) {
      let dataValue = node.attrs.data
      const mustacheMatch = dataValue.match(/^\s*\{\{\s*(.+?)\s*\}\}\s*$/)
      if (mustacheMatch) {
         dataValue = await evalExpression(mustacheMatch[1], localProps)
      }

      if (/^https?:\/\//.test(dataValue)) {
         try {
            const res = await fetch(dataValue)
            if (!res.ok) throw new Error(res.statusText)
            localProps.data = await res.json()
         } catch (e) {
            if (isLogger) logger.warn(`${pluginName} ⚠️ Не вдалось отримати data з ${dataValue}`)
            localProps.data = []
         }
      } else {
         const filePath = path.join(process.cwd(), dataDir, dataValue)
         try {
            const fileContent = await fs.readFile(filePath, 'utf8')
            localProps.data = JSON.parse(fileContent)
         } catch (e) {
            if (isLogger) logger.warn(`${pluginName} ⚠️ Не вдалось прочитати data файл: ${filePath}`)
            localProps.data = []
         }
      }
   }

   const loopMatch = node.attrs.loop.match(/^\s*([a-zA-Z_$][\w$]*)(?:\s*,\s*([a-zA-Z_$][\w$]*))?\s+in\s+(.+)$/)
   if (!loopMatch) return []

   const [, itemName, keyName, arrExpr] = loopMatch
   let arr = await evalExpression(arrExpr, localProps)
   const promises = []

   if (arr && typeof arr === 'object' && !Array.isArray(arr)) {
      const entries = Object.entries(arr)
      for (const [key, value] of entries) {
         const loopProps = {
            ...localProps,
            [itemName]: value,
            ...(keyName ? { [keyName]: key } : {}),
            length: entries.length
         }

         const children = node.content?.map(child =>
            typeof child === 'string' ? child : JSON.parse(JSON.stringify(child))
         )
         if (children) promises.push(processNodes(children, loopProps))
      }
   } else if (Array.isArray(arr)) {
      for (let idx = 0; idx < arr.length; idx++) {
         const loopProps = {
            ...localProps,
            [itemName]: arr[idx],
            ...(keyName ? { [keyName]: idx } : {}),
            length: arr.length
         }

         const children = node.content?.map(child =>
            typeof child === 'string' ? child : JSON.parse(JSON.stringify(child))
         )
         if (children) promises.push(processNodes(children, loopProps))
      }
   }

   return (await Promise.all(promises)).flat()
}

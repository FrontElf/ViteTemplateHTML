import { logger } from './logger.js'

export function moveStylesToHead(tree, baseOptions = {}) {
   const {
      isLogger = false,
      loggerPrefix = '[HTML-Styles]'
   } = baseOptions.stylesToHead || {}

   if (!Array.isArray(tree)) return tree

   const collected = new Map()

   function walk(nodes, insideHead = false) {
      if (!Array.isArray(nodes)) return
      for (let i = 0; i < nodes.length; i++) {
         const node = nodes[i]
         if (!node || typeof node === 'string') continue

         if (node.tag === 'head') {
            walk(node.content, true)
         } else {
            if (node.tag === 'link' && node.attrs?.rel === 'stylesheet') {
               const href = node.attrs?.href
               if (href) {
                  collected.set(href, node)
                  if (!insideHead) {
                     nodes.splice(i, 1)
                     i--
                     isLogger && logger(loggerPrefix, `Found stylesheet outside <head>: ${href}`, 'info')
                  }
               }
            }

            if (node.content) walk(node.content, insideHead)
         }
      }
   }

   walk(tree)

   if (collected.size > 0) {
      const htmlNode = tree.find(n => n?.tag === 'html')
      const headNode = htmlNode?.content?.find(n => n?.tag === 'head')

      if (headNode) {
         const existing = new Set(
            (headNode.content || [])
               .filter(n => n.tag === 'link' && n.attrs?.rel === 'stylesheet')
               .map(n => n.attrs.href)
         )

         let added = 0
         for (const [href, node] of collected) {
            if (!existing.has(href)) {
               headNode.content.push(node)
               existing.add(href)
               added++
               isLogger && logger(loggerPrefix, `Moved stylesheet to <head>: ${href}`, 'success')
            } else {
               isLogger && logger(loggerPrefix, `Skipped duplicate stylesheet: ${href}`, 'warning')
            }
         }

         isLogger && logger(loggerPrefix, `Total collected: ${collected.size}, added to <head>: ${added}`, 'rocket')
      } else {
         isLogger && logger(loggerPrefix, '<head> tag not found — styles remain in place', 'warning')
      }
   }

   return tree
}

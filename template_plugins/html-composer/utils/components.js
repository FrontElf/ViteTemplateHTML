import { promises as fs } from 'fs'
import { parser } from 'posthtml-parser'
import { logger } from './logger.js'
import { processConditions } from './conditions.js'
import { processExpressions, evalExpression } from './expressions.js'
import { processEach } from './each.js'
import { processVueDirectives } from './vueDirectives.js'

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

export function fixSelfClosingComponents(html, componentTags) {
   return componentTags.reduce((result, tag) => {
      const regex = new RegExp(`<${tag}((\\s+[^>]*)?)\\s*/>`, 'g')
      return result.replace(regex, `<${tag}$1></${tag}>`)
   }, html)
}

function processComponentLocals(componentContent, availableContext, isLogger, loggerPrefix) {
   const scriptRegex = /\u003cscript\s+define\u003e([\s\S]*?)\u003c\/script\u003e/
   const scriptMatch = componentContent.match(scriptRegex)
   let localContext = {}
   let content = componentContent

   if (scriptMatch) {
      const scriptContent = scriptMatch[1]
      content = componentContent.replace(scriptRegex, '').trim()

      try {
         // Видаляємо коментарі перед пошуком змінних
         const scriptWithoutComments = scriptContent
            .replace(/\/\*[\s\S]*?\*\//g, '') // Видаляємо багаторядкові коментарі /* */
            .replace(/\/\/.*/g, '') // Видаляємо однорядкові коментарі //

         const varRegex = /(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=/g
         const varNames = []
         let match
         while ((match = varRegex.exec(scriptWithoutComments)) !== null) {
            varNames.push(match[1])
         }

         if (varNames.length > 0) {
            // Передаємо availableContext (пропси + глобальні змінні) як параметри функції
            const contextKeys = Object.keys(availableContext)
            const contextValues = Object.values(availableContext)
            const scriptFunc = new Function(...contextKeys, `${scriptContent}; return { ${varNames.join(', ')} };`)
            Object.assign(localContext, scriptFunc(...contextValues))
            isLogger && logger(loggerPrefix, `Evaluated \u003cscript define\u003e: ${scriptContent}`, 'info')
         }
      } catch (e) {
         isLogger && logger(loggerPrefix, `Error evaluating \u003cscript define\u003e: ${e.message}`, 'error')
      }
   }

   return { content, localContext }
}

export async function includeComponents(tree, componentMap, context, baseOptions, depth = 0) {
   const { encoding = 'utf-8' } = baseOptions
   const {
      maxDepth = 10,
      isLogger = false,
      loggerPrefix = '[HTML-Components]',
      isNotFound = true,
      isNotFoundCompact = false
   } = baseOptions.components

   if (depth > maxDepth) {
      isLogger && logger(loggerPrefix, `Max component depth (${maxDepth}) reached`, 'warn')
      return tree
   }

   if (Array.isArray(tree)) {
      const newTree = []
      for (const node of tree) {
         const result = await includeComponents(node, componentMap, context, baseOptions, depth)
         if (Array.isArray(result)) {
            newTree.push(...result)
         } else if (result) {
            newTree.push(result)
         }
      }
      return newTree
   }

   if (tree?.tag) {
      if (componentMap[tree.tag]) {
         const fileContent = await fs.readFile(componentMap[tree.tag], encoding)

         const childrenNodes = tree.content
            ? await includeComponents(cloneAstNode(tree.content), componentMap, context, baseOptions, depth)
            : []

         const params = tree.attrs || {}

         // Конвертуємо рядкові значення "true"/"false" в булеві
         const normalizedParams = {}

         for (const [key, value] of Object.entries(params)) {
            if (value === 'true') {
               normalizedParams[key] = true
            } else if (value === 'false') {
               normalizedParams[key] = false
            } else {
               normalizedParams[key] = value
            }
         }

         // Оцінюємо рядки, що починаються з { або [, як JavaScript-вирази
         for (const [key, val] of Object.entries(normalizedParams)) {
            if (typeof val === 'string' && (val.trim().startsWith('{') || val.trim().startsWith('['))) {
               const evaluated = evalExpression(val.trim(), context, isLogger, loggerPrefix)
               if (evaluated !== null && evaluated !== undefined) {
                  normalizedParams[key] = evaluated
               }
            }
         }

         // Створюємо контекст доступний для <script define>: глобальний контекст + пропси + children
         const availableContext = { ...context, ...normalizedParams, children: childrenNodes }

         // Обробляємо <script define> з доступом до контексту
         const { content, localContext } = processComponentLocals(fileContent, availableContext, isLogger, loggerPrefix)

         // Змінні з контексту (як user, index з циклів) мають бути доступні в компоненті
         // Атрибути компонента перезаписують змінні з контексту, якщо вони вказані явно
         const componentContext = { ...context, ...localContext, ...normalizedParams, children: childrenNodes }

         let parsed = parser(fixSelfClosingComponents(content, Object.keys(componentMap)))

         parsed = processVueDirectives(parsed, componentContext, baseOptions)
         parsed = processConditions(parsed, componentContext, baseOptions)
         parsed = await processEach(parsed, componentContext, baseOptions, componentMap)
         parsed = processExpressions(parsed, componentContext, baseOptions)

         return await includeComponents(parsed, componentMap, componentContext, baseOptions, depth + 1)
      } else if (tree.tag.match(/^[A-Z]/)) {
         const notFoundMessage = isNotFound ? getNotFoundMessage(tree.tag, isNotFoundCompact) : ''
         const processedContent = tree.content
            ? await includeComponents(tree.content, componentMap, context, baseOptions, depth)
            : []
         return [notFoundMessage, ...processedContent]
      }
   }

   if (tree?.content) {
      tree.content = await includeComponents(tree.content, componentMap, context, baseOptions, depth)
   }

   return tree
}

function styleObjToString(styles) {
   return Object.entries(styles).map(([key, value]) => key.replace(/[A-Z]/g, m => '-' + m.toLowerCase()) + ':' + value).join('; ')
}

function getNotFoundMessage(tag, isNotFoundCompact) {
   const strongTag = { tag: 'strong', content: [`&lt;${tag} /&gt;`] }

   const styles = {
      padding: isNotFoundCompact ? '6px 10px' : '12px 16px',
      borderRadius: isNotFoundCompact ? '5px' : '8px',
      margin: '6px 6px',
      backgroundColor: '#ffe5e5',
      border: '1px solid #fdd',
      backgroundImage: 'url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/Pgo8c3ZnIHdpZHRoPSI4MDBweCIgaGVpZ2h0PSI4MDBweCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik03Ljk1MjA2IDE2LjA0OEwxNi4wNzY5IDcuOTIyOTciIHN0cm9rZT0iIzViMGQwMCIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTE2LjA5MTQgMTYuMDMzNkw3LjkwODg0IDcuODUxMDEiIHN0cm9rZT0iIzViMGQwMCIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTEyIDIxQzE2Ljk3MDYgMjEgMjEgMTYuOTcwNiAyMSAxMkMyMSA3LjAyOTQ0IDE2Ljk3MDYgMyAxMiAzQzcuMDI5NDQgMyAzIDcuMDI5NDQgMyAxMkMzIDE2Ljk3MDYgNy4wMjk0NCAyMSAxMiAyMVoiIHN0cm9rZT0iIzViMGQwMCIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+")',
      backgroundSize: '20px',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: '14px center',
      paddingLeft: '40px',
      fontSize: '14px',
      lineHeight: '1.4',
      color: '#7a1d1d',
      fontFamily: 'Arial, sans-serif',
      boxShadow: '0 3px 4px rgba(0, 0, 0, 0.1)',
      maxWidth: isNotFoundCompact ? 'max-content' : '100%',
   }

   return {
      tag: 'div',
      attrs: { style: styleObjToString(styles) },
      content: isNotFoundCompact
         ? [strongTag]
         : ['Component ', strongTag, ' not found!']
   }
}

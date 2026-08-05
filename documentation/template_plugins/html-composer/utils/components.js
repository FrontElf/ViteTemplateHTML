import { promises as fs } from 'fs'
import { parser } from 'posthtml-parser'
import * as acorn from 'acorn'
import { logger } from './logger.js'
import { processConditions } from './conditions.js'
import { processExpressions, evalExpression } from './expressions.js'
import { processEach } from './each.js'
import { processVueDirectives } from './vueDirectives.js'
import { createContextError, pushTrace } from './errorContext.js'

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

function collectPatternNames(pattern, names) {
   if (!pattern) return

   if (pattern.type === 'Identifier') {
      names.push(pattern.name)
      return
   }

   if (pattern.type === 'RestElement') {
      collectPatternNames(pattern.argument, names)
      return
   }

   if (pattern.type === 'AssignmentPattern') {
      collectPatternNames(pattern.left, names)
      return
   }

   if (pattern.type === 'ArrayPattern') {
      for (const element of pattern.elements) {
         collectPatternNames(element, names)
      }
      return
   }

   if (pattern.type === 'ObjectPattern') {
      for (const property of pattern.properties) {
         if (property.type === 'Property') {
            collectPatternNames(property.value, names)
         } else if (property.type === 'RestElement') {
            collectPatternNames(property.argument, names)
         }
      }
   }
}

function getDeclaredVariableNames(scriptContent) {
   const ast = acorn.parse(scriptContent, {
      ecmaVersion: 'latest',
      sourceType: 'script',
   })
   const varNames = []

   for (const node of ast.body) {
      if (node.type !== 'VariableDeclaration') continue
      for (const declaration of node.declarations) {
         collectPatternNames(declaration.id, varNames)
      }
   }

   return [...new Set(varNames)]
}

function createContextProxy(context) {
   return new Proxy({ ...context, props: context }, {
      has(target, key) {
         if (key in target) return true

         try {
            if (global[key] !== undefined) return false
         } catch (e) { }

         return true
      },
      get(target, key) {
         if (key in target) return target[key]
         return undefined
      }
   })
}

function shouldRenderComponentTrace(baseOptions) {
   const mode = baseOptions.componentsTrace
   if (!mode) return false
   if (mode === 'all') return true
   return mode === 'dev' && process.env.NODE_ENV !== 'production'
}

function createComponentTraceComment(type, componentName, componentFile, depth) {
   return `<!-- fe-component-${type}: ${componentName} | ${componentFile} | depth:${depth} -->`
}

function splitSlots(nodes = []) {
   const slots = {}
   const defaultChildren = []

   for (const node of nodes) {
      if (node?.tag === 'template' && node.attrs?.slot) {
         const slotName = node.attrs.slot
         const slotContent = cloneAstNode(node.content || [])
         slots[slotName] = slots[slotName]
            ? [...slots[slotName], ...slotContent]
            : slotContent
         continue
      }

      defaultChildren.push(node)
   }

   return { children: defaultChildren, slots }
}

async function processProjectedContent(nodes, componentMap, context, baseOptions, depth) {
   let processed = cloneAstNode(nodes || [])
   processed = processVueDirectives(processed, context, baseOptions)
   processed = processConditions(processed, context, baseOptions)
   processed = await processEach(processed, context, baseOptions, componentMap)
   processed = await includeComponents(processed, componentMap, context, baseOptions, depth)
   return processExpressions(processed, context, baseOptions)
}

async function processSlots(slots, componentMap, context, baseOptions, depth) {
   const processedSlots = {}

   for (const [slotName, slotContent] of Object.entries(slots)) {
      processedSlots[slotName] = await processProjectedContent(slotContent, componentMap, context, baseOptions, depth)
   }

   return processedSlots
}

function renderSlotNodes(tree, slots = {}) {
   if (Array.isArray(tree)) {
      const renderedNodes = []
      for (const node of tree) {
         const rendered = renderSlotNodes(node, slots)
         if (Array.isArray(rendered)) {
            renderedNodes.push(...rendered)
         } else if (rendered) {
            renderedNodes.push(rendered)
         }
      }
      return renderedNodes
   }

   if (!tree || typeof tree !== 'object') {
      return tree
   }

   if (tree.tag === 'slot') {
      const slotName = tree.attrs?.name || 'default'
      const slotContent = slots[slotName]
      if (Array.isArray(slotContent) && slotContent.length > 0) {
         return cloneAstNode(slotContent)
      }
      if (slotContent) {
         return cloneAstNode(slotContent)
      }
      return cloneAstNode(tree.content || [])
   }

   if (tree.content) {
      tree.content = renderSlotNodes(tree.content, slots)
   }

   return tree
}

function normalizePropValue(value) {
   if (value === 'true') return true
   if (value === 'false') return false
   return value
}

function splitComponentParams(params = {}) {
   const localParams = {}
   const deepParams = {}

   for (const [key, value] of Object.entries(params)) {
      if (key.startsWith('deep:')) {
         const deepKey = key.slice('deep:'.length)
         if (deepKey) {
            deepParams[deepKey] = normalizePropValue(value)
         }
         continue
      }

      localParams[key] = normalizePropValue(value)
   }

   return { localParams, deepParams }
}

function evaluateStructuredParams(params, context, isLogger, loggerPrefix, errorContext) {
   const evaluatedParams = { ...params }

   for (const [key, val] of Object.entries(evaluatedParams)) {
      if (typeof val === 'string' && (val.trim().startsWith('{') || val.trim().startsWith('['))) {
         const evaluated = evalExpression(val.trim(), context, isLogger, loggerPrefix, {
            ...errorContext,
            stage: 'component prop',
            expression: val.trim(),
         })
         if (evaluated !== null && evaluated !== undefined) {
            evaluatedParams[key] = evaluated
         }
      }
   }

   return evaluatedParams
}

export function fixSelfClosingComponents(html, componentTags) {
   return componentTags.reduce((result, tag) => {
      const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`<${escapedTag}((\\s+[^>]*)?)\\s*/>`, 'g')
      return result.replace(regex, `<${tag}$1></${tag}>`)
   }, html)
}

function processComponentLocals(componentContent, availableContext, isLogger, loggerPrefix, errorContext = {}) {
   const scriptRegex = /\u003cscript\s+define\u003e([\s\S]*?)\u003c\/script\u003e/
   const scriptMatch = componentContent.match(scriptRegex)
   let localContext = {}
   let content = componentContent

   if (scriptMatch) {
      const scriptContent = scriptMatch[1]
      content = componentContent.replace(scriptRegex, '').trim()

      try {
         const varNames = getDeclaredVariableNames(scriptContent)

         if (varNames.length > 0) {
            const contextProxy = createContextProxy(availableContext)
            const scriptFunc = new Function('context', `with(context) { ${scriptContent}; return { ${varNames.join(', ')} }; }`)
            Object.assign(localContext, scriptFunc(contextProxy))
            isLogger && logger(loggerPrefix, `Evaluated \u003cscript define\u003e: ${scriptContent}`, 'info')
         }
      } catch (e) {
         const contextualError = createContextError('Error evaluating <script define>', {
            stage: 'script define',
            context: availableContext,
            ...errorContext,
         }, e)
         isLogger && logger(loggerPrefix, contextualError.message, 'error')
         if (process.env.NODE_ENV === 'production') {
            throw contextualError
         }
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
         const componentFile = componentMap[tree.tag]
         const componentErrorContext = {
            stage: 'component',
            component: tree.tag,
            file: componentFile,
            context,
            trace: baseOptions.contextTrace,
         }
         const componentOptions = pushTrace({
            ...baseOptions,
            errorContext: componentErrorContext,
         }, {
            stage: 'component',
            component: tree.tag,
            file: componentFile,
         })
         const fileContent = await fs.readFile(componentFile, encoding)

         const rawProjectionNodes = tree.content ? cloneAstNode(tree.content) : []
         const { children: rawChildrenNodes, slots: rawSlots } = splitSlots(rawProjectionNodes)

         const { localParams: rawLocalParams, deepParams: rawDeepParams } = splitComponentParams(tree.attrs || {})
         const localParams = evaluateStructuredParams(rawLocalParams, context, isLogger, loggerPrefix, componentErrorContext)
         const deepParams = evaluateStructuredParams(rawDeepParams, context, isLogger, loggerPrefix, componentErrorContext)

         // Створюємо контекст доступний для <script define>: глобальний контекст + пропси + children
         const availableContext = { ...context, ...deepParams, ...localParams, children: rawChildrenNodes, slots: rawSlots }

         // Обробляємо <script define> з доступом до контексту
         const { content, localContext } = processComponentLocals(fileContent, availableContext, isLogger, loggerPrefix, componentErrorContext)

         // Змінні з <script define> приватні для поточного компонента.
         // Звичайні props видимі тільки поточному компоненту, deep:* props прокидаються нижче.
         const projectionContext = { ...context, ...deepParams, ...localParams }
         const childContext = { ...context, ...deepParams }
         const childrenNodes = await processProjectedContent(rawChildrenNodes, componentMap, projectionContext, componentOptions, depth)
         const slots = await processSlots(rawSlots, componentMap, projectionContext, componentOptions, depth)
         const componentContext = { ...projectionContext, ...localContext, children: childrenNodes, slots }
         const childComponentContext = { ...childContext, children: childrenNodes, slots }

         let parsed = parser(fixSelfClosingComponents(content, Object.keys(componentMap)))

         parsed = processVueDirectives(parsed, componentContext, componentOptions)
         parsed = processConditions(parsed, componentContext, componentOptions)
         parsed = await processEach(parsed, componentContext, {
            ...componentOptions,
            componentChildContext: childComponentContext,
         }, componentMap)
         parsed = renderSlotNodes(parsed, slots)
         parsed = processExpressions(parsed, componentContext, componentOptions)

         const processedComponent = await includeComponents(parsed, componentMap, childComponentContext, componentOptions, depth + 1)

         if (shouldRenderComponentTrace(baseOptions)) {
            return [
               createComponentTraceComment('start', tree.tag, componentFile, depth),
               ...(Array.isArray(processedComponent) ? processedComponent : [processedComponent]),
               createComponentTraceComment('end', tree.tag, componentFile, depth),
            ]
         }

         return processedComponent
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

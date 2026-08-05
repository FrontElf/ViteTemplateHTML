export function createErrorContext(options = {}) {
   return {
      file: options.file || null,
      component: options.component || null,
      stage: options.stage || null,
      expression: options.expression || null,
      details: options.details || null,
      context: options.context || null,
      trace: options.trace || [],
   }
}

export function pushTrace(baseOptions, entry) {
   const currentTrace = baseOptions.contextTrace || []
   return {
      ...baseOptions,
      contextTrace: [...currentTrace, entry],
   }
}

export function formatErrorContext(message, context = {}) {
   const lines = [message]

   if (context.stage) lines.push(`Stage: ${context.stage}`)
   if (context.component) lines.push(`Component: ${context.component}`)
   if (context.file) lines.push(`File: ${context.file}`)
   if (context.expression) lines.push(`Expression: ${context.expression}`)
   if (context.details) lines.push(`Details: ${context.details}`)
   if (context.causeMessage) lines.push(`Cause: ${context.causeMessage}`)

   const hasContextObject = context.context && typeof context.context === 'object'
   const contextKeys = hasContextObject ? Object.keys(context.context).sort() : []

   if (hasContextObject) {
      lines.push(`Context keys: ${contextKeys.length > 0 ? contextKeys.join(', ') : '(none)'}`)
   }

   if (Array.isArray(context.trace) && context.trace.length > 0) {
      lines.push('Trace:')
      for (const item of context.trace) {
         const file = item.file ? ` (${item.file})` : ''
         lines.push(`  - ${item.component || item.stage || 'unknown'}${file}`)
      }
   }

   return lines.join('\n')
}

export function createContextError(message, context = {}, cause = null) {
   const errorContext = cause?.message && !context.causeMessage
      ? { ...context, causeMessage: cause.message }
      : context
   const error = new Error(formatErrorContext(message, errorContext))
   error.context = errorContext
   if (cause) error.cause = cause
   return error
}

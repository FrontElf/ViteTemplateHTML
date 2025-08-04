const logSymbols = {
  success: '✅',
  info: '🚩',
  rocket: '🚀',
  warning: '❗',
  error: '❌',
  clock: '⌛',
  question: '👀',
  alarm: '🚨',
  star: '🌟',
}

const logger = (message, logSymbol) => {
  /**
   * Icon of log message
   * @type {string}
   */
  const iconType = logSymbols[logSymbol]
  console.log(`\n  ${iconType} ${message}\n`)
}

export default logger
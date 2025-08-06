import chalk from 'chalk'
import templateCfg from '../template.config.js'

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

const logColors = {
  success: chalk.green,
  info: chalk.blue,
  rocket: chalk.cyan,
  warning: chalk.yellow,
  error: chalk.red,
  clock: chalk.gray,
  question: chalk.magenta,
  alarm: chalk.redBright,
  star: chalk.yellowBright,
}

/**
 * Logs a message to the console with an icon and optional additional data
 * @param {string} message - The main log message
 * @param {string} [type='info'] - The type of log (success, info, rocket, warning, error, clock, question, alarm, star)
 * @param {Object} [extra] - Additional data to log (e.g., error stack or JSON object)
 */
const logger = (message, type = 'info', extra = null) => {
  const icon = logSymbols[type] || logSymbols.info // Default to info if type is invalid
  const color = logColors[type] || logColors.info // Default to info color
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false })
  const isLogger = templateCfg.isLogger || false

  // Format the main message
  const formattedMessage = `[${timestamp}] ${icon} ${message}`
  if (isLogger) {
    console.log(color ? color(formattedMessage) : formattedMessage)
  } else {
    if (type === 'error') {
      console.log(color ? color(formattedMessage) : formattedMessage)
    }
  }

  // Log extra data if provided
  if (extra) {
    if (isLogger) {
      console.log(color ? color(JSON.stringify(extra, null, 2)) : JSON.stringify(extra, null, 2))
    } else {
      if (type === 'error') {
        console.log(color ? color(JSON.stringify(extra, null, 2)) : JSON.stringify(extra, null, 2))
      }
    }
  }
}

export default logger
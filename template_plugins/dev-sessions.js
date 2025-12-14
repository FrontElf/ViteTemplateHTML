import fs from 'fs'
import path from 'path'
import { logger } from './html-composer/utils/logger.js'

const sessionsDir = path.resolve(process.cwd(), 'template_plugins/sessions')
const sessionsFile = path.resolve(sessionsDir, 'sessions.json')
const lockFile = path.resolve(sessionsDir, '.session-lock')
const pluginName = '[dev-sessions-plugin]'

let session = null
let pluginInitialized = false
let isFinalized = false

const ensureDir = () => {
   if (!fs.existsSync(sessionsDir)) {
      fs.mkdirSync(sessionsDir, { recursive: true })
   }
}

const readJson = (file, fallback = []) => {
   if (!fs.existsSync(file)) return fallback
   try {
      const raw = fs.readFileSync(file, 'utf-8').trim()
      if (!raw) return fallback
      return JSON.parse(raw)
   } catch (err) {
      console.error(`${pluginName} Пошкоджений JSON → скидання: ${file}`)
      fs.writeFileSync(file, JSON.stringify(fallback, null, 2))
      return fallback
   }
}

const writeJson = (file, data) => {
   ensureDir()
   fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8')
}

const formatDate = (ts) => {
   const d = new Date(ts)
   const day = String(d.getDate()).padStart(2, '0')
   const month = String(d.getMonth() + 1).padStart(2, '0')
   const year = d.getFullYear()
   return `${day}.${month}.${year}`
}

function finalizeSession() {
   if (!session || isFinalized) return
   isFinalized = true

   session.end = Date.now()
   session.date = formatDate(session.start)

   const mins = Math.round((session.end - session.start) / 60000)

   try {
      if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile)
   } catch (e) {
      console.error('Помилка видалення файлу блокування:', e)
   }

   try {
      const sessions = readJson(sessionsFile)
      sessions.push({
         date: session.date,
         start: session.start,
         end: session.end
      })
      writeJson(sessionsFile, sessions)
      logger(pluginName, `Сесію завершено: ${mins} хв`, 'info')
   } catch (e) {
      console.error('Помилка збереження сеансу:', e)
   }

   session = null
}

function startSessionTracking() {
   if (pluginInitialized) return
   pluginInitialized = true

   ensureDir()

   if (fs.existsSync(lockFile)) {
      try {
         const rawLock = fs.readFileSync(lockFile, 'utf-8').trim()
         const startTime = Number(rawLock)
         if (startTime && !isNaN(startTime) && Date.now() - startTime < 86_400_000) {
            session = {
               id: `${startTime}-persisted`,
               start: startTime,
               project: path.basename(process.cwd()),
               recovered: true
            }
            const recoveredMins = Math.round((Date.now() - startTime) / 60000)
            logger(pluginName, `Сесію відновлено після збою: ${recoveredMins} хв`, 'info')
         }
      } catch (e) {
         logger(pluginName, `Помилка файлу блокування: ${e.message}`, 'error')
      }
   }

   if (!session) {
      const startTime = Date.now()
      session = {
         id: `${startTime}-${process.pid}`,
         start: startTime,
         project: path.basename(process.cwd())
      }
      fs.writeFileSync(lockFile, String(startTime), 'utf-8')
      logger(pluginName, `Сесію розпочато · ${session.project}`, 'rocket')
   }

   const handleSignal = (signal) => {
      finalizeSession()
      process.exit(0)
   }

   process.on('SIGHUP', () => handleSignal('SIGHUP'))
   process.on('SIGINT', () => handleSignal('SIGINT'))
   process.on('SIGTERM', () => handleSignal('SIGTERM'))
   process.on('SIGUSR2', () => {
      finalizeSession()
      process.kill(process.pid, 'SIGUSR2')
   })

   process.on('exit', finalizeSession)

   process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err)
      finalizeSession()
      process.exit(1)
   })
}

export default function devSessionsPlugin() {
   return {
      name: 'vite-plugin-dev-sessions',

      configureServer(server) {
         server.httpServer?.on('close', () => {
            finalizeSession()
         })
      },

      configResolved(config) {
         const isDevMode = config.command === 'serve' && config.mode !== 'production'
         if (!isDevMode) return
         startSessionTracking()
      },
   }
}
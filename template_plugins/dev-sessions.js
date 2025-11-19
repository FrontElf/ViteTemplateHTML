import fs from 'fs'
import path from 'path'
import { logger } from './html-composer/utils/logger.js'

const sessionsDir = path.resolve(process.cwd(), 'template_plugins/sessions')
const sessionsFile = path.resolve(sessionsDir, 'sessions.json')
const lockFile = path.resolve(sessionsDir, '.session-lock')
const pluginName = '[dev-sessions-plugin]'

let session = null
let pluginInitialized = false

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
      logger(pluginName, `Damaged JSON → reset: ${file}`, 'error')
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
   if (!session) return
   session.end = Date.now()
   session.date = formatDate(session.start)

   const mins = Math.round((session.end - session.start) / 60000)
   logger(pluginName, `Session ended: ${mins} mins`, 'info')

   try { fs.unlinkSync(lockFile) } catch { }

   const sessions = readJson(sessionsFile)
   sessions.push({
      date: session.date,
      start: session.start,
      end: session.end
   })
   writeJson(sessionsFile, sessions)
   session = null
}

function startSessionTracking() {
   if (pluginInitialized) return
   pluginInitialized = true

   ensureDir()

   if (fs.existsSync(lockFile)) {
      try {
         const startTime = Number(fs.readFileSync(lockFile, 'utf-8').trim())
         if (startTime && Date.now() - startTime < 86_400_000) {
            session = {
               id: `${startTime}-persisted`,
               start: startTime,
               project: path.basename(process.cwd()),
               recovered: true
            }
            logger(pluginName, `Session resumed after crash: ${Math.round((Date.now() - startTime) / 60000)} хв`, 'info')
            return
         }
      } catch (e) {
         logger(pluginName, `Lock file error: ${e.message}`, 'error')
      }
   }

   // нова сесія
   const startTime = Date.now()
   session = {
      id: `${startTime}-${process.pid}`,
      start: startTime,
      project: path.basename(process.cwd())
   }
   fs.writeFileSync(lockFile, String(startTime), 'utf-8')
   logger(pluginName, `Session started · ${session.project}`, 'rocket')

   process.once('beforeExit', finalizeSession)
   process.once('SIGINT', () => { finalizeSession(); setImmediate(() => process.exit()) })
   process.once('SIGTERM', () => { finalizeSession(); setImmediate(() => process.exit()) })
   process.once('SIGUSR2', finalizeSession)
   process.on('uncaughtException', (err) => { finalizeSession(); throw err })
   process.on('unhandledRejection', finalizeSession)
}

export default function devSessionsPlugin() {
   return {
      name: 'vite-plugin-dev-sessions',
      configResolved(config) {
         const isDevMode = config.command === 'serve' && config.mode !== 'production'
         if (!isDevMode) return
         startSessionTracking()
      },
   }
}
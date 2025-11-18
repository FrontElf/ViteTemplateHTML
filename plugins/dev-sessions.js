import fs from 'fs'
import path from 'path'
const sessionsDir = path.resolve(process.cwd(), 'sessions')
const sessionsFile = path.resolve(sessionsDir, 'sessions.json')
const lockFile = path.resolve(sessionsDir, '.session-lock')
import { logger } from './html-composer/utils/logger.js'

const pluginName = '[dev-sessions-plugin]'

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

let pluginInitialized = false

export default function devSessionsPlugin() {
   if (pluginInitialized) {
      return { name: 'vite-plugin-dev-sessions (already active)' }
   }
   pluginInitialized = true

   let session = null

   if (fs.existsSync(lockFile)) {
      try {
         const startTime = Number(fs.readFileSync(lockFile, 'utf-8').trim())
         if (startTime && Date.now() - startTime < 86_400_000) { // < 24 год
            const mins = Math.round((Date.now() - startTime) / 60000)
            const recovered = {
               start: startTime,
               end: Date.now(),
               project: path.basename(process.cwd()),
               recovered: true,
               note: `recovered from the crash (~${mins} хв)`,
            }
            const sessions = readJson(sessionsFile)
            sessions.push(recovered)
            writeJson(sessionsFile, sessions)
            logger(pluginName, `Session resumed after crash: ${mins} хв`, 'info')
         }
      } catch (e) {
         logger(pluginName, `Lock file error: ${e.message}`, 'error')
      } finally {
         try { fs.unlinkSync(lockFile) } catch { }
      }
   }

   const startTime = Date.now()
   session = {
      id: `${startTime}-${process.pid}`,
      start: startTime,
      project: path.basename(process.cwd()),
   }

   try {
      fs.writeFileSync(lockFile, String(startTime), 'utf-8')
   } catch (e) {
      logger(pluginName, `Failed to create lock file`, 'warning')
   }

   logger(pluginName, `Session started · ${session.project}`, 'rocket')

   const finalizeSession = (() => {
      let called = false
      return () => {
         if (called || !session) return
         called = true

         session.end = Date.now()
         const mins = Math.round((session.end - session.start) / 60000)

         logger(pluginName, `Session ended: ${mins} хв`, 'rocket')

         try { fs.unlinkSync(lockFile) } catch { }

         const sessions = readJson(sessionsFile)
         sessions.push({ ...session })
         writeJson(sessionsFile, sessions)
      }
   })()

   process.once('exit', finalizeSession)
   process.once('SIGINT', () => { finalizeSession(); process.exit() })
   process.once('SIGTERM', () => { finalizeSession(); process.exit() })
   process.once('SIGUSR2', finalizeSession)

   process.on('uncaughtException', (err) => {
      logger(pluginName, `Critical error:', ${err}`, 'error')
      finalizeSession()
   })

   process.on('unhandledRejection', (reason) => {
      logger(pluginName, `Unhandled Rejection: ${reason}`, 'error')
      finalizeSession()
   })

   return {
      name: 'vite-plugin-dev-sessions',
   }
}
// plugins/dev-sessions.mjs (або .js)
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sessionsDir = path.resolve(process.cwd(), 'sessions')
const sessionsFile = path.resolve(sessionsDir, 'sessions.json')
const lockFile = path.resolve(sessionsDir, '.session-lock')

const ensureDir = () => {
   if (!fs.existsSync(sessionsDir)) {
      fs.mkdirSync(sessionsDir, { recursive: true })
   }
}

const readJson = (file, fallback = []) => {
   if (!fs.existsSync(file)) return fallback
   try {
      return JSON.parse(fs.readFileSync(file, 'utf-8'))
   } catch (err) {
      console.error('[Dev Session] Пошкоджений JSON → скидаю:', file)
      fs.writeFileSync(file, JSON.stringify(fallback, null, 2))
      return fallback
   }
}

const writeJson = (file, data) => {
   ensureDir()
   fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8')
}

// ─────────────────────────────────────────────────────────────────────────────
// ГЛОБАЛЬНИЙ ЗАХИСТ ВІД ДУБЛЮВАННЯ
let pluginInitialized = false

export default function devSessionsPlugin() {
   if (pluginInitialized) {
      return { name: 'vite-plugin-dev-sessions (already active)' }
   }
   pluginInitialized = true

   let session = null

   // 1. Відновлення після крашу
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
               note: `відновлено після крашу (~${mins} хв)`,
            }
            const sessions = readJson(sessionsFile)
            sessions.push(recovered)
            writeJson(sessionsFile, sessions)
            console.log(`[Dev Session] Відновлено сесію після крашу: ${mins} хв`)
         }
      } catch (e) {
         console.error('[Dev Session] Помилка lock-файлу:', e.message)
      } finally {
         try { fs.unlinkSync(lockFile) } catch { }
      }
   }

   // 2. Нова сесія
   const startTime = Date.now()
   session = {
      id: `${startTime}-${process.pid}`,
      start: startTime,
      project: path.basename(process.cwd()),
   }

   try {
      fs.writeFileSync(lockFile, String(startTime), 'utf-8')
   } catch (e) {
      console.warn('[Dev Session] Не вдалося створити lock-файл')
   }

   console.log(`[Dev Session] Сесія розпочата · ${session.project}`)

   // 3. Фіналізація — з залізним захистом від дублювання
   const finalizeSession = (() => {
      let called = false
      return () => {
         if (called || !session) return
         called = true

         session.end = Date.now()
         const mins = Math.round((session.end - session.start) / 60000)

         console.log(`[Dev Session] Сесія завершена: ${mins} хв`)

         try { fs.unlinkSync(lockFile) } catch { }

         const sessions = readJson(sessionsFile)
         sessions.push({ ...session }) // копія, щоб не було мутацій
         writeJson(sessionsFile, sessions)
      }
   })()

   // 4. Події (усі once!)
   process.once('exit', finalizeSession)
   process.once('SIGINT', () => { finalizeSession(); process.exit() })
   process.once('SIGTERM', () => { finalizeSession(); process.exit() })
   process.once('SIGUSR2', finalizeSession) // nodemon

   process.on('uncaughtException', (err) => {
      console.error('[Dev Session] Критична помилка:', err)
      finalizeSession()
      process.exit(1)
   })

   process.on('unhandledRejection', (reason) => {
      console.error('[Dev Session] Unhandled Rejection:', reason)
      finalizeSession()
      process.exit(1)
   })

   return {
      name: 'vite-plugin-dev-sessions',
   }
}
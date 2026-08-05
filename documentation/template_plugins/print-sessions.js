import fs from 'fs'
import path from 'path'
import { Table } from 'console-table-printer'
import { logger } from './html-composer/utils/logger.js'

const pluginName = '[print-sessions]'
const sessionsFile = path.resolve(process.cwd(), './template_plugins/sessions/sessions.json')

const sessions = (() => {
   try {
      return fs.existsSync(sessionsFile) ? JSON.parse(fs.readFileSync(sessionsFile, 'utf-8')) : []
   } catch {
      logger(pluginName, 'Read error sessions.json', 'error')
      return []
   }
})()

if (!sessions.length) {
   logger(pluginName, 'There are no session statistics.', 'warning')
   process.exit(0)
}

const byDay = {}
let totalMs = 0

sessions.forEach(s => {
   if (!s.end) return
   const day = new Date(s.start).toISOString().slice(0, 10)
   const duration = s.end - s.start

   byDay[day] ??= { count: 0, duration: 0 }
   byDay[day].count++
   byDay[day].duration += duration
   totalMs += duration
})

const formatTimeUA = ms => {
   const h = Math.floor(ms / 3_600_000)
   const m = Math.floor((ms % 3_600_000) / 60_000)
   const s = Math.floor((ms % 60_000) / 1000)
   let str = ''
   if (h > 0) str += `${h}h `
   if (m > 0) str += `${m}m `
   if (s > 0) str += `${s}s`
   return str.trim()
}

const table = Object.entries(byDay)
   .sort(([a], [b]) => b.localeCompare(a))
   .map(([day, d], i) => ({
      Date: day.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3.$2.$1'),
      Time: formatTimeUA(d.duration),
      Sessions: d.count
   }))

const avgPerDay = Object.keys(byDay).length ? formatTimeUA(totalMs / Object.keys(byDay).length) : '0s'

const reset = '\x1b[0m'
const bold = '\x1b[1m'
const yellow = '\x1b[33m'
const dim = '\x1b[2m'

console.log('\n' + dim + '═'.repeat(68) + reset)
console.log(bold + yellow + '   DEVELOPMENT STATISTICS   ' + reset)
console.log(dim + '═'.repeat(68) + reset + '\n')

const p = new Table({
   columns: [
      { name: '№', alignment: 'left', color: 'dim' },
      { name: 'Date', alignment: 'left', color: 'cyan' },
      { name: 'Time', alignment: 'left', color: 'cyan' },
      { name: 'Sessions', alignment: 'right', color: 'cyan' }
   ]
})

table.forEach((row, i) => {
   p.addRow({
      '№': i + 1,
      'Date': row.Date,
      'Time': row.Time,
      'Sessions': row.Sessions
   })
})

p.printTable()
console.log('')

const summaryTable = new Table({
   columns: [
      { name: 'Label', alignment: 'left', color: 'yellow' },
      { name: 'Value', alignment: 'right', color: 'cyan' }
   ]
})

summaryTable.addRow({ Label: 'Total sessions', Value: sessions.length })
summaryTable.addRow({ Label: 'Total time', Value: formatTimeUA(totalMs) })
summaryTable.addRow({ Label: 'Average per day', Value: avgPerDay })

summaryTable.printTable()
console.log(dim + '═'.repeat(68) + reset + '\n')
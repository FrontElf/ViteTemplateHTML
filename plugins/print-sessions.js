#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const sessionsFile = path.resolve(process.cwd(), 'sessions/sessions.json')

const reset = '\x1b[0m'
const bold = '\x1b[1m'
const dim = '\x1b[2m'
const yellow = '\x1b[33m', cyan = '\x1b[36m', green = '\x1b[32m', magenta = '\x1b[35m', gray = '\x1b[90m'

const sessions = (() => {
   try {
      return fs.existsSync(sessionsFile) ? JSON.parse(fs.readFileSync(sessionsFile, 'utf-8')) : []
   } catch {
      console.log('Read error sessions.json')
      return []
   }
})()

if (!sessions.length) {
   console.log('There are no session statistics.')
   process.exit(0)
}

let totalMs = 0
const byDay = {}
const projects = new Set()

sessions.forEach(s => {
   if (!s.end) return
   const day = new Date(s.start).toISOString().slice(0, 10)
   const duration = s.end - s.start

   byDay[day] ??= { count: 0, duration: 0 }
   byDay[day].count++
   byDay[day].duration += duration
   totalMs += duration

   if (s.project) projects.add(s.project)
})

const formatTime = ms => {
   const h = Math.floor(ms / 3_600_000)
   const m = Math.floor((ms % 3_600_000) / 60_000)
   const s = Math.floor((ms % 60_000) / 1000)

   if (h > 0) return `${h}h ${m}m ${s}s`
   if (m > 0) return `${m}m ${s}s`
   return `${s}s`
}

const rows = Object.entries(byDay)
   .sort(([a], [b]) => b.localeCompare(a))
   .map(([day, d], i) => ({
      '№': i + 1,
      'Day': day.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3.$2.$1'),
      'Session': d.count,
      'Time': formatTime(d.duration)
   }))

const headers = ['№', 'Day', 'Session', 'Time']
const colWidths = headers.reduce((w, h) => {
   const max = Math.max(h.length, ...rows.map(r => String(r[h]).length))
   w[h] = max + 3
   return w
}, {})

const pad = (s, len) => ' ' + String(s).padEnd(len - 2) + ' '
const box = (l, m, r) => gray + l + headers.map(h => '─'.repeat(colWidths[h])).join(m) + r + reset

console.log('')
console.log(dim + '═'.repeat(68) + reset)
console.log(bold + yellow + '   DEVELOPMENT STATISTICS   ' + reset)
console.log(dim + '═'.repeat(68) + reset + '\n')

console.log(box('┌', '┬', '┐'))
let headerRow = gray + '│' + reset
headers.forEach(h => {
   const color = { '№': yellow, 'Day': cyan, 'Session': green, 'Time': magenta }[h] || cyan
   headerRow += color + pad(h, colWidths[h]) + reset + gray + '│' + reset
})
console.log(headerRow)
console.log(box('├', '┼', '┤'))

rows.forEach(r => {
   let row = gray + '│' + reset
   headers.forEach(h => {
      const color = { '№': yellow, 'Day': cyan, 'Session': green, 'Time': magenta }[h] || reset
      row += color + pad(r[h], colWidths[h]) + reset + gray + '│' + reset
   })
   console.log(row)
})
console.log(box('└', '┴', '┘') + '\n')

const avgPerDay = Object.keys(byDay).length ? formatTime(totalMs / Object.keys(byDay).length) : '0s'
const projectList = projects.size ? [...projects].join(', ') : '—'

const summaryItems = [
   ['Project', projectList],
   ['A session of everything', `${sessions.length}`],
   ['Total duration', formatTime(totalMs)],
   ['On average per day', avgPerDay]
]

const maxLabelLength = Math.max(...summaryItems.map(([l]) => l.length))

summaryItems.forEach(([label, value]) => {
   const coloredLabel = yellow + label + reset
   const paddedLabel = coloredLabel.padEnd(maxLabelLength + 10)

   let coloredValue = value
   if (label.includes('duration') || label.includes('day')) {
      coloredValue = (label.includes('duration') ? bold + magenta : green) + value + reset
   }

   console.log(`${paddedLabel} ${coloredValue}`)
})

console.log('')
console.log(dim + '═'.repeat(68) + reset + '\n')
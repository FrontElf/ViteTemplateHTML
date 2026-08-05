import path from 'path'
import fs from 'fs'

export function getHtmlEntryFiles(srcDir) {
   const entry = {}
   const files = fs.readdirSync(srcDir, { withFileTypes: true })

   files.forEach((file) => {
      if (file.isFile() && path.extname(file.name) === '.html') {
         const name = path.basename(file.name, '.html')
         entry[name] = path.resolve(srcDir, file.name)
      }
   })

   return entry
}


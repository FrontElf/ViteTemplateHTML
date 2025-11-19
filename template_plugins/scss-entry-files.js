import fs from 'fs'
import path from 'path'

export function getComponentScssEntries(htmlEntries) {
   const scss = {}

   for (const file of Object.values(htmlEntries)) {
      const html = fs.readFileSync(file, 'utf8')

      const re = /<link[^>]+href=["']([^"']+\.scss)["']/gi
      let m

      while ((m = re.exec(html))) {
         let href = m[1]

         if (href.startsWith('@c/')) {
            href = href.replace('@c/', 'src/html/components/')
         }

         const abs = path.resolve(href)
         const name = path.basename(abs, '.scss')

         scss[name] = abs
      }
   }

   return scss
}
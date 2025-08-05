import fs from 'fs'
import path from 'path'

const CONFIG = {
   paths: {
      root: process.cwd(),
      indexHtml: 'index.html',
   },
   assets: {
      styles: '@tw/main.css',
      scripts: '@j/main.js',
   },
   env: {
      isProduction: process.env.NODE_ENV === 'production',
   },
}

const HTML_TEMPLATE = `
<html lang="en">
  <head>
    <link rel="stylesheet" href="${CONFIG.assets.styles}" />
  </head>
  <body>
    <script type="module" src="${CONFIG.assets.scripts}"></script>
  </body>
</html>
`.trim()

export default function generateMinimalIndex() {
   if (!CONFIG.env.isProduction) {
      return () => { }
   }

   const indexHtmlPath = path.resolve(CONFIG.paths.root, CONFIG.paths.indexHtml)

   const writeIndexFile = () => {
      try {
         fs.writeFileSync(indexHtmlPath, HTML_TEMPLATE, 'utf8')
      } catch (error) {
         console.error('[generateMinimalIndex] Помилка створення index.html:', error.message)
      }
   }

   const cleanup = () => {
      try {
         if (fs.existsSync(indexHtmlPath)) {
            fs.unlinkSync(indexHtmlPath)
         }
      } catch (error) {
         console.error('[generateMinimalIndex] Помилка видалення index.html:', error.message)
      }
   }

   writeIndexFile()
   process.on('exit', cleanup)
   return (tree) => tree
}
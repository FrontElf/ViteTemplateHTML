// Налаштування шаблону
import templateConfig from '../template.config.js'
import { loadTemplate } from './helpers.js'

// Логгер
import logger from './logger.js'
import fs from 'fs'
import path from 'path'

async function createFlsComponent() {
   const pluginName = '[create-component-plugin]'

   const name = process.argv[2].toLowerCase()
   if (!name || /[а-яА-ЯёЁіїєґІЇЄҐ0-9\s\p{P}]/gu.test(name)) {
      logger(pluginName, 'Invalid component name.', 'error')
   } else {
      const folderPath = findFolderRecursive(`src/components`, name)
      if (fs.existsSync(`src/components/custom/${name}`) || folderPath) {
         logger(pluginName, 'Component already exists. Please choose another name.', 'warning')
      } else {

         const htmlTemplate = loadTemplate(
            'template_plugins/templates/component/html.template', { componentName: name }
         )
         const scssTemplate = loadTemplate(
            'template_plugins/templates/component/scss.template', { componentName: name }
         )

         fs.mkdirSync(`src/components/custom/${name}`)
         fs.writeFileSync(`src/components/custom/${name}/${name}.html`, htmlTemplate)
         fs.writeFileSync(`src/components/custom/${name}/${name}.scss`, scssTemplate)
         logger(pluginName, `Component ${name} created successfully.`, 'success')
      }
   }
}

function findFolderRecursive(startPath, folderName) {
   if (!fs.existsSync(startPath)) {
      return false
   }
   const files = fs.readdirSync(startPath)
   for (const file of files) {
      const fullPath = path.join(startPath, file)
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
         if (file === folderName) {
            return fullPath
         }
         const found = findFolderRecursive(fullPath, folderName)
         if (found) return found
      }
   }
   return false
}
createFlsComponent()

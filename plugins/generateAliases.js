import fs from 'fs'
import path from 'path'
import templateConfig from '../template.config.js'
import logger from './logger.js'

function generateConfigFiles() {
   const pluginName = '[generate-aliases-plugin]'
   const aliases = templateConfig.aliases
   const componentsImports = templateConfig.componentsImports || { html: [], scss: [] }

   const vscodeSettings = {
      'path-autocomplete.pathMappings': Object.entries(aliases).reduce((acc, [key, value]) => {
         if (/^https?:\/\//.test(value)) {
            acc[key] = value
         } else {
            acc[key] = path.join('${folder}', value).replace(/\\+/g, '/')
         }
         return acc
      }, {}),
      'viteHtmlComponentCreator.defaultImports': {
         html_imports: componentsImports.html || [],
         scss_imports: componentsImports.scss || [],
      },
   }

   fs.writeFileSync(path.resolve('.vscode/settings.json'), JSON.stringify(vscodeSettings, null, 2))

   logger(`${pluginName} Config files have been generated!`, 'success')
}

generateConfigFiles()

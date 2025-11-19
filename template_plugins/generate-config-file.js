import fs from 'fs'
import path from 'path'
import templateConfig from '../template.config.js'
import { logger } from './html-composer/utils/logger.js'

function generateConfigFiles() {
   const pluginName = '[generate-aliases-plugin]'
   const aliases = templateConfig.aliases
   const { isColors, components, conditions } = templateConfig.syntaxColors

   const vscodeSettings = {
      'path-autocomplete.pathMappings': Object.entries(aliases).reduce((acc, [key, value]) => {
         if (/^https?:\/\//.test(value)) {
            acc[key] = value
         } else {
            acc[key] = path.join('${folder}/src', value).replace(/\\+/g, '/')
         }
         return acc
      }, {}),

      ...((isColors) ? {
         "editor.tokenColorCustomizations": {
            "textMateRules": [
               {
                  "scope": [
                     "entity.name.tag.component.html",
                     "meta.tag.component.open.html punctuation.definition.tag.begin.html",
                     "meta.tag.component.open.html punctuation.definition.tag.end.html",
                     "meta.tag.component.close.html punctuation.definition.tag.begin.html",
                     "meta.tag.component.close.html punctuation.definition.tag.end.html"
                  ],
                  "settings": {
                     "foreground": components.tagColor
                  }
               },
               {
                  "scope": "meta.tag.component.open.html entity.other.attribute-name.html",
                  "settings": {
                     "foreground": components.attrColor,
                  }
               },
               {
                  "scope": "meta.tag.component.open.html string.quoted.double.html",
                  "settings": {
                     "foreground": components.valueColor,
                  }
               },
               {
                  "scope": [
                     "entity.name.tag.control.html",
                     "meta.tag.control.open.html punctuation.definition.tag.begin.html",
                     "meta.tag.control.open.html punctuation.definition.tag.end.html",
                     "meta.tag.control.close.html punctuation.definition.tag.begin.html",
                     "meta.tag.control.close.html punctuation.definition.tag.end.html",
                  ],
                  "settings": {
                     "foreground": conditions.tagColor
                  }
               },
               {
                  "scope": "meta.tag.control.open.html entity.other.attribute-name.html",
                  "settings": {
                     "foreground": conditions.attrColor,
                  }
               },
               {
                  "scope": "meta.tag.control.open.html string.quoted.double.html",
                  "settings": {
                     "foreground": conditions.valueColor,
                  }
               }
            ]
         }
      } : {}),

   }

   fs.writeFileSync(path.resolve('.vscode/settings.json'), JSON.stringify(vscodeSettings, null, 2))

   logger(pluginName, `Config files have been generated!`, 'success')
}

generateConfigFiles()

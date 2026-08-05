import { cpSync } from 'fs'
import { resolve } from 'path'
import { logger } from './html-composer/utils/logger.js'

export default function copyAssetsPlugin(pathsMap = {}) {
   const pluginName = '[copy-assets-plugin]'

   return {
      name: 'copy-assets',
      apply: 'build',
      closeBundle() {
         for (const [src, dest] of Object.entries(pathsMap)) {
            const srcDir = resolve(process.cwd(), src)
            const destDir = resolve(process.cwd(), dest)

            try {
               cpSync(srcDir, destDir, { recursive: true })
               logger(pluginName, `Copied from ${src} → ${dest}`, 'success')
            } catch (err) {
               logger(pluginName, `Failed to copy ${src} → ${dest}: ${err}`, 'error')
            }
         }
      },
   }
}

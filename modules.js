import tailwindcss from "@tailwindcss/vite"
import { vitePluginImageOptimizer } from "./plugins/imageOptimizer.js"
import { qrcode } from 'vite-plugin-qrcode'
import { getHtmlEntryFiles, devNavigationPlugin } from './plugins/getHtmlEntryFiles.js'
import htmlComposer from './plugins/html-composer/htmlComposer.js'
import templateConfig from './template.config.js'
import copyAssetsPlugin from './plugins/copyAssets.js'
import devSessionsPlugin from './plugins/dev-sessions.js'

export default {
   qrcode,
   tailwindcss,
   vitePluginImageOptimizer,
   getHtmlEntryFiles,
   devNavigationPlugin,
   htmlComposer,
   templateConfig,
   copyAssetsPlugin,
   devSessionsPlugin
}
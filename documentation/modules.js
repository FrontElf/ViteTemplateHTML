import tailwindcss from "@tailwindcss/vite"
import { vitePluginImageOptimizer } from "./template_plugins/image-optimizer.js"
import { qrcode } from 'vite-plugin-qrcode'
import pxtorem from 'postcss-pxtorem'
import sortMediaQueries from 'postcss-sort-media-queries'
import { getHtmlEntryFiles } from './template_plugins/html-entry-files.js'
import { devNavigationPlugin } from './template_plugins/dev-navigation.js'
import htmlComposer from './template_plugins/html-composer/htmlComposer.js'
import templateConfig from './template.config.js'
import copyAssetsPlugin from './template_plugins/copy-assets.js'
import devSessionsPlugin from './template_plugins/dev-sessions.js'
import htmlSvgSpritePlugin from './template_plugins/svg-inline-sprite.js'

export default {
   qrcode,
   tailwindcss,
   pxtorem,
   sortMediaQueries,
   vitePluginImageOptimizer,
   htmlSvgSpritePlugin,
   getHtmlEntryFiles,
   devNavigationPlugin,
   htmlComposer,
   templateConfig,
   copyAssetsPlugin,
   devSessionsPlugin
}
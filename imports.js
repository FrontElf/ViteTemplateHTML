import vituum from 'vituum'
import tailwindcss from "@tailwindcss/vite"
import posthtml from '@vituum/vite-plugin-posthtml'
import beautify from 'posthtml-beautify'
import { vitePluginImageOptimizer } from "./plugins/imageOptimizer.js"

export default {
   tailwindcss,
   vituum,
   posthtml,
   beautify,
   vitePluginImageOptimizer
}
import { defineConfig } from 'vite'
import path from 'path'
import modules from './imports.js'
import templateCfg from './template.config.js'
import htmlComposer from './plugins/html-composer/htmlComposer.js'
import templateConfig from './template.config.js'
import { getHtmlEntryFiles, devNavigationPlugin } from './plugins/getHtmlEntryFiles.js'
import copyAssetsPlugin from './plugins/copyAssets.js'

const rootDir = path.join(process.cwd(), 'src')
const buildDir = path.join(process.cwd(), 'dist')
const isProduction = process.env.NODE_ENV === 'production'

const ignoredDirs = ['vendor', 'node_modules', 'plugins', 'dist', '.git', 'documentation', 'fonts-converter']
const ignoredFiles = ['package.json', 'yarn.lock', 'snippets.json', 'README.md']

export default defineConfig({
  root: rootDir,
  base: '',
  plugins: [

    // HTML Composer
    htmlComposer({
      aliases: templateCfg.aliases || {},
      HTMLVariables: {
        IS_DEV: !isProduction,
        IS_TAILWIND: templateCfg.isTailwind,
        ...templateConfig.HTMLVariables || {},
      }
    }),

    {
      name: 'custom-hmr',
      enforce: 'post',
      handleHotUpdate({ file, server }) {
        if (file.endsWith('.html') || file.endsWith('.json')) {
          server.ws.send({ type: 'full-reload', path: '*' })
        }
      },
    },

    // TailwindCSS
    ...((templateCfg.isTailwind) ? [modules.tailwindcss()] : []),
    // Image optimization & webp
    ...((isProduction) ? [modules.vitePluginImageOptimizer(templateCfg.imgQuality),] : []),
    // Dev navigation plugin
    ...((templateCfg.isDevNavigation) ? [devNavigationPlugin({ srcDir: 'src', position: 'left' })] : []),
    // Copy assets like fonts, images, etc.
    ...((templateCfg.isPHPMailer) ? [copyAssetsPlugin({ 'src/php': 'dist/php' }),] : []),
  ],

  css: {
    devSourcemap: true,
    preprocessorOptions: {

      scss: {
        api: 'modern-compiler',
        additionalData: `@use "@s/inc" as *;`,
        sourceMap: true,
        quietDeps: true,
      },
    },
  },

  server: {
    host: '0.0.0.0',
    watch: {
      ignored: [
        ...ignoredDirs.map(dir => `**/${dir}/**`),
        ...ignoredFiles.map(file => `**/${file}/**`),
      ],
    },
  },

  resolve: {
    alias: { ...templateCfg.aliases || {} },
  },

  build: {
    minify: true,
    assetsInlineLimit: 0,
    cssCodeSplit: false,
    emptyOutDir: true,
    outDir: buildDir,
    rollupOptions: {
      input: getHtmlEntryFiles('src'),
      output: {
        format: 'es',
        assetFileNames: (asset) => {
          const ext = asset.name?.split('.').pop()
          const original = asset.originalFileNames?.[0]
          const srcPath = original ? original.replace('src/assets/', 'assets/').replace(/\/([^/]+)$/g, '') : ''

          const folders = {
            png: srcPath, jpg: srcPath, jpeg: srcPath, webp: srcPath, svg: srcPath,
            avi: 'assets/video', mp4: 'assets/video', mebm: 'assets/video',
            woff: 'assets/fonts', woff2: 'assets/fonts',
            css: 'assets/css',
          }

          return `${folders[ext] || 'assets'}/[name][extname]`
        },

        entryFileNames: 'assets/js/[name].js',
        chunkFileNames: 'assets/js/[name].js',
      },
    },
  },
})
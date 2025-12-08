import { defineConfig } from 'vite'
import path from 'path'
import modules from './modules.js'
import templateConfig from './template.config.js'

const rootDir = path.join(process.cwd(), 'src')
const buildDir = path.join(process.cwd(), 'dist')
const isProduction = process.env.NODE_ENV === 'production'

const ignoredDirs = ['vendor', 'node_modules', 'template_plugins', 'dist', '.git', 'documentation', 'fonts-converter']
const ignoredFiles = ['package.json', 'yarn.lock', 'snippets.json', 'README.md']

export default defineConfig({
  root: rootDir,
  base: '',
  plugins: [

    // HTML Composer
    modules.htmlComposer({
      aliases: templateConfig.aliases || {},
      HTMLVariables: {
        IS_DEV: !isProduction,
        IS_TAILWIND: templateConfig.styles.tailwind,
        // Variables from template.config.js
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

    // QR Code generator
    ...((templateConfig.isQrcode) ? [modules.qrcode()] : []),
    // Dev sessions plugin
    ...((templateConfig.isSessions) ? [modules.devSessionsPlugin()] : []),
    // TailwindCSS
    ...((templateConfig.styles.tailwind) ? [modules.tailwindcss()] : []),
    // Image optimization & webp
    ...((isProduction) ? [modules.vitePluginImageOptimizer(templateConfig.imgQuality),] : []),
    // Dev navigation plugin
    ...((templateConfig.devNavigation.isShow) ? [modules.devNavigationPlugin({ srcDir: 'src', position: 'left' })] : []),
    // Copy assets like fonts, images, etc.
    ...((templateConfig.isPHPMailer) ? [modules.copyAssetsPlugin({ 'src/php': 'dist/php' }),] : []),
    // SVG Inline Sprite Plugin
    ...((templateConfig.isInlineSprite) ? [modules.htmlSvgSpritePlugin(),] : []),
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

    postcss: {
      plugins: [
        // Replacing px with remh rem
        ...((templateConfig.styles.pxToRem && isProduction) ? [
          modules.pxtorem({ rootValue: templateConfig.styles.sizeToRem, exclude: /node_modules/i, })
        ] : []),
        // Sorting and grouping media requests
        ...((templateConfig.styles.sortMediaQuery && isProduction) ? [
          modules.sortMediaQueries({ sort: templateConfig.styles.sortType })
        ] : [])
      ]
    }
  },

  server: {
    host: true,
    watch: {
      ignored: [
        ...ignoredDirs.map(dir => `**/${dir}/**`),
        ...ignoredFiles.map(file => `**/${file}/**`),
      ],
    },
  },

  resolve: {
    alias: { ...templateConfig.aliases || {} },
  },

  build: {
    minify: templateConfig.isMinify || false,
    assetsInlineLimit: 0,
    cssCodeSplit: true,
    emptyOutDir: true,
    outDir: buildDir,
    rollupOptions: {
      input: modules.getHtmlEntryFiles('src'),
      output: {
        format: 'es',
        assetFileNames: (asset) => {
          const ext = asset.name?.split('.').pop()
          const original = asset.originalFileNames?.[0]
          const srcPath = original ? original.replace('src/assets/', 'assets/').replace(/\/([^/]+)$/g, '') : ''

          const foldersMap = [
            { exts: ['png', 'jpg', 'jpeg', 'webp', 'svg', 'avif', 'gif'], folder: srcPath },
            { exts: ['avi', 'mp4', 'mebm'], folder: 'assets/video' },
            { exts: ['mp3', 'ogg', 'wav'], folder: 'assets/audio' },
            { exts: ['woff', 'woff2', 'ttf', 'otf', 'eot'], folder: 'assets/fonts' },
            { exts: ['css'], folder: 'assets/css' },
          ]

          const folder = foldersMap.find(f => f.exts.includes(ext))?.folder || 'assets'
          return `${folder}/[name][extname]`
        },

        entryFileNames: 'assets/js/[name].js',
        chunkFileNames: 'assets/js/[name].js',
      },
    },
  },
})
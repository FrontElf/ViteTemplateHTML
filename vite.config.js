import { defineConfig } from 'vite'
import path from 'path'
import templateCfg from './template.config.js'
import modules from './imports.js'

import viteFixSelfClosingTags from './plugins/posthtml/posthtml-self-closing.js'
import include from './plugins/posthtml/include.js'
import posthtmlReplaceAliases from './plugins/posthtml/posthtml-alias-plugin.js'
import fixVituumTw from './plugins/posthtml/fix-vituum-tw.js'

const isProduction = process.env.NODE_ENV === 'production'

const makeAliases = (aliases) => {
  return Object.entries(aliases).reduce((acc, [key, value]) => {
    acc[key] = path.resolve(process.cwd(), value)
    return acc
  }, {})
}

const GLOBAL_HTML_VARIABLES = {
  IS_TAILWIND: templateCfg.isTailwind,
  IS_DEV: !isProduction,
  IS_PRELOADER: templateCfg.isPreloader,
  ...templateCfg.HTMLVariables
}

const aliases = makeAliases(templateCfg.aliases)

const ignoredDirs = [
  'vendor', 'node_modules', 'plugins', 'dist', '.git', 'documentation', 'fonts-convert'
]
const ignoredFiles = ['package.json', 'yarn.lock', 'snippets.json', 'README.md']

export default defineConfig({
  base: '',
  plugins: [
    modules.vituum({
      pages: { normalizeBasePath: true, }
    }),

    viteFixSelfClosingTags(),

    modules.posthtml({
      plugins: [
        include({
          globalVariables: GLOBAL_HTML_VARIABLES,
        }),
        posthtmlReplaceAliases(templateCfg.aliases),
        ...((templateCfg.isTailwind && isProduction) ? [fixVituumTw()] : []),
        modules.beautify({
          indent_size: 2,
          indent_inner_html: true,
          extra_liners: [],
        }),
      ],
    }),

    // TailwindCSS
    ...((templateCfg.isTailwind) ? [modules.tailwindcss()] : []),

    // Image optimization & webp
    ...((isProduction && templateCfg.images.makeWebp && !templateCfg.images.optimizeNoWebp) ? [
      modules.vitePluginImageOptimizer(templateCfg.images.webpQuality),
    ] : []),
    // Image optimization & no webp
    ...((isProduction && templateCfg.images.optimizeNoWebp) ? [
      modules.vitePluginImageOptimizer(templateCfg.images.imgQuality),
    ] : []),

    // Hot Module Replacement
    {
      name: 'custom-hmr',
      enforce: 'post',
      handleHotUpdate({ file, server }) {
        if (file.endsWith('.html') || file.endsWith('.json')) {
          server.ws.send({ type: 'full-reload', path: '*' })
        }
      },
    },
  ],

  // CSS preprocessor
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

  // Server config
  server: {
    host: '0.0.0.0',
    watch: {
      ignored: [
        ...ignoredDirs.map(dir => `**/${dir}/**`),
        ...ignoredFiles.map(file => `**/${file}/**`),
      ],
    },
    proxy: {
      '/api': {
        target: `http://${templateCfg.serverProxy.domain}:${templateCfg.serverProxy.port}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(new RegExp(`^${templateCfg.serverProxy.target}`), '')
      }
    }
  },

  resolve: {
    alias: { ...aliases },
  },

  build: {
    minify: true,
    assetsInlineLimit: 0,
    cssCodeSplit: false,
    emptyOutDir: true,
    outDir: 'dist',
    rollupOptions: {

      output: {
        format: 'es',
        assetFileNames: (asset) => {
          const ext = asset.name?.split('.').pop()
          const original = asset.originalFileNames?.[0]
          const srcPath = original ? original.replace('src/assets/', 'assets/').replace(/\/([^/]+)$/g, '') : ''

          const folders = {
            png: srcPath,
            jpg: srcPath,
            jpeg: srcPath,
            webp: srcPath,
            svg: srcPath,
            avi: 'assets/video',
            mp4: 'assets/video',
            mebm: 'assets/video',
            woff2: 'assets/fonts',
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
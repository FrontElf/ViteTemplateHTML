export default {
   isTailwind: true,
   isPreloader: false,
   images: {
      makeWebp: true,
      optimizeNoWebp: false,
      webpQuality: {
         generateWebP: true,
         webpOptions: { lossless: false, quality: 75 },
         jpegOptions: { quality: 80, progressive: true, mozjpeg: true },
         pngOptions: { compressionLevel: 9, progressive: true },
      },
      imgQuality: {
         generateWebP: false,
         jpegOptions: { quality: 80, progressive: true, mozjpeg: true },
         pngOptions: { compressionLevel: 9, progressive: true },
      },
      ignoreWebpClasses: ['ignore-webp'],
      ignoreOptimizeClasses: ['ignore-optimize'],
   },

   HTMLVariables: {
      VERSION: '1.0.0',
      NAME: 'Template Project Name',
      API_URL: 'https://jsonplaceholder.typicode.com/users',
      headTitle: 'My Awesome Site',
   },

   serverProxy: {
      target: '/api',
      domain: 'localhost',
      port: 8000
   },

   isMinifyCssJs: true,

   aliases: {
      '@h': '/src/html/',
      '@o': '/src/html/other/',
      '@c': '/src/html/components/',
      '@tc': '/src/html/test_components/',
      '@ui': '/src/html/components/UI/',
      '@p': '/src/pages/',
      '@j': '/src/js/',
      '@s': '/src/scss/',
      '@tw': './src/tw_css/',
      '@i': '/src/assets/img/',
      '@v': '/src/assets/video/',
      '@f': '/src/assets/files/'
   },

   aliasesIsRelative: true,
   isLogger: false,

   componentsImports: {
      html: ["<link rel='stylesheet' href='@c/{component}/{component}.css'/>"],
      scss: []
   }
}
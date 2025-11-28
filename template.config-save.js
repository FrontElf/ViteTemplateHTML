const config = {
   ViteTemplateHTML: true,

   isSessions: true,
   isQrcode: true,
   isMinify: true,
   isPHPMailer: false,

   styles: {
      tailwind: true,
      pxToRem: true,
      sizeToRem: 16,
      sortMediaQuery: true,
      sortType: 'desktop-first',
      critical: false,
   },

   devNavigation: {
      isShow: true,
      position: 'left top',
      color: '#ffffff',
      background: 'rgba(51, 51, 51, 0.5)',
      transition: '0.3s',
      delay: '0.2s'
   },

   templatePlugin: {
      componentsPath: true,
      componentsWarning: true,
      syntaxHighlight: true,
      componentsDirectory: 'src/html/components',

      syntaxColors: {
         components: {
            tagColor: '#43cffa',
            attrColor: '#88e5f5',
            valueColor: '#a6f0a6'
         },
         conditions: {
            tagColor: '#66f7c7',
            attrColor: '#88e5f5',
            valueColor: '#a6f0a6'
         }
      },
   },

   imgQuality: {
      optimizeJpeg: false,
      generateWebP: false,
      webpOptions: { lossless: false, quality: 70 },
      jpegOptions: { quality: 70, progressive: true, mozjpeg: true },
      pngOptions: { compressionLevel: 7 },
   },

   HTMLVariables: {
      IS_PRELOADER: false,
      IS_MAGIC_CURSOR: true,
      SITE_NAME: 'My Site',
      SITE_URL: 'https://www.mysite.com',
      API_URL: 'https://jsonplaceholder.typicode.com/users',
      CURRENT_YEAR: new Date().getFullYear(),
   },

   aliases: {
      '@h': '/html/',
      '@o': '/html/other/',
      '@c': '/html/components/',
      '@ui': '/html/components/UI/',
      '@p': '/pages/',
      '@j': '/js/',
      '@s': '/scss/',
      '@tw': '/css/',
      '@i': '/assets/img/',
      '@v': '/assets/video/',
      '@f': '/assets/fonts/'
   },

   PHPserver: {
      domain: 'localhost',
      port: 8000
   },
}

export default config
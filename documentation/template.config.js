const config = {
   ViteTemplateHTML: true,

   isSessions: false,
   isQrcode: false,
   isMinify: true,
   isPHPMailer: false,
   isInlineSprite: false,
   componentsTrace: false,

   styles: {
      tailwind: true,
      pxToRem: false,
      sizeToRem: 16,
      sortMediaQuery: false,
      sortType: 'desktop-first',
      critical: false,
   },

   HTMLVariables: {
      SITE_NAME: 'ViteTemplateHTML Docs',
      CURRENT_YEAR: () => new Date().getFullYear(),
   },

   imgQuality: {
      optimizeJpeg: false,
      generateWebP: false,
   },

   templatePlugin: {
      syntaxHighlight: true,
      componentsWarning: true,
      componentsPath: true,
      componentsDirectory: 'src/html/components',
      syntaxColors: {
         components: { tagColor: '#37e4fb', attrColor: '#9fe7f4', valueColor: '#6af95d' },
         conditions: { tagColor: '#7affb4', attrColor: '#18d9fb', valueColor: '#e0fba7' }
      },
   },

   devNavigation: {
      isShow: true,
      position: 'left top',
      color: '#ffffff',
      background: '#292929',
      transition: '0.3s',
      delay: '0.2s'
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
}

export default config

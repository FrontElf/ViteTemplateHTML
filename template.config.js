const config = {
   ViteTemplateHTML: true,

   isSessions: true,
   isQrcode: false,
   isMinify: true,
   isPHPMailer: false,
   isInlineSprite: false,

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
      color: "#ffffff",
      background: "#292929",
      transition: '0.3s',
      delay: '0.2s'
   },

   templatePlugin: {
      syntaxHighlight: true,
      componentsWarning: true,
      componentsPath: true,
      componentsDirectory: "src/html/components",

      syntaxColors: {
         components: { tagColor: "#37e4fb", attrColor: "#9fe7f4", valueColor: "#6af95d" },
         conditions: { tagColor: "#7affb4", attrColor: "#18d9fb", valueColor: "#e0fba7" }
      },
   },

   imgQuality: {
      optimizeJpeg: true,
      generateWebP: true,
      webpOptions: { lossless: false, quality: 60 },
      jpegOptions: { quality: 60, progressive: true, mozjpeg: true },
      pngOptions: { compressionLevel: 6 },
   },

   HTMLVariables: {
      IS_PRELOADER: false,
      IS_MAGIC_CURSOR: true,
      SITE_NAME: "My Site",
      SITE_URL: "https://www.mysite.com",
      API_URL: "https://jsonplaceholder.typicode.com/users",
      CURRENT_YEAR: new Date().getFullYear()
   },

   aliases: {
      '@h': "/html/",
      '@o': "/html/other/",
      '@c': "/html/components/",
      '@ui': "/html/components/UI/",
      '@p': "/pages/",
      '@j': "/js/",
      '@s': "/scss/",
      '@tw': "/css/",
      '@i': "/assets/img/",
      '@v': "/assets/video/",
      '@f': "/assets/fonts/"
   },

   PHPserver: {
      domain: 'localhost',
      port: 8000
   },
}

export default config
export default {
   isTailwind: true,
   isPHPMailer: false,
   isDevNavigation: true,
   defaultFontSizeToRem: 16,

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

   isLogger: true,
}
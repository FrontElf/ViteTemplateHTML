import templateCfg from './template.config.js'

export default {
   plugins: {
      'postcss-pxtorem': {
         rootValue: templateCfg.defaultFontSizeToRem || 16,
         propList: ['*'],
         exclude: /node_modules/i,
      },
   },
}
import { promises as fs } from 'fs'
import { logger } from './html-composer/utils/logger.js'

export const generateFontsStyle = async () => {
  const pluginName = '[fonts-style-plugin]'
  const fontsFile = `./src/scss/fonts/fonts.scss`
  const fontsFileTailwind = `./src/css/fonts/fonts.css`
  const headFile = `./src/html/other/Fonts.html`

  try {
    const fontsFiles = await fs.readdir('./src/assets/fonts/')

    if (fontsFiles) {
      let fileContent = ''
      let headFileContent = ''
      let newFileOnly

      for (let i = 0; i < fontsFiles.length; i++) {
        let fontFileName = fontsFiles[i].split('.')[0]
        if (newFileOnly !== fontFileName) {
          let fontName = fontFileName.split('-')[0]
          let fontStyle = fontFileName.includes('Italic') ? 'italic' : 'normal'

          let fontWeight = 400
          if (
            fontFileName.includes('Thin') ||
            fontFileName.includes('Hairline')
          ) {
            fontWeight = 100
          } else if (
            fontFileName.includes('ExtraLight') ||
            fontFileName.includes('UltraLight')
          ) {
            fontWeight = 200
          } else if (fontFileName.includes('Light')) {
            fontWeight = 300
          } else if (fontFileName.includes('Medium')) {
            fontWeight = 500
          } else if (
            fontFileName.includes('SemiBold') ||
            fontFileName.includes('DemiBold')
          ) {
            fontWeight = 600
          } else if (
            fontFileName.includes('Bold') &&
            !fontFileName.includes('Extra') &&
            !fontFileName.includes('Ultra')
          ) {
            fontWeight = 700
          } else if (
            fontFileName.includes('ExtraBold') ||
            fontFileName.includes('UltraBold')
          ) {
            fontWeight = 800
          } else if (
            fontFileName.includes('Black') ||
            fontFileName.includes('Heavy')
          ) {
            fontWeight = 900
          } else if (
            fontFileName.includes('ExtraBlack') ||
            fontFileName.includes('UltraBlack')
          ) {
            fontWeight = 950
          }

          fileContent += `
/**
 * ${fontName} font face
 */
@font-face {
   font-family: '${fontName}';
   font-display: swap;
   src: url("@f/${fontFileName}.woff2") format("woff2");
   font-weight: ${fontWeight};
   font-style: ${fontStyle};
}
                    `
          headFileContent += `
<link rel="preload" href="@f/${fontFileName}.woff2" as="font" type="font/woff2" crossorigin="anonymous" />`
          newFileOnly = fontFileName
        }
      }
      await fs.writeFile(headFile, headFileContent)
      await fs.writeFile(fontsFileTailwind, fileContent)
      await fs.writeFile(fontsFile, fileContent)
      logger(pluginName, `FONTS.SCSS, FONTS.CSS, Fonts.HTML files successfully updated!`, 'rocket')
    }
  } catch (err) {
    logger(pluginName, `Error when creating a styles for fonts: ${err}`, 'error')
  }
}

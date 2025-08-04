import { promises as fs } from 'fs'
import logger from './logger.js'

export const generateFontsStyle = async () => {
  const fontsFile = `./src/scss/fonts/fonts.scss`
  const headFile = `./src/html/other/Fonts.html`

  try {
    const fontsFiles = await fs.readdir('./src/assets/fonts/')
    const fontsFilesScss = '/src/assets/fonts/'

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
          // Determine the font weight
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
   src: url("${fontsFilesScss}${fontFileName}.woff2") format("woff2");
   font-weight: ${fontWeight};
   font-style: ${fontStyle};
}
                    `
          headFileContent += `
<link rel="preload" href="${fontsFilesScss}${fontFileName}.woff2" as="font" type="font/woff2" crossorigin="anonymous" />`
          newFileOnly = fontFileName
        }
      }
      await fs.writeFile(fontsFile, fileContent)
      await fs.writeFile(headFile, headFileContent)
      logger('FONTS.SCSS & _FONTS.HTML files successfully updated!', 'rocket')
    }
  } catch (err) {
    logger(`Error when creating a styles for fonts: ${err}`, 'error')
  }
}

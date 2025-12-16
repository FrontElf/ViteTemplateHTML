import { promises as fs } from 'fs'
import { logger } from './html-composer/utils/logger.js'

const fontWeightMap = {
  Thin: 100,
  Hairline: 100,
  ExtraLight: 200,
  UltraLight: 200,
  Light: 300,
  Regular: 400,
  Medium: 500,
  SemiBold: 600,
  DemiBold: 600,
  Bold: 700,
  ExtraBold: 800,
  UltraBold: 800,
  Black: 900,
  Heavy: 900,
  ExtraBlack: 950,
  UltraBlack: 950,
}

function getFontWeight(fontFileName) {
  for (const [key, weight] of Object.entries(fontWeightMap)) {
    if (fontFileName.includes(key)) {
      if ((key === 'Bold' || key === 'Black') &&
          (fontFileName.includes('Extra') || fontFileName.includes('Ultra'))) {
        continue
      }
      return weight
    }
  }
  return 400
}

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
          let fontWeight = getFontWeight(fontFileName)

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

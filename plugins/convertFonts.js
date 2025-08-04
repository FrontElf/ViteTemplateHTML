import { promises as fs } from 'fs'
import path from 'path'
import ttf2woff2 from 'ttf2woff2'
import { sync as globSync } from 'glob'
import { generateFontsStyle } from './fontsStyleGenerator.js'
import logger from './logger.js'

async function convertFonts() {
  try {
    const fontFiles = globSync(`./fonts-convert/*.{ttf,woff,woff2}`)
    const outputDir = './src/assets/fonts/'
    await fs.mkdir(outputDir, { recursive: true })

    for (const fontFile of fontFiles) {
      const extname = path.extname(fontFile)
      const fileName = path.basename(fontFile, extname)

      if (extname === '.ttf') {
        // Convert TTF to WOFF2
        const input = await fs.readFile(fontFile)
        const output = ttf2woff2(input)
        await fs.writeFile(`${outputDir}${fileName}.woff2`, output)
        logger(`Font ${fileName}.woff2 successfully converted!`, 'success')
      } else if (extname === '.woff' || extname === '.woff2') {
        // Move WOFF or WOFF2 to the output directory
        await fs.copyFile(fontFile, `${outputDir}${path.basename(fontFile)}`)
        logger(`Font ${fileName}${extname} moved to output directory!`, 'info')
      }
    }
  } catch (err) {
    logger(`Font conversion error: ${err}`, 'error')
  }

  // Generate SCSS after fonts have been converted/moved
  await generateFontsStyle()
}

// Run the font conversion script
convertFonts()

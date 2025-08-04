import { outlineSvg } from '@davestewart/outliner'
import svgtofont from 'svgtofont'
import { optimize } from 'svgo'
import fs from 'fs/promises'
import path from 'path'
const pkg = JSON.parse(await fs.readFile('./package.json', 'utf8'))
import logger from './logger.js'
import generateHtmlIcons from './generateHtmlIcons.js'

// Configuration parameters
const paths = {
  src: path.resolve(process.cwd(), `./fonts-convert/icons`),
  optimizedDist: path.resolve(process.cwd(), `./plugins/ifont-gen/optimized-icons`),
  buildDist: path.resolve(process.cwd(), `./plugins/ifont-gen/build`),
  templates: path.resolve(process.cwd(), `./plugins/ifont-gen/templates/styles`),
  fonts: path.resolve(process.cwd(), './src/assets/fonts'),
  assets: path.resolve(process.cwd(), './src/assets'),
  scss: path.resolve(process.cwd(), `src/scss/fonts`),
}

const fontParams = {
  fontName: 'icons',
  classNamePrefix: '_icon',
}

// Create a directory if it doesn't exist
const createDirectoryIfNotExists = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true })
}

// Convert SVG strokes to paths and optimize SVG
const convertAndOptimizeSvg = async (file, srcDir, distDir) => {
  const filePath = path.join(srcDir, file)
  const outputFilePath = path.join(distDir, file)
  try {
    let svgContent = await fs.readFile(filePath, 'utf8')
    const outlinedSvg = outlineSvg(svgContent)
    const optimizedSvg = optimize(outlinedSvg, {
      path: outputFilePath,
      plugins: getSvgOptimizationPlugins(),
    })
    await fs.writeFile(outputFilePath, optimizedSvg.data, 'utf8')
  } catch (error) {
    console.error(`Error processing file ${file}:`, error)
  }
}

// SVG optimization plugins
const getSvgOptimizationPlugins = () => [
  { name: 'removeXMLProcInst', active: true },
  {
    name: 'removeAttrs',
    params: { attrs: '(stroke|style|fill|clip-path|id|data-name)' },
  },
  { name: 'removeUselessDefs', active: true },
  { name: 'removeEmptyContainers', active: true },
  {
    name: 'addAttributesToSVGElement',
    params: { attributes: [{ fill: 'black' }] },
  },
  { name: 'convertStyleToAttrs', active: true },
  { name: 'convertPathData', active: true },
]

// Generate font from SVGs
const generateFont = async () => {
  try {
    await svgtofont({
      src: paths.optimizedDist,
      dist: paths.buildDist,
      fontName: fontParams.fontName,
      classNamePrefix: fontParams.classNamePrefix,
      outSVGPath: true,
      startNumber: 20000,
      css: true,
      useCSSVars: true,
      generateInfoData: true,
      styleTemplates: paths.templates,
      svgicons2svgfont: {
        fontHeight: 1024,
        unitsPerEm: 1024,
        centerHorizontally: true,
        centerVertically: true,
        normalize: true,
      },
    })
    logger('Font generation is completed!', 'success')

    await copyGeneratedFiles()
  } catch (error) {
    logger(`Error generating font: ${error}`, 'error')
  }
}

// Copy generated font and style files
const copyGeneratedFiles = async () => {
  try {
    const spriteSourcePath = path.join(paths.buildDist, 'icons.symbol.svg')
    const spriteDestPath = path.join(paths.assets, 'sprite.svg')
    await fs.copyFile(spriteSourcePath, spriteDestPath)

    const ttfSourcePath = path.join(paths.buildDist, `${fontParams.fontName}.woff2`)
    const ttfDestPath = path.join(paths.fonts, `${fontParams.fontName}.woff2`)
    await fs.copyFile(ttfSourcePath, ttfDestPath)

    const scssSourcePath = path.join(paths.buildDist, `${fontParams.fontName}.scss`)
    const scssDestPath = path.join(paths.scss, `${fontParams.fontName}.scss`)
    await fs.copyFile(scssSourcePath, scssDestPath)
    logger(`Copied ${fontParams.fontName}.scss, ${fontParams.fontName}.woff2, sprite.svg to src directory`, 'rocket')
  } catch (error) {
    logger(`Error copying files: ${error}`, 'error')
  }
}

const clearOptimizedIconsFolder = async () => {
  try {
    const files = await fs.readdir(paths.optimizedDist)
    if (files.length > 0) {
      await Promise.all(
        files.map((file) => fs.rm(path.join(paths.optimizedDist, file), { recursive: true, force: true }))
      )
    }
  } catch (error) {
    logger(`Error clearing optimized icons folder: ${error}`, 'error')
  }
}

(async () => {
  try {
    await createDirectoryIfNotExists(paths.optimizedDist)

    const svgFiles = (await fs.readdir(paths.src)).filter(
      (file) => path.extname(file) === '.svg'
    )
    await Promise.all(
      svgFiles.map((file) =>
        convertAndOptimizeSvg(file, paths.src, paths.optimizedDist)
      )
    )

    logger('SVG optimization done', 'success')
    await generateFont()
    await clearOptimizedIconsFolder()

    await generateHtmlIcons()
  } catch (error) {
    logger(`Error while performing: ${error}`, 'error')
  }
})()

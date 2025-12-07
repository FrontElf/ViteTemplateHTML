import { outlineSvg } from '@davestewart/outliner'
import svgtofont from 'svgtofont'
import { optimize } from 'svgo'
import fs from 'fs/promises'
import path from 'path'
import { logger } from './html-composer/utils/logger.js'
import generateHtmlIcons from './generate-html-icons.js'
const pluginName = '[icons-font-generator-plugin]'

// Configuration
const paths = {
  src: path.resolve(process.cwd(), './fonts-converter/icons'),
  optimizedDist: path.resolve(process.cwd(), './template_plugins/ifont-gen/optimized-icons'),
  buildDist: path.resolve(process.cwd(), './template_plugins/ifont-gen/build'),
  templates: path.resolve(process.cwd(), './template_plugins/ifont-gen/templates/styles'),
  fonts: path.resolve(process.cwd(), './src/assets/fonts'),
  assets: path.resolve(process.cwd(), './src/assets'),
  scss: path.resolve(process.cwd(), 'src/scss/fonts'),
  css: path.resolve(process.cwd(), 'src/css/fonts'),
}

const fontParams = {
  fontName: 'icons',
  classNamePrefix: '_icon',
}

const packageJson = JSON.parse(await fs.readFile('./package.json', 'utf8'))

// Create a directory if it doesn't exist
const createDirectoryIfNotExists = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true })
}

// Convert SVG strokes to paths and optimize SVG
const convertAndOptimizeSvg = async (file, srcDir, distDir) => {
  const filePath = path.join(srcDir, file)
  const outputFilePath = path.join(distDir, file)
  try {
    const svgContent = await fs.readFile(filePath, 'utf8')
    const outlinedSvg = outlineSvg(svgContent)
    const optimizedSvg = optimize(outlinedSvg, {
      path: outputFilePath,
      plugins: getSvgOptimizationPlugins(),
    })
    await fs.writeFile(outputFilePath, optimizedSvg.data, 'utf8')
    logger(pluginName, `Optimized ${file}`, 'success')
  } catch (error) {
    logger(pluginName, `Error processing file ${file}: ${error.message}`, 'error')
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

// Copy multiple files concurrently
const copyFiles = async (filePairs) => {
  try {
    await Promise.all(
      filePairs.map(({ src, dest }) => fs.copyFile(src, dest))
    )
    logger(pluginName, `Copied ${filePairs.length} files`, 'rocket')
  } catch (error) {
    logger(pluginName, `Error copying files: ${error.message}`, 'error')
  }
}

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
    logger(pluginName, 'Font generation completed!', 'star')

    await copyGeneratedFiles()
  } catch (error) {
    logger(pluginName, `Error generating font: ${error.message}`, 'error')
  }
}

// Copy generated font and style files
const copyGeneratedFiles = async () => {
  const filePairs = [
    {
      src: path.join(paths.buildDist, 'icons.symbol.svg'),
      dest: path.join(paths.assets, 'sprite.svg'),
    },
    {
      src: path.join(paths.buildDist, `${fontParams.fontName}.woff2`),
      dest: path.join(paths.fonts, `${fontParams.fontName}.woff2`),
    },
    {
      src: path.join(paths.buildDist, `${fontParams.fontName}.css`),
      dest: path.join(paths.css, `${fontParams.fontName}.css`),
    },
    {
      src: path.join(paths.buildDist, `${fontParams.fontName}.scss`),
      dest: path.join(paths.scss, `${fontParams.fontName}.scss`),
    },
  ]
  await copyFiles(filePairs)
}

// Clear optimized icons folder
const clearOptimizedIconsFolder = async () => {
  try {
    const files = await fs.readdir(paths.optimizedDist)
    if (files.length > 0) {
      await Promise.all(
        files.map((file) =>
          fs.rm(path.join(paths.optimizedDist, file), { recursive: true, force: true })
        )
      )
      logger(pluginName, `Cleared optimized icons folder`, 'info')
    }
  } catch (error) {
    logger(pluginName, `Error clearing optimized icons folder: ${error.message}`, 'error')
  }
}

// Main execution function
const main = async () => {
  try {
    await createDirectoryIfNotExists(paths.optimizedDist)

    const svgFiles = (await fs.readdir(paths.src)).filter(
      (file) => path.extname(file) === '.svg'
    )
    if (svgFiles.length === 0) {
      logger(pluginName, `No SVG files found in source directory`, 'error')
      return
    }

    await Promise.all(
      svgFiles.map((file) =>
        convertAndOptimizeSvg(file, paths.src, paths.optimizedDist)
      )
    )
    logger(pluginName, `Optimized ${svgFiles.length} SVG files`, 'star')

    await generateFont()
    await clearOptimizedIconsFolder()
    await generateHtmlIcons()
  } catch (error) {
    logger(pluginName, `Error during execution: ${error.message}`, 'error')
  }
}

// Execute the main function
main()
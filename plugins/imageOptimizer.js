import sharp from "sharp"
import fs from "fs"
import path from "path"
import { promises as fsPromises } from "fs"
import { load } from "cheerio"
import postcss from "postcss"
import logger from './logger.js'
// import co

function walkDir(dir, callback) {
   const files = fs.readdirSync(dir, { withFileTypes: true })
   for (const file of files) {
      const fullPath = path.join(dir, file.name)
      if (file.isDirectory()) {
         walkDir(fullPath, callback)
      } else {
         callback(fullPath)
      }
   }
}

async function optimizeImages(imageDir, options = {}) {
   const pluginName = '[imageOptimizer-plugin]'
   const {
      generateWebP = true,
      webpOptions = { lossless: false, quality: 75 },
      jpegOptions = { quality: 80, progressive: true, mozjpeg: true },
      pngOptions = { compressionLevel: 9, progressive: true },
   } = options

   const generatedWebPFiles = new Set()

   if (!fs.existsSync(imageDir)) {
      logger(`${pluginName} The directory ${imageDir} does not exist, skipping image optimization.`, 'info')
      return generatedWebPFiles
   }

   const imageFiles = []
   walkDir(imageDir, (filePath) => {
      if (/\.(jpe?g|png)$/i.test(filePath)) {
         imageFiles.push(filePath)
      }
   })

   for (const inputFilePath of imageFiles) {
      const outputDir = path.dirname(inputFilePath)
      const fileNameWithoutExt = path.basename(inputFilePath, path.extname(inputFilePath))
      const ext = path.extname(inputFilePath).toLowerCase()
      const tempFilePath = path.join(outputDir, `${fileNameWithoutExt}_temp${ext}`)

      try {
         if (ext === ".jpg" || ext === ".jpeg") {
            await sharp(inputFilePath)
               .jpeg(jpegOptions)
               .toFile(tempFilePath)
         } else if (ext === ".png") {
            await sharp(inputFilePath)
               .png(pngOptions)
               .toFile(tempFilePath)
         }

         await fsPromises.rename(tempFilePath, inputFilePath)

         if (generateWebP) {
            const outputFilePathWebP = path.join(outputDir, `${fileNameWithoutExt}.webp`)
            await sharp(inputFilePath)
               .webp(webpOptions)
               .toFile(outputFilePathWebP)
            generatedWebPFiles.add(outputFilePathWebP)
         }
      } catch (error) {
         logger(`${pluginName} Error while processing the file ${inputFilePath}: ${error.message}`, 'error')
      }
   }

   logger(`${pluginName} Image optimization completed. Processed ${imageFiles.length} files.`, 'success')
   return generatedWebPFiles
}

async function updateHtmlFiles(outputDir, generatedWebPFiles, options = {}) {
   const htmlFiles = []
   walkDir(outputDir, (filePath) => {
      if (/\.html$/i.test(filePath)) {
         htmlFiles.push(filePath)
      }
   })

   for (const htmlFile of htmlFiles) {
      try {
         const htmlContent = await fsPromises.readFile(htmlFile, "utf-8")
         const $ = load(htmlContent)

         $("img").each((i, element) => {
            const src = $(element).attr("src")
            if (src && /\.(jpe?g|png)$/i.test(src)) {
               const webpSrc = src.replace(/\.(jpe?g|png)$/i, ".webp")
               const absoluteWebpPath = path.join(outputDir, webpSrc)
               if (generatedWebPFiles.has(absoluteWebpPath)) {
                  $(element).attr("src", webpSrc)
               }
            }
         })

         $("picture source").each((i, element) => {
            const srcset = $(element).attr("srcset")
            if (srcset && /\.(jpe?g|png)$/i.test(srcset)) {
               const webpSrcset = srcset.replace(/\.(jpe?g|png)$/i, ".webp")
               const absoluteWebpPath = path.join(outputDir, webpSrcset)
               if (generatedWebPFiles.has(absoluteWebpPath)) {
                  $(element).attr("srcset", webpSrcset)
                  $(element).attr("type", "image/webp")
               }
            }
         })

         $("[style]").each((i, element) => {
            const style = $(element).attr("style")
            if (style && /url\(['"]?.*?\.(jpe?g|png)['"]?\)/i.test(style)) {
               const updatedStyle = style.replace(
                  /url\(['"]?(.*?)\.(jpe?g|png)['"]?\)/i,
                  (match, url) => {
                     const webpUrl = `${url}.webp`
                     const absoluteWebpPath = path.join(outputDir, webpUrl)
                     if (generatedWebPFiles.has(absoluteWebpPath)) {
                        return `url('${webpUrl}')`
                     }
                     return match
                  }
               )
               $(element).attr("style", updatedStyle)
            }
         })

         const updatedHtml = $.html()
         await fsPromises.writeFile(htmlFile, updatedHtml, "utf-8")
      } catch (error) {
         logger(`${pluginName} Error while updating the HTML file ${htmlFile}: ${error.message}`, 'error')
      }
   }
}

async function updateCssFiles(outputDir) {
   const cssFiles = []
   walkDir(outputDir, (filePath) => {
      if (/\.css$/i.test(filePath)) {
         cssFiles.push(filePath)
      }
   })

   for (const cssFile of cssFiles) {
      try {
         const cssContent = await fsPromises.readFile(cssFile, "utf-8")
         const result = await postcss([
            {
               postcssPlugin: "replace-image-format",
               Declaration: (decl) => {
                  if (decl.value.includes("url(")) {
                     decl.value = decl.value.replace(
                        /url\(['"]?(.*?)\.(jpe?g|png)(['"]?)\)/gi,
                        (match, url, ext, closingQuote) => {
                           const newUrl = `${url}.webp`
                           return `url('${newUrl}'${closingQuote ? ")" : ""})`
                        }
                     )
                  }
               },
            },
         ]).process(cssContent, { from: cssFile, to: cssFile })
         await fsPromises.writeFile(cssFile, result.css, "utf-8")
      } catch (error) {
         logger(`${pluginName} Error while updating the CSS file ${cssFile}: ${error.message}`, 'error')
      }
   }
}

// Плагін для Vite
export function vitePluginImageOptimizer(options = {}) {
   const {
      imageDir = "dist/assets/img",
      outputDir = "dist",
      ...optimizeOptions
   } = options

   return {
      name: "vite-plugin-image-optimizer",
      apply: "build",
      async closeBundle() {
         const resolvedImageDir = path.resolve(imageDir)
         const resolvedOutputDir = path.resolve(outputDir)
         const generatedWebPFiles = await optimizeImages(resolvedImageDir, optimizeOptions)

         if (generatedWebPFiles.size > 0) {
            await updateHtmlFiles(resolvedOutputDir, generatedWebPFiles, optimizeOptions)
            await updateCssFiles(resolvedOutputDir)
         }
      },
   }
}
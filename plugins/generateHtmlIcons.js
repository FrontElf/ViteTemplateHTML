import fs from 'fs'
import path from 'path'
import logger from './logger.js'

const filesPath = path.resolve(process.cwd(), './plugins/ifont-gen/build')
const savePath = path.resolve(process.cwd(), './src/assets')
const packageJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8'))
const version = packageJson.version
const name = packageJson.name

async function generateHtmlIcons() {
   try {
      const fontPath = path.join(filesPath, 'icons.woff2')
      const jsonPath = path.join(filesPath, 'info.json')
      const outputPath = path.join(savePath, 'icons.html')

      const fontData = fs.readFileSync(fontPath)
      const fontBase64 = fontData.toString('base64')

      const iconData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))

      const style = generateStyles(fontBase64)

      let listItems = ''
      for (const [key, value] of Object.entries(iconData)) {
         const unicodeText = escapeHtml(value.unicode)
         listItems += generateIconListItem(key, value, unicodeText)
      }

      const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
         <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Icons</title>
            ${style}
         </head>
         <body>

            <div class="header">
               <h1><span>${name}</span> icons<sup>${version}</sup></h1>
            </div>

            <div class="icons">
               <div data-copy-message class="copy-message">qweqwe</div>
               <ul>
                  ${listItems}
               </ul>
            </div>

            <script>
               let timeoutId = null;
               document.addEventListener('click', function (event) {
                  const target = event.target
                  const copyValue = target.getAttribute('data-copy')
                  const copyModal = document.querySelector('[data-copy-message]')

                  if (copyValue) {
                     if (timeoutId) {
                        clearTimeout(timeoutId)
                     }
                     navigator.clipboard.writeText(copyValue).then(function () {
                        copyModal.innerText = \`Copied: \${copyValue}\`
                        document.documentElement.classList.add('copy-show')
                        timeoutId = setTimeout(() => {
                           document.documentElement.classList.remove('copy-show')
                        }, 1500)
                     }).catch(function (error) {
                        copyModal.innerText = \`Failed to copy: \${error} \`
                        document.documentElement.classList.add('copy-show')
                        timeoutId = setTimeout(() => {
                           document.documentElement.classList.remove('copy-show')
                        }, 1500)
                     })
                  }
               })
            </script>
         </body>
      </html>`

      fs.writeFileSync(outputPath, htmlContent, 'utf8')
      logger('index-icons.html успішно створено!', 'success')
   } catch (error) {
      logger('Помилка при створенні index.html:', 'error')
   }
}

function generateStyles(fontBase64) {
   return `
      <style>
         @font-face {
            font-family: 'IconFont';
            src: url('data:font/woff2;base64,${fontBase64}') format('woff2');
            font-weight: normal;
            font-style: normal;
         }

         * {
            margin: 0;
            padding: 0;
            list-style: none;
         }

         body {
            color: #696969;
            font: 12px/1.5 tahoma, arial sans-serif;
         }

         a {
            color: #333;
            text-decoration: underline;
         }

         a:hover {
            color: rgb(9, 73, 209);
         }

         .icon {
            font-family: 'IconFont';
            font-size: 24px;
            transition: all 0.4s ease;
         }

         .header {
            color: #333;
            text-align: center;
            padding: 80px 0 40px 0;
            font-size: 14px;
         }

         .header .logo svg {
            height: 120px;
            width: 120px;
         }

         .header h1 {
            font-size: 42px;
            padding: 26px 0 10px 0;
         }

         .header h1 span {
            text-transform: capitalize;
         }

         .header sup {
            font-size: 14px;
            margin: 8px 0 0 8px;
            position: absolute;
            color: #7b7b7b;
         }

         .info {
            color: #999;
            font-weight: normal;
            max-width: 346px;
            margin: 0 auto;
            font-size: 12px;
            transition: all 0.4s ease;
            text-align: left;
         }

         .info td {
            padding: 2px 0;
         }

         .info .info-value {
            padding-left: 5px;
         }
            
         .info .info-value span {
            cursor: pointer;
            transition: all 0.4s ease;
         }

         .info .info-value span:hover {
            color: #3c75e4;
         }

         .copy-message {
            text-align: center;
            padding: 5px 20px;
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            color: #3c75e4;
            border-radius: 3px;
            border: 1px solid #3c75e4;
            opacity: 0;
            transition: all 0.4s ease;
         }

         .copy-show .copy-message {
            opacity: 1;
         }

         .icons {
            position: relative;
            max-width: 1190px;
            margin: 0 auto;
            padding-top: 40px;
         }

         .icons ul {
            text-align: center;
         }

         .icons ul li {
            vertical-align: top;
            width: 160px;
            display: inline-block;
            text-align: center;
            background-color: rgba(0, 0, 0, .02);
            border-radius: 3px;
            padding: 20px 15px;
            margin-right: 10px;
            margin-top: 10px;
            transition: all 0.4s ease;
         }

         .icons ul li:hover {
            background-color: rgba(0, 0, 0, .06);
         }

         .icons ul li:hover span.icon {
            color: #3c75e4;
            opacity: 1;
         }

         .icons ul li h4 {
            font-weight: normal;
            padding: 10px 0 5px 0;
            display: block;
            color: #8c8c8c;
            font-size: 15px;
            line-height: 12px;
            opacity: 0.8;
            transition: all 0.4s ease;
            margin-bottom: 10px;
         }

         .icons ul li:hover h4 {
            opacity: 1;
            color: #3c75e4;
         }
         .icons ul li:hover .info {
            color: #616161;
         }
      </style>`
}

function generateIconListItem(key, value, unicodeText) {
   return `
      <li>
         <span class="icon ${value.className}">${value.unicode}</span>
         <h4 class="name">${key}</h4>
         <table class="info">
            <tr>
               <td>class:</td>
               <td class="info-value"><span data-copy="${value.className}" title="Click to copy">${value.className}</span></td>
            </tr>
            <tr>
               <td>unicode:</td>
               <td class="info-value"><span data-copy="${unicodeText}" title="Click to copy">${unicodeText}</span></td>
            </tr>
            <tr>
               <td>encoded:</td>
               <td class="info-value"><span data-copy="${value.encodedCode}" title="Click to copy">${value.encodedCode}</span></td>
            </tr>
         </table>
      </li>`
}

function escapeHtml(str) {
   return str.replace(/[&<>"']/g, function (char) {
      return {
         '&': '&amp;',
         '<': '&lt;',
         '>': '&gt;',
         '"': '&quot;',
         "'": '&#39;'
      }[char]
   })
}

export default generateHtmlIcons

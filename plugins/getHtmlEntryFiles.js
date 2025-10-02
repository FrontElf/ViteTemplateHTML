import path from 'path'
import fs from 'fs'

export function getHtmlEntryFiles(srcDir) {
   const entry = {}
   const files = fs.readdirSync(srcDir, { withFileTypes: true })

   files.forEach((file) => {
      if (file.isFile() && path.extname(file.name) === '.html') {
         const name = path.basename(file.name, '.html')
         entry[name] = path.resolve(srcDir, file.name)
      }
   })

   return entry
}

function injectDevNavigation(html, srcDir, position) {
   const entryFiles = getHtmlEntryFiles(srcDir)
   const links = Object.keys(entryFiles)
      .map((name) => `<li><a href="/${name}.html">${name}</a></li>`)
      .join('')

   const sidePosition = position === 'right' ? 'right: 0;' : 'left: 0;'
   const initialTransform = position === 'right' ? 'translateX(100%)' : 'translateX(-100%)'
   const beforeSide = position === 'right' ? 'left: -15px;' : 'right: -15px;'
   const beforeTransform = position === 'right' ? 'translateX(100%)' : 'translateX(-100%)'
   const rounded = position === 'right' ? '8px 0 0 8px' : '0 8px 8px 0'

   const navCSS = `
      <style>
         .dev-nav-menu {
            position: fixed;
            top: 15vh;
            ${sidePosition}
            background: #222;
            padding: 10px 5px;
            z-index: 9999;
            border-radius: ${rounded};
            transform: ${initialTransform};
            transition: transform 0.3s ease;
            font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
         }
         .dev-nav-menu::before {
            content: 'pages';
            position: absolute;
            color: #fff;
            text-align: center;
            display: flex;
            align-items: start;
            justify-content: center;
            writing-mode: vertical-rl;
            text-orientation: upright;
            font-size: 12px;
            z-index: -1;
            top: 0;
            ${beforeSide}
            background: inherit;
            height: 90px;
            width: 20px;
            border-radius: inherit;
            overflow: hidden;
            transition: all 0.3s ease;
         }
         .dev-nav-menu:hover {
            transform: translateX(0);
         }
         .dev-nav-menu:hover::before {
            transform: ${beforeTransform};
            height: 0;
            opacity: 0;
         }
         .dev-nav-menu ul {
            display: flex;
            flex-direction: column;
            gap: 5px;
            list-style: none;
            margin: 0;
            padding: 0;
            background: inherit;
         }
         .dev-nav-menu ul li a {
            display: block;
            padding: 4px 8px;
            color: #fff;
            text-decoration: none;
            font-size: 14px;
            border-bottom: 1px solid #333;
         }
         .dev-nav-menu ul li a:hover {
            background: #444;
         }
      </style>
   `

   const navHtml = `
   <nav class="dev-nav-menu"><ul>${links}</ul></nav>
   `

   return html.replace('</head>', `${navCSS}</head>`).replace('</body>', `${navHtml}</body>`)
}

export function devNavigationPlugin(options = {}) {
   const { srcDir = 'src', position = 'left' } = options

   return {
      name: 'vite-dev-navigation',
      apply: 'serve',
      transformIndexHtml: {
         order: 'post',
         handler(html) {
            return injectDevNavigation(html, srcDir, position)
         }
      }
   }
}
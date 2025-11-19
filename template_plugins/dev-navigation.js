import { getHtmlEntryFiles } from './html-entry-files.js'
import templateConfig from '../template.config.js'

function injectDevNavigation(html) {
   const srcDir = 'src'
   const entryFiles = getHtmlEntryFiles(srcDir)
   const links = Object.keys(entryFiles).map((name) => `<li><a href="/${name}.html">${name}</a></li>`).join('')
   const { position, color, background, transition, delay } = templateConfig.devNavigation

   const [xPos = 'left', yPos = 'top'] = (position || 'left top').split(' ')

   const sidePosition = `${xPos}: 0;`
   const topPosition = `${yPos}: 15vh;`

   const initialTransformX = xPos === 'right' ? 'translateX(100%)' : 'translateX(-100%)'
   const initialTransformY = yPos === 'bottom' ? 'translateY(100%)' : 'translateY(-100%)'

   const initialTransform = xPos === 'left' || xPos === 'right' ? initialTransformX : initialTransformY

   const beforeSide = xPos === 'right' ? 'left: -18px;' : 'right: -18px;'
   const beforeTransform = xPos === 'right' ? 'translateX(100%)' : 'translateX(-100%)'
   const rounded = xPos === 'right' ? '8px 0 0 8px' : '0 8px 8px 0'

   const navCSS = `
      <style>
         .dev-nav-menu {
            position: fixed;
            ${sidePosition}
            ${topPosition}
            background: ${background};
            color: ${color};
            padding: 10px 5px;
            z-index: 9999;
            border-radius: ${rounded};
            transform: ${initialTransform};
            transition: transform ${transition} ease;
            font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
         }
         .dev-nav-menu::before {
            content: 'pages';
            position: absolute;
            color: ${color};
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
            width: 30px;
            border-radius: inherit;
            overflow: hidden;
            transition: all ${transition} ease;
         }
         .dev-nav-menu:hover {
            transform: translateX(0);
            transition: all ${transition} ease ${delay};
         }
         .dev-nav-menu:hover::before {
            transform: ${beforeTransform};
            height: 0;
            opacity: 0;
            transition: all ${transition} ease ${delay};
         }
         .dev-nav-menu:hover ul li a {
            pointer-events: all !important;
         }
         .dev-nav-menu ul {
            display: flex;
            flex-direction: column;
            list-style: none;
            margin: 0;
            padding: 0;
         }
         .dev-nav-menu ul li a {
            display: block;
            padding: 4px 8px;
            color: ${color};
            text-decoration: none;
            font-size: 14px;
            border-bottom: 1px solid ${color};
            pointer-events: none;
            transition: 
               pointer-events 0s ease ${delay},
               background 0.1s ease,
               color 0.1s ease;
         }
         .dev-nav-menu ul li a:hover {
            background: ${color};
            color: ${background};
         }
      </style>
   `

   const navHtml = `<nav class="dev-nav-menu"><ul>${links}</ul></nav>`

   return html.replace('</head>', `${navCSS}</head>`).replace('</body>', `${navHtml}</body>`)
}

export function devNavigationPlugin() {
   return {
      name: 'vite-dev-navigation',
      apply: 'serve',
      transformIndexHtml: {
         order: 'post',
         handler(html) {
            return injectDevNavigation(html)
         }
      }
   }
}
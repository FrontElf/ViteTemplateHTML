// plugins/vite-fix-self-closing.js
export default function viteFixSelfClosingTags() {
   return {
      name: 'vite-fix-self-closing-tags',
      enforce: 'pre',
      transformIndexHtml: {
         order: 'pre',
         handler(html, ctx) {
            return html
               .replace(/<([A-Z][A-Za-z0-9]*)(\s[^>]*)?\/>/g, (full, tag, attrs) => `<${tag}${attrs || ''}></${tag}>`)
               .replace(/<Content\s*\/>/g, '<Content></Content>')
         }
      }
   }
}

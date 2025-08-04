export default function posthtmlReplaceAliases(aliases = {}) {
   const aliasEntries = Object.entries(aliases)

   const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

   return function (tree) {
      tree.match({ tag: /.*/ }, node => {
         if (node.attrs) {
            for (const [attr, val] of Object.entries(node.attrs)) {
               if (typeof val === 'string') {
                  let newVal = val
                  for (const [alias, absPath] of aliasEntries) {
                     const regex = new RegExp(escapeRegex(alias) + '/', 'g')
                     newVal = newVal.replace(regex, absPath + '/')
                  }
                  node.attrs[attr] = newVal
               }
            }
         }
         return node
      })
   }
}

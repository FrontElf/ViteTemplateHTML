export function replaceAliases(tree, aliases = {}) {
   const aliasEntries = Object.entries(aliases)
   const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

   function walk(node) {
      if (Array.isArray(node)) return node.map(walk)
      if (node?.attrs) {
         for (const [attr, val] of Object.entries(node.attrs)) {
            if (typeof val === 'string') {
               node.attrs[attr] = aliasEntries.reduce(
                  (newVal, [alias, absPath]) => newVal.replace(new RegExp(escapeRegex(alias) + '/', 'g'), absPath + '/'),
                  val
               )
            }
         }
      }
      if (node?.content) node.content = walk(node.content)
      return node
   }

   return walk(tree)
}

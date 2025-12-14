import FETextWrap from '../libs/FETextWrap.js'

const textWrap = new FETextWrap({
   selector: '[data-text-wrap]',
   splitType: 'full', // 'word', 'letter', 'full'
   wordClass: 'word-wrap',
   letterClass: 'letter-wrap',
   wrapperClass: 'sr-hidden-content',
   addIndices: true
})
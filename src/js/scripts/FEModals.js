import FEModals from '../libs/FEModals'
import { bodyLock, bodyUnlock } from './functions.js'

function beforeModalOpen(modal) {
   bodyLock(300)
}
function afterModalOpen(modal) {
   // console.log('After opening the callback:', modal)
}
function beforeModalClose(modal) {
   // console.log('Before closing the callback:', modal)
}
function afterModalClose(modal) {
   bodyUnlock(300)
}

const modals = new FEModals({
   // Callbacks
   onBeforeOpen: beforeModalOpen,
   onAfterOpen: afterModalOpen,
   onBeforeClose: beforeModalClose,
   onAfterClose: afterModalClose,

   // Attributes
   selectorModal: '.fe-modal',
   selectorOverlay: '.fe-modal-overlay',
   attrOpen: 'data-modal-open',
   attrClose: 'data-modal-close',

   // Behavior
   closeOnEsc: true,
   closeAllOnEsc: true,
   singleOpen: true,
   lockScroll: false,

   // Classes
   bodyClass: 'modal-open',
   activeClass: 'is-open',
   initClass: 'fe-modal-init',
   animatingClass: 'animating',
})

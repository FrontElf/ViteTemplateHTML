import FEModals from '../libs/FEModals'


function beforeModalOpen(modal) {
   // console.log('Callback before opening:', modal)
}
function afterModalOpen(modal) {
   // console.log('After opening the callback:', modal)
}
function beforeModalClose(modal) {
   // console.log('Before closing the callback:', modal)
}
function afterModalClose(modal) {
   // console.log('After closing the callback:', modal)
}

const modals = new FEModals({
   // Callbacks
   onBeforeOpen: beforeModalOpen,
   onAfterOpen: afterModalOpen,
   onBeforeClose: beforeModalClose,
   onAfterClose: afterModalClose,

   // Attributes
   attrOpen: 'data-modal-open',
   attrClose: 'data-modal-close',

   // Behavior
   closeOnEsc: true,
   closeAllOnEsc: true,
   singleOpen: true,
   lockScroll: false,

   // Classes
   bodyClass: 'modal-open',
   activeClass: 'open',
   initClass: 'fe-modal-init',
   animatingClass: 'animating',
})

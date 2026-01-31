import { initMagicCursor, initMagneticEffect, initCursorText } from "../libs/magicCursor.js"

// main.js
initMagicCursor({
   cursorSelector: "#magic-cursor",
   ratio: 0.05,
   size: 20
})

initMagneticEffect({
   itemSelector: ".magnetic-item",
   movement: 50,
   scale: 1.2,
   duration: 0.5,
   activeClass: "is-magnetic"
})

initCursorText({
   activeSize: 120,
   labelClass: "ball-view-text",
   activeClass: "is-active"
})
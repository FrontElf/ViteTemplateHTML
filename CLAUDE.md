# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn d        # Start dev server (generates config first)
yarn b        # Build for production
yarn p        # Preview production build
yarn f        # Convert fonts (TTF→WOFF2) and generate icon font
yarn i        # Generate icon font only
yarn s        # Print dev sessions
yarn php      # Start PHP server with Vite dev
yarn coffee   # Compile CoffeeScript
```

## Architecture

This is a Vite-based HTML template with a custom HTML component system (htmlComposer plugin).

### HTML Component System

Components live in `src/html/` and are used as self-closing tags in HTML files:
```html
<Header />
<Footer />
<Modal modalId="modal" />
```

Components support:
- **Props**: `<Head pageTitle="Home" description="..." />`
- **Conditions**: `<if condition="IS_DEV === true">...</if>`, `<else>`, `<elseif>`
- **Vue-style directives**: `v-if`, `v-for`, `v-range`, `v-as`
- **Expressions**: `{{variableName}}`
- **Children slots**: `{{children}}` in layout components
- **JSON data loops**: `<each from="src/data/file.json" as="item">...</each>`

### Path Aliases

Used in both HTML imports and SCSS:
- `@h/` → `/html/`
- `@c/` → `/html/components/`
- `@o/` → `/html/other/`
- `@ui/` → `/html/components/UI/`
- `@s/` → `/scss/`
- `@i/` → `/assets/img/`
- `@f/` → `/assets/fonts/`

### SCSS Structure

- `src/scss/inc.scss` - Shared imports via `@use "@s/inc" as *;` (auto-injected in all SCSS)
- `src/scss/base/` - Reset, mixins, variables
- `src/scss/settings/` - Media breakpoints, containers, params
- Component-specific styles live alongside components: `src/html/components/Header/header.scss`

### Configuration

`template.config.js` controls:
- Feature toggles: `isSessions`, `isQrcode`, `isMinify`, `isPHPMailer`, `isInlineSprite`
- Styles: `tailwind`, `pxToRem`, `sortMediaQuery`
- `HTMLVariables` - Global variables available in HTML templates (IS_DEV, IS_PRELOADER, SITE_NAME, etc.)
- `imgQuality` - Image optimization settings for production builds

### Fonts & Icons Workflow

1. Place TTF fonts in `fonts-converter/`
2. Place SVG icons in `fonts-converter/icons/`
3. Run `yarn f` to generate:
   - WOFF2 fonts → `src/assets/fonts/`
   - Font classes → `src/scss/fonts/fonts.scss`
   - Icon font + classes → `src/scss/fonts/icons.scss`

### Key Directories

- `src/` - Source files (root for Vite)
- `src/html/components/` - Reusable HTML components
- `src/html/layouts/` - Page layouts with `{{children}}` slot
- `src/html/other/` - Shared partials (Head, Scripts, Preloader)
- `template_plugins/` - Custom Vite plugins and build tools
- `template_plugins/html-composer/` - The HTML component processing plugin

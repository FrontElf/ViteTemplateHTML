# FrontElf ViteTemplateHTML Reference

## Project Shape

- `src/*.html`: Vite HTML entry pages.
- `src/html/layouts`: layout-like HTML templates.
- `src/html/components`: component files; basename and namespaced path become valid tag names.
- `src/html/components/UI`: UI components.
- `src/html/components/Demos`: demo components for template features such as named slots.
- `src/html/other`: shared partials such as `Head`, `Scripts`, `Fonts`, preloader, magic cursor.
- `src/scss`: Sass source, with `src/scss/main.scss`, `global.scss`, `base`, `settings`, `libs`, and generated font/icon partials.
- `src/css`: CSS/Tailwind-facing files and generated CSS.
- `src/js/main.js`, `src/js/custom.js`, `src/js/scripts`, `src/js/libs`: site JavaScript.
- `src/data`: JSON used by `<each data="...">`.
- `fonts-converter`: input TTF files and SVG icons for font/icon generation.
- `template_plugins`: custom Vite plugins and build utilities.
- `documentation`: human documentation examples for this template.

## Commands

Use `yarn d` for development, `yarn b` for production build, `yarn p` for build preview, `yarn f` for fonts plus icons, `yarn i` for icons only, `yarn s` for sessions, `yarn cfg` for generated config, `yarn php` for PHPMailer/PHP workflows, and `yarn coffee` for CoffeeScript compilation.

`vite.config.js` sets `root` to `src`, emits `dist`, and takes HTML entry files from `modules.getHtmlEntryFiles('src')`.

## Config

`template.config.js` controls feature flags:

- `isSessions`, `isQrcode`, `isMinify`, `isPHPMailer`, `isInlineSprite`.
- `componentsTrace: false | 'dev' | 'all'` at the config root controls source-map-like component comments.
- `styles.tailwind`, `styles.pxToRem`, `styles.sizeToRem`, `styles.sortMediaQuery`, `styles.sortType`, `styles.critical`.
- `HTMLVariables`, merged into the htmlComposer context along with `IS_DEV` and `IS_TAILWIND`.
- `templatePlugin.componentsDirectory`, normally `src/html/components`.
- `devNavigation` settings.
- aliases for HTML, JS, SCSS, CSS, images, video, and fonts.
- `PHPserver` settings.

## HTML Composer Pipeline

The custom Vite plugin in `template_plugins/html-composer/htmlComposer.js` runs on `transformIndexHtml` before Vite transforms HTML:

1. Build full context from `HTMLVariables`.
2. Parse HTML with `posthtml-parser`.
3. Convert self-closing component tags, including namespaced tags with dots, into paired tags for known components.
4. Process Vue-style directives.
5. Process `<if>/<elseif>/<else>`.
6. Process `<each>`.
7. Include components.
8. Process `{{ ... }}` expressions.
9. Replace aliases.
10. Run extra plugins.
11. Move marked styles to head.
12. Remove HTML comments.
13. Format HTML in production.

This order matters. For example, `v-for` becomes `<each>`, and loop iterations process nested loops, conditions, components, and expressions with the current loop context. Production mode is intentionally stricter and rethrows template errors with context instead of silently returning raw HTML.

## Components

Every `.html` file under the include base directory is mapped by basename and by a namespaced path key:

```html
<!-- src/html/components/Header/Header.html -->
<Header />

<!-- src/html/components/UI/Button/Button.html -->
<Button />
<UI.Button />

<!-- src/html/components/Demos/NamedSlotsDemo/NamedSlotsDemo.html -->
<NamedSlotsDemo />
<Demos.NamedSlotsDemo />
```

When a file is nested as `Folder/Name/Name.html`, the repeated final folder/name is compressed in the namespace. Basename tags remain for compatibility. If multiple files share the same basename, use namespaced tags to disambiguate; duplicate basenames warn in dev and fail production builds.

Self-closing component calls are supported for known component tags, including namespaced tags. Unknown tags starting with a capital letter render a visible "Component not found" message when `isNotFound` is enabled.

Attributes become props for the component that receives them. Prefer lowercase prop names for template-facing APIs because HTML parsing can normalize attribute casing. String values `"true"` and `"false"` are converted to booleans. Prop values that start with `{` or `[` are evaluated as JavaScript expressions. Default children passed between component tags are available as `children`.

```html
<Button type="link" isActive="true">
  <span>Button text</span>
</Button>
```

Inside `Button.html`:

```html
<button class="{{ isActive ? 'is-active' : '' }}">
  {{children}}
</button>
```

Use `{{children}}` to render child nodes. It may be an array of AST nodes, and expression processing preserves arrays.

Normal props are local to the receiving component and do not cascade into nested component calls:

```html
<Card label="Visible only inside Card" />
```

Use the `deep:` prefix when a prop should be passed through to descendant components. The child receives the prop without the prefix:

```html
<Card deep:label="Visible inside nested components" />
```

## Named Slots

Use `<template slot="name">...</template>` inside a component call to pass named projection content. Named slots do not enter `children`; render them in the receiving component with `<slot name="name">fallback</slot>`. They are also available as `slots.name` for advanced expression use.

```html
<DemoPanel label="Named slots">
  <template slot="title">
    Named slots with default children
  </template>

  <p>Default body content.</p>

  <template slot="actions">
    <UI.Button variant="button">Action</UI.Button>
  </template>

  <template slot="footer">
    Footer content.
  </template>
</DemoPanel>
```

Inside `DemoPanel.html`:

```html
<article>
  <header>
    <slot name="title">Untitled panel</slot>
  </header>
  <div>{{children}}</div>
  <aside>
    <slot name="actions"></slot>
  </aside>
  <footer>
    <slot name="footer">Default footer</slot>
  </footer>
</article>
```

Multiple `<template slot="same">` blocks append in order. Missing slots render the fallback content inside `<slot>`, or empty content when no fallback exists. Slot content may include HTML, expressions, conditions, loops, and nested components. Do not have a slot refer to itself with `{{slots.same}}` inside its own projection content.

## Local Variables

Components can define build-time local variables with `<script define>`. The script can access global HTMLVariables, props, `children`, and `slots`. The compiler parses declarations with Acorn, extracts declared `const`, `let`, and `var` names, and returns them into the current component context.

```html
<script define>
  const title = propsTitle || 'Default title'
  const contacts = { phone: '(800) 555-1212' }
</script>

<h2>{{title}}</h2>
<a href="tel:{{ CLEAN_PHONE(contacts.phone) }}">{{contacts.phone}}</a>
```

Keep `<script define>` side-effect-free. It runs inside Node during HTML transform.

Destructuring declarations are supported:

```html
<script define>
  const { title, image } = card
  const [firstItem] = items
</script>
```

Local declarations can shadow props or parent context values with the same name. They are private to the current component template and do not cascade into child components. If a child component needs a computed local value, pass it explicitly as a prop.

## Expressions

Use JavaScript expressions inside `{{ ... }}` in text and attributes:

```html
<h1>{{ title || 'Default title' }}</h1>
<div class="width-{{ Math.round(width) }}"></div>
<meta name="description" content="{{ DESCRIPTION }}">
```

Unknown identifiers resolve to `undefined` rather than throwing. Standard globals such as `Math` and `JSON` are usable.

Mustache interpolation is parsed with a tokenizer instead of a simple `[^}]` regex, so expressions may contain nested `{}`, `[]`, `()`, quoted strings, template literals, and regex literals:

```html
<title>{{ title ? `${title} | ${SITE_NAME}` : SITE_NAME }}</title>
<div data-config="{{ JSON.stringify({ title, options: { theme: 'dark' } }) }}"></div>
<p>{{ /\d{2,4}/.test(code) ? 'Valid' : 'Invalid' }}</p>
```

Dynamic attribute injection is supported when the whole attribute key is an expression that evaluates to an object:

```html
<button {{ { id: 'submit', 'data-state': state, disabled: !enabled } }}>
  Submit
</button>
```

False, null, and undefined attributes are omitted. Boolean `true` emits an empty attribute. `class` and `style` merge with existing values.

For `src="{{ image }}"`, if `image` is an object or first array item object, the compiler prefers `desktop` or `src`.

## Conditions

Use explicit condition blocks:

```html
<if condition="elementType == 'button'">
  <button type="button">{{children}}</button>
</if>
<elseif condition="elementType == 'link'">
  <a href="{{url}}">{{children}}</a>
</elseif>
<else>
  <span>{{children}}</span>
</else>
```

`elseif` and `else` must be adjacent siblings after the initial `if`; standalone `elseif` and `else` are skipped.

Attribute form is converted before condition processing:

```html
<div v-if="isActive">Active content</div>
```

The actual directive defaults in code are `v-if`, `v-for`, `v-range`, and `v-as`, while some docs may mention older `f-*` names. Check `htmlComposer.js` and `vueDirectives.js` if behavior seems inconsistent.

## Loops And Data

Use `<each>` for arrays, objects, JSON files, API URLs, and generated ranges:

```html
<each data="products.json" loop="product, index, length in data">
  <ProductCard product="{{product}}" index="{{index}}" length="{{length}}" />
</each>
```

JSON file paths are resolved inside `src/data`. Do not use traversal outside that directory. API URLs are fetched at transform time.

Loop syntax accepts:

```html
<each loop="item in ['apple', 'banana']">
  <li>{{item}}</li>
</each>

<each loop="value, key in objectMap">
  <div>{{key}}: {{value}}</div>
</each>
```

Vue-like directives convert to `<each>`:

```html
<div v-for="(item, index, length) in items">
  {{ index + 1 }} of {{ length }}: {{ item.name }}
</div>

<li v-range="1 to 5" v-as="i">Item {{ i }}</li>
```

`v-range` supports `start to end` and optional `step`, including negative steps when direction matches.

Negative start and end values are supported:

```html
<li v-range="-2 to 2" v-as="i">Item {{ i }}</li>
```

## Icon Component

Use the bundled `Icon` component for glyphs generated from `fonts-converter/icons`. The component maps `name` to the generated icon font class `_icon-name`.

```html
<Icon name="arrow-right" />
<Icon name="phone" class="text-primary" />
<UI.Icon name="phone" class="text-xl" label="Phone" />
```

The root output is an `<i>` tag. When `label` is omitted, the icon is decorative and receives `aria-hidden="true"`. Use `iconAttrs` for dynamic attributes:

```html
<Icon name="arrow-right" iconAttrs="{ 'data-icon': 'arrow-right' }" />
```

The icon names come from SVG file names before icon generation, preserving the generated class naming. For example, `fonts-converter/icons/arrow-right.svg` becomes `._icon-arrow-right`.

## Component Trace And Errors

Root config:

```js
componentsTrace: false, // false | 'dev' | 'all'
```

When enabled, component rendering emits HTML comments:

```html
<!-- fe-component-start: Demos.NamedSlotsDemo | /abs/path/NamedSlotsDemo.html | depth:0 -->
...
<!-- fe-component-end: Demos.NamedSlotsDemo | /abs/path/NamedSlotsDemo.html | depth:0 -->
```

`'dev'` emits comments only outside production. `'all'` keeps them in production too. The comment cleaner preserves only these `fe-component-*` comments when trace is enabled and removes ordinary HTML comments.

Template errors include contextual output:

```text
Failed to evaluate expression
Stage: expression
Component: Demos.NamedSlotsDemo
File: /abs/path/NamedSlotsDemo.html
Expression: title.toUpperCase()
Cause: Cannot read properties of undefined
Context keys: children, slots, title
Trace:
  - page (/abs/path/src/index.html)
```

Use this context to fix the component file or expression that actually failed. Production builds fail fast for these errors.

## Aliases

Common aliases from `template.config.js`:

- `@h`: `/html/`
- `@o`: `/html/other/`
- `@c`: `/html/components/`
- `@ui`: `/html/components/UI/`
- `@p`: `/pages/`
- `@j`: `/js/`
- `@s`: `/scss/`
- `@tw`: `/css/`
- `@i`: `/assets/img/`
- `@v`: `/assets/video/`
- `@f`: `/assets/fonts/`

Alias replacement happens after expression processing. Prefer aliases in template code when examples already use them.

## Styles

Sass uses Vite's modern compiler API and injects `@use "@s/inc" as *;` into SCSS. Shared variables, mixins, media helpers, containers, and params live under `src/scss/base` and `src/scss/settings`.

Tailwind is optional via `template.config.js` and `@tailwindcss/vite`; the template may also use generated CSS files in `src/css`.

PostCSS can convert px to rem and sort media queries in production based on `template.config.js`.

## Fonts And Icons

Place TTF font source files in `fonts-converter/`. Place SVG icons in `fonts-converter/icons/`. `yarn f` converts fonts to WOFF2 and generates font/icon SCSS/CSS/font files. `yarn i` only regenerates icons.

Generated outputs include files under `src/assets/fonts`, `src/scss/fonts`, `src/css/fonts`, `src/icons.html`, `src/assets/sprite.svg`, and `template_plugins/ifont-gen/build`. Avoid regenerating unless requested or necessary.

## PHP Mailer

When `isPHPMailer` is true, Vite copies `src/php` to `dist/php`. Use `yarn php` for workflows that need the PHP helper server plus Vite. Do not edit bundled PHPMailer vendor files unless the user explicitly asks.

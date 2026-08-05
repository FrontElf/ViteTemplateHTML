---
name: vite-template-html
description: Work with the FrontElf ViteTemplateHTML static-site build system. Use when editing or creating pages, layouts, HTML components, SCSS/CSS, data-driven blocks, or build configuration in projects that use Vite plus the custom htmlComposer syntax: basename and namespaced component tags from src/html, {{ JavaScript expressions }}, <script define>, named slots with <template slot> and <slot name>, <if>/<elseif>/<else>, <each>, v-if/v-for/v-range, <Icon name> for generated icon fonts, component trace comments, aliases from template.config.js, generated fonts/icons, PHPMailer assets, or the template_plugins workflow.
---

# Vite Template HTML

## Core Workflow

Start by reading the project-local files that define the current template behavior:

- `package.json` for scripts and dependency choices.
- `template.config.js` for feature flags, `componentsTrace`, aliases, HTMLVariables, style options, and PHP server settings.
- `vite.config.js` for the exact plugin pipeline and build output behavior.
- `template_plugins/html-composer/` when changing parsing, component inclusion, expressions, loops, conditions, aliases, or formatting.
- Existing files under `src/html/components`, `src/html/other`, `src/scss`, `src/css`, and `src/js` before adding new patterns.

For detailed syntax and project conventions, read `references/template-reference.md` when a task touches component syntax, data loops, aliases, scripts, style entrypoints, build commands, fonts/icons, or PHP mailer behavior.

## Editing Rules

Treat this as a static-site template with a custom HTML component compiler, not as React, Vue, Astro, or plain Vite HTML.

Keep entry pages in `src/*.html`. Place reusable components in `src/html/components/**/Name.html`; the HTML file basename is still a valid component tag, such as `Header.html` -> `<Header />`. Namespaced tags are also supported from component paths, such as `src/html/components/UI/Button/Button.html` -> `<UI.Button />` and `src/html/components/Demos/NamedSlotsDemo/NamedSlotsDemo.html` -> `<Demos.NamedSlotsDemo />`. Place shared non-component partials in `src/html/other`.

Use existing aliases from `template.config.js` instead of hard-coded deep paths when the surrounding code does so. Common aliases include `@h`, `@o`, `@c`, `@ui`, `@j`, `@s`, `@tw`, `@i`, `@v`, and `@f`.

When adding a component with styles, follow the nearby pattern: `Component.html` plus colocated `component.scss` for component folders, then ensure the SCSS is reachable through the existing SCSS entry/import structure if the template does not auto-include it.

Use `{{ ... }}` for JavaScript expressions in text and attributes. Mustache interpolation is tokenized, so nested braces, arrays, objects, strings, template literals, and regex literals inside expressions are supported. Missing identifiers evaluate as `undefined`, so default values like `{{ title || 'Default title' }}` are valid.

Use `<script define>` at the top of a component for local constants that should be available only inside that component template. These variables do not cascade into child components; pass a value explicitly as a prop when a child needs it. Keep it deterministic and side-effect-free because it is evaluated at build/dev transform time. Variable declarations are parsed with Acorn, so destructuring declarations are supported.

Prefer the established syntax for conditional rendering and loops:

- Blocks: `<if condition="...">`, adjacent `<elseif condition="...">`, `<else>`.
- Attributes: `v-if="..."`, `v-for="(item, index, length) in items"`, `v-range="1 to 5" v-as="i"`.
- Data files: put JSON under `src/data` and load with `<each data="file.json" loop="item, index in data">`.

Pass default child HTML through `{{children}}` inside component files. Pass named slots with `<template slot="name">...</template>` in the component call, and render them in component files with `<slot name="name">fallback</slot>`. The `slots.name` object is also available for advanced expression use. Component attributes become props for the receiving component only. Use `deep:name="value"` when a prop must continue into nested components; descendants receive it as `name`. Prefer lowercase prop names in HTML demos and template APIs; HTML parsing can normalize attribute casing. Literal `"true"` and `"false"` props are normalized to booleans before component rendering; object and array-looking prop strings can be evaluated as JavaScript expressions.

Use `<Icon name="arrow-right" />` or `<UI.Icon name="arrow-right" />` for generated icon font glyphs instead of hand-writing `<i class="_icon-arrow-right">`. `name` maps to `_icon-name`; pass `class`, `className`, `label`, `hidden`, and `iconAttrs` when needed.

Use `componentsTrace: false | 'dev' | 'all'` at the root of `template.config.js` to toggle source-map-like component comments. Keep it `false` unless debugging component origin.

## Validation

Use the repo scripts:

- `yarn d` starts config generation and Vite dev.
- `yarn b` builds to `dist`.
- `yarn p` previews the build.
- `yarn f` regenerates converted fonts and icon font.
- `yarn i` regenerates only the icon font.
- `yarn php` starts the PHP helper server plus Vite when PHPMailer behavior matters.

For ordinary HTML/component/style changes, run `yarn b` when dependencies are installed. Production builds intentionally fail fast on template errors and include contextual error output with stage, component, file, expression, context keys, and trace. If the task is visual or layout-sensitive, also run the dev server and inspect the page in a browser.

Do not run font/icon generation unless the task actually changes `fonts-converter` assets or generated font/icon output. Those commands update many generated files.

## Guardrails

Do not replace htmlComposer with a framework compiler unless explicitly requested. Do not rewrite existing generated assets by accident. Do not remove project documentation examples just because they contain older wording; they are part of the template reference surface.

Respect dirty worktrees. Generated files such as icon fonts, sprite files, sessions, and converted fonts may already be modified by the user.

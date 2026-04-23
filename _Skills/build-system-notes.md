# ViteTemplateHTML Build + HTML Composer Notes

Це внутрішня пам'ятка для роботи з цією збіркою.

## 1) Загальна архітектура

- Бандлер: `vite`.
- Вхідні HTML: усі `*.html` тільки з кореня `src/` (не рекурсивно), через `template_plugins/html-entry-files.js`.
- Кастомна HTML-логіка: `template_plugins/html-composer/`.
- Основні перемикачі/флаги: `template.config.js`.
- Підключення плагінів: `modules.js` + `vite.config.js`.

## 2) Порядок обробки HTML (критично)

`template_plugins/html-composer/htmlComposer.js`:

1. `parser(fixSelfClosingComponents(...))`
2. `processVueDirectives` (`v-if`, `v-for`, `v-range`, `v-as`)
3. `processConditions` (`if/elseif/else`)
4. `processEach` (`<each ...>`)
5. `includeComponents` (підстановка `<Header />`, `<Button />` тощо)
6. `processExpressions` (`{{ ... }}` у тексті та атрибутах)
7. `replaceAliases` (`@c/...`, `@ui/...`)
8. кастомні `plugins` (якщо передані)
9. `moveStylesToHead`
10. `render`
11. `removeHtmlComments`
12. `formatHtml` (тільки `NODE_ENV=production`)

Висновок: якщо щось залежить від `{{...}}`, воно підставляється після інклуду компонентів.

## 3) Компоненти: як резолвляться

- Компонентна мапа будується з `src/html/**/*.html`.
- Ключ мапи = basename файлу без розширення.
  - Приклад: `src/html/components/Header/Header.html` -> тег `<Header />`.
- Колізії імен можливі, якщо два файли мають однаковий basename у різних папках.
- Самозакривальні теги компонентів перетворюються в `<Comp></Comp>`.
- Якщо тег з великої літери не знайдений у мапі, виводиться warning-блок у HTML (налаштовується).

## 4) Пропси і контекст компонента

У `includeComponents`:

- `tree.attrs` => props компонента.
- Значення `'true'/'false'` нормалізуються до `boolean`.
- Якщо prop-рядок починається з `{` або `[`, виконується як JS-вираз (`evalExpression`), тому може стати об'єктом/масивом.
- `children` передається окремо.

Контексти:

- `availableContext` для `<script define>`: `global context + props + children`.
- `localContext` збирається з `const/let/var` у `<script define>`.
- фінальний `componentContext`: `global context + localContext + props + children`.
  - Явно передані props перекривають однойменні локальні/глобальні значення.

## 5) `<script define>` у компонентах

- Працює всередині файлу компонента.
- Виконується як JS-код через `new Function`.
- У результат контексту потрапляють тільки оголошені `const/let/var`.
- Коментарі у скрипті попередньо видаляються regex-ами.

## 6) Вирази `{{ ... }}`

`template_plugins/html-composer/utils/expressions.js`:

- У тексті: `{{ expr }}` обчислюється і вставляється.
- В атрибутах-значеннях:
  - `attr="{{expr}}"` -> повна заміна значення.
  - `attr="x {{expr}} y"` -> часткова інтерполяція.
- Спецкейс `src`: якщо результат об'єкт/масив об'єктів, бере `desktop || src`.

### Динамічні атрибути через ключ `{{prop}}`

- Патерн: `<div {{customAttrs}} class="x">`.
- Якщо `customAttrs` -> об'єкт, інжектяться атрибути об'єкта.
- Нормалізація:
  - `null/undefined/false` пропускаються.
  - `true` -> boolean-атрибут (`disabled=""`).
  - `class` мерджиться.
  - `style` мерджиться.

## 7) Директиви і цикли

### Vue-подібні директиви

- `v-if="cond"` -> `<if condition="cond">`.
- `v-for="(item, index, length) in source"` -> `<each loop="...">`.
- `v-range="1 to 10 step 2" v-as="i"` -> `<each ...>` з прегенерованим масивом.

### `<each>`

- Формати `loop`:
  - `(item, index, length) in expr`
  - `item in expr`
- `data="test-data.json"`:
  - резолв у `src/data/test-data.json`
  - є перевірка, щоб шлях не виходив за `src/data`.
- `data` може бути:
  - об'єкт/масив,
  - URL (`http/https`, fetch),
  - локальний JSON-файл.

## 8) Aliases

- Після всіх виразів проходить `replaceAliases`.
- Заміна йде в атрибутах рядків за `template.config.js -> aliases`.
- Типові: `@c`, `@ui`, `@s`, `@i`, тощо.

## 9) Робота зі стилями

- Компоненти часто мають `<link rel="stylesheet" href="@c/...scss" />`.
- `moveStylesToHead` збирає всі stylesheet-лінки та переносить в `<head>`.
- Дублі відсікаються за `href`.

## 10) Інші плагіни збірки (vite.config.js)

- `custom-hmr`: для `.html`/`.json` робить full reload.
- `dev-navigation`: меню сторінок у dev.
- `dev-sessions`: трекає dev-сесії у `template_plugins/sessions/sessions.json`.
- `image-optimizer` (build): оптимізує jpg/png + генерує webp + переписує html/css.
- `copy-assets` (build): копіює директорії (наприклад PHP).
- `svg-inline-sprite` (build): замінює inline `<svg>` на sprite `<use>`.

## 11) Практичні правила при змінах

- Не ламати порядок стадій у `htmlComposer.js` без необхідності.
- Перед додаванням нового синтаксису перевіряти, на якій стадії він має відпрацювати.
- Уникати дублікатів basename для компонентів.
- Для передачі набору HTML-атрибутів використовувати об'єкт + `{{propName}}` у потрібному тегу компонента.
- Якщо щось не рендериться, спершу перевіряти:
  1. чи компонент реально є в мапі;
  2. чи вираз не повернув `null`;
  3. чи атрибут не був очищений `setAttribute`;
  4. чи alias застосувався після рендера виразів.

## 12) Де дивитися приклади в проєкті

- Головний сценарій: `src/index.html`
- Layout pattern: `src/html/layouts/MainLayout.html`
- Тести директив/циклів: `src/html/components/Tests/Tests.html`
- Тести передачі атрибутів: `src/html/components/AttrTest/AttrTest.html`
- Приклад `<script define>`: `src/html/components/PreviewHero/PreviewHero.html`

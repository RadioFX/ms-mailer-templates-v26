# ms-mailer-templates-v26

RadioFX's own email templates package, used by `ms-mailer-v26`, `ms-users-v26`, and `rfx-api-v26`.

This replaces the public `ms-mailer-templates` npm package (a RadioFX-owned fork of
`makeomatic/ms-mailer-templates`) with a fresh, independent repository. This repo is **not** a fork -
it was seeded from the content of that fork's clone, but has its own git history and is maintained
independently going forward.

Uses the Foundation "ink" framework by Zurb for basic responsive email layout, plus a small
`radiofx.css` stylesheet for RadioFX-branded elements (header logo, CTA button, etc).

## Installation

This package is **not published to npm**. Consuming services install it directly as a git
dependency, e.g. in `package.json`:

```json
"dependencies": {
  "ms-mailer-templates-v26": "github:RadioFX/ms-mailer-templates-v26#v1.0.0"
}
```

Because there is no `npm publish` step for a git dependency, the compiled output
(`build/templates/*.html` and `lib/index.js`) is **committed directly to this repo** rather than
gitignored. `src/` remains the editable source of truth - if you change anything under `src/`,
re-run the build (see below) and commit the regenerated `build/` and `lib/` output in the same
commit.

## Usage

```js
const render = require('ms-mailer-templates-v26');

const ctx = { link: 'http://localhost', qs: '?token=xxxxx', firstName: 'Indiana' };
render('rfx-activate', ctx, optionalHandlebarsOpts)
  .then(html => {
    // rendered HTML string
  });
```

`render(templateName, context, opts?)` returns a Bluebird promise. It rejects with a
`NotFoundError` for an unknown template name, and a `TypeError` if `context` isn't an object.

## Existing templates

`src/templates/` contains the full set of templates inherited from the original package
(`rfx-*`, `cpst-*`, `rr-*`, plus bare `password.html` / `reset.html`), kept as-is even though not
every one is necessarily still referenced by current RadioFX code - other application code outside
this repo may depend on them, so nothing was trimmed in this pass.

Two templates were added for the "team join request" feature, following the same visual structure
as `rfx-invite.html` / `rfx-activate.html` (RadioFX logo header, `radiofx.css` button/typography
classes):

- `rfx-join-approved.html` - context: `{ firstName, stationName, link, qs }`
- `rfx-join-rejected.html` - context: `{ firstName, stationName }`

## Build

```
npm install
npm run build     # gulp production -> build/templates/*.html, build/css/*.css (CSS inlined into HTML)
npm run compile   # babel ./src -d ./lib -> lib/index.js (plain commonjs, used at require-time)
```

### Notes on the build pipeline

The original `gulp production` toolchain (gulp 4, `gulp-inline-source`, `gulp-inline-css`,
`gulp-htmlmin`, `gulp-imagemin`) still runs on modern Node and was kept as-is, with two changes:

1. **Removed the `gulp-connect` dev preview server** (`exports.connect` / `watch` task) - it was
   dead weight in an installed dependency and isn't needed to produce `build/`. The
   `clean` / `css` / `imagemin` / `templatesProduction` / `production` tasks that actually produce
   build output were kept.
2. **Fixed a pre-existing race condition**: `clean` (which deletes `build/` and `preview/`) used to
   be re-invoked inside several sub-tasks that all ran under the same top-level `parallel()`. That
   meant one task's `clean` could delete `build/` while another task was still writing files into
   it, causing intermittent `ENOENT` failures. `clean` is now only ever run once, in `series()`
   before the parallel `templatesProduction` / `css` / `imagemin` tasks.

The babel step needed one fix: `.babelrc` referenced `@babel/plugin-proposal-object-rest-spread`
and `@babel/plugin-proposal-class-properties`, which no longer exist under those names in current
`@babel/*` releases. Updated to the current equivalents,
`@babel/plugin-transform-object-rest-spread` and `@babel/plugin-transform-class-properties`
(`package.json` devDependencies updated to match). No other changes were needed - `src/index.js`
is unchanged in behavior, only auto-fixed for one lint rule (`arrow-parens`).

Both `npm run build` and `npm run compile` were verified to produce working, non-empty output, and
`render()` was manually exercised against `rfx-activate`, `rfx-invite`, `rfx-join-approved`, and
`rfx-join-rejected` to confirm the Handlebars context substitutes correctly. The existing
`test/index.js` mocha suite (4 tests) passes unchanged.

## Roadmap

1. Prune unused templates (deferred - out of scope for this pass, some may still be referenced by
   application code not visible from this repo)
2. Consider a dependency upgrade / build tooling modernization (deferred, out of scope for this pass)

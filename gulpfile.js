const {
  dest, src, series, parallel,
} = require('gulp');
const inlinesource = require('gulp-inline-source');
const inlineCss = require('gulp-inline-css');
const imagemin = require('gulp-imagemin');
const pngcrush = require('imagemin-pngcrush');
const del = require('del');
const preprocess = require('gulp-preprocess');
const htmlmin = require('gulp-htmlmin');
const Datauri = require('datauri');

const paths = {
  styles: 'styles/*.css',
  images: 'images/*',
  dist: 'build/',
  preview: 'preview/',
  tmp: 'tmp/',
  templates: 'src/templates/**.html',
  filesToMove: 'src/css/**.css',
};

// data uri part
function toBase64(path, env) {
  return env === 'production' ? new Datauri(`${__dirname}/path`).content : path;
}

// clean
// NOTE: clean is only ever invoked once, at the start of `production` (see
// below). Previously it was re-bound into several sub-tasks that all ran
// under a single `parallel()`, which meant multiple concurrent `del` calls
// could wipe out `build/` while another task was still writing into it -
// a flaky race condition. Keeping a single top-level clean avoids that.
exports.clean = del.bind(null, [paths.dist, paths.preview]);

// move css
exports.css = function moveStyles() {
  return src(paths.filesToMove)
    .pipe(dest(`${paths.dist}css`))
    .pipe(dest(`${paths.preview}css`));
};

// minify images
exports.imagemin = function minifyImages() {
  return src(paths.images)
    .pipe(imagemin({
      use: [pngcrush()],
    }))
    .pipe(dest(`${paths.preview}images`));
};

// production templates
exports.templatesProduction = function buildProdTemplates() {
  return src(paths.templates)
    .pipe(preprocess({ context: { NODE_ENV: 'production', toBase64 }, extension: '.html' }))
    .pipe(inlinesource({
      swallowErrors: false,
      rootpath: `${__dirname}/src`,
    }))
    .pipe(inlineCss({
      removeLinkTags: false,
      preserveMediaQueries: true,
    }))
    .pipe(htmlmin({ removeComments: true, collapseWhitespace: true, minifyCSS: true }))
    .pipe(dest(`${paths.dist}templates`));
};

exports.production = series(
  exports.clean,
  parallel(exports.templatesProduction, exports.css, exports.imagemin),
);

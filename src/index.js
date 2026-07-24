/**
 * This is a small helper, which allows you
 * to pickup email templates from a build folder
 * and then render it into HTML with a passed context
 */

// init, it's sync, done once on startup
const Promise = require('bluebird');
const Errors = require('common-errors');
const hbs = require('handlebars');
const fs = require('fs');
const path = require('path');

const templateDirectory = path.resolve(__dirname, '../build/templates');
const ext = '.html';

// read templates
const templates = {};
fs.readdirSync(templateDirectory)
  .filter((filename) => path.extname(filename) === ext)
  .forEach((filename) => {
    templates[path.basename(filename, ext)] = hbs.compile(fs.readFileSync(`${templateDirectory}/${filename}`, 'utf-8'));
  });

// public API
module.exports = function renderEmailTemplate(templateName, context, opts = {}) {
  const template = templates[templateName];
  if (!template) {
    return Promise.reject(new Errors.NotFoundError(templateName));
  }

  if (!context || typeof context !== 'object') {
    return Promise.reject(new Errors.TypeError('context must be an object'));
  }

  return Promise.try(function tryRendering() {
    return template(context, opts);
  });
};

'use strict';

var crypto = require('crypto');
var utils = require('./utils');

function Cache(orchestrator) {
  this.fnCache = {};
  this.orchestrator = orchestrator;
}

/**
 * Function for getting fn from cache, or if fn doesn't exists in cache,
 * then new wrapped around that function will be made.
 *
 * We need wrapper because we save metadata to Function object.
 * We should not write on original Function object.
 *
 * @returns {Function}
 *
 * @api private
 */

Cache.prototype.get = function (fn) {
  var key = fn.toString();
  // TODO: check performance
  key = crypto.createHash('md5').update(key).digest('hex');

  if (!this.fnCache[key]) {
    if (utils.isGeneratorFunction(fn)) {
      this.fnCache[key] = function * () {
        return yield fn.apply(fn, arguments);
      };
    } else {
      this.fnCache[key] = function () {
        return fn.apply(fn, arguments);
      };
    }
  }

  this.fnCache[key] = this.orchestrator.metadata.create(this.fnCache[key]);
  return this.fnCache[key];
};

module.exports = Cache;
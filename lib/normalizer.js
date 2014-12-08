'use strict';

var utils = require('./utils');
var co = require('co');

function Normalizer(orchestrator) {
  this.orchestrator = orchestrator;
}

/**
 * Function for preparing Function object.
 * This function is converting another function to promise,
 * wrapping generator into co, or creating metadata for function
 *
 * @return {Function}
 *
 * @api private
 */

Normalizer.prototype.normalizeFn = function (fn) {
  var orchestrator = this.orchestrator;

  if (!fn.meta) {
    fn = orchestrator.metadata.create(fn);
  }

  if (utils.isGeneratorFunction(fn)) {
    var promise = co.wrap(fn);
    promise = orchestrator.metadata.copy(fn, promise);
    return promise;
  }

  return fn;
};

Normalizer.prototype.normalizeResult = function (result) {
  var orchestrator = this.orchestrator;

  // check if result if trusted Promise
  if (utils.isPromise(result)) {
    return result.then(function (_result) {
      return _result;
    });
  }

  return result;
};

module.exports = Normalizer;
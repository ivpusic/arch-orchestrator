'use strict';

var utils = require('./utils');

function Redirect(orchestrator) {
  this.orchestrator = orchestrator;
  this.cache = orchestrator.cache;
}

Redirect.prototype.redirectTo = function (fns, redirectDestination) {
  var stack = this.orchestrator.stack;
  var cache = this.orchestrator.cache;
  var currentFn = this.orchestrator.currentFn();

  currentFn.meta[redirectDestination] = fns.map(function (fn) {
    utils.assertIsFnValid(fn);
    return cache.get(fn);
  });

  return this.orchestrator;
};

Redirect.prototype.argsTo = function () {
  var fns = Array.prototype.slice.apply(arguments);
  var metaAttr = 'argsTo';
  return this.redirectTo(fns, metaAttr);
};

Redirect.prototype.resultTo = function () {
  var fns = Array.prototype.slice.apply(arguments);
  var metaAttr = 'resultTo';
  return this.redirectTo(fns, metaAttr);
};

/**
 * Function to prepending arguments to some set of functions
 * This function will resolve do we need to prepend arguments to some functions,
 * based on passed metadata.
 *
 * @params {Array} args Array of arguments to prepend
 * @params {Object} metadata Metadata by which we will decide
 * if we need to prepend arguments to some functions
 *
 * @returns
 *
 * @api private
 */

Redirect.prototype.prependArgs = function (args, metadata) {
  if (metadata.argsTo) {
    metadata.argsTo.forEach(function (fn) {
      if (!fn.meta.args) {
        fn.meta.args = args.slice();
      } else {
        fn.meta.args = fn.meta.args.concat(args.slice());
      }
    });
  }
};

/**
 * Same as prependArgs fn
 */

Redirect.prototype.prependResult = function (result, metadata) {
  if (metadata.resultTo) {
    metadata.resultTo.forEach(function (fn) {
      if (!fn.meta.args) {
        fn.meta.args = result;
      } else {
        fn.meta.args = fn.meta.args.concat(result);
      }
    });
  }
};

/**
 * Function which is called when we want use result from current
 * chain function as final. Chain will went normal,
 * but final returned result from function will be located in orchestrator.result
 */

Redirect.prototype.resultToEnd = function (next) {
  var orchestrator = this.orchestrator;

  return function () {
    orchestrator.result = arguments;
    return next.apply(next, arguments);
  };
};

module.exports = Redirect;

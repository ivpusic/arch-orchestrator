'use strict';

var utils = require('./utils');
var co = require('co');
var bb = require('bluebird');

/**
 * After all functions of chain are executed,
 * we need to return result to caller
 *
 * @api private
 */

function chainEnd() {
  var result;

  if (arguments.length > 1) {
    result = Array.prototype.slice.apply(arguments);
  } else if (arguments.length === 1) {
    result = arguments[0];
  }

  return result;
}

/**
 * Wrapper for all chain functions.
 * If return promise of chain part is chain,
 * then function waits for result, and then returns result to caller
 *
 * @params {Function} fn Current function in chain
 * @params {Function} next Next function in chain
 *
 * @api private
 */

function chainFnWrapper(fn, next) {
  return function () {
    var args = Array.prototype.slice.apply(arguments);
    args.unshift(next);

    var res = fn.apply(fn, args);

    // check if result if trusted Promise
    if (bb.is(res)) {
      return res.then(function (result) {
        return result;
      });
    }

    return res;
  };
}

/**
 * Main Orchestrator constructor
 */

function Orchestrator(opts) {
  if (this instanceof Orchestrator) {
    opts = opts || {};

    this.stack = [];
    return this;
  }

  return new Orchestrator(opts);
}

/**
 * Function for setting next chain part
 *
 * @param {Function} fn Function which will be next in chain
 * @return {Object} current orchestrator instance
 *
 * @api public
 */

Orchestrator.prototype.setNext = function (fn) {
  utils.assertIsFnValid(fn);

  this.stack.push(fn);
  return this;
};

/**
 * Function for breaking up chain.
 * After this method is called, you will get function which is
 * composed of all passed functions to setNext method
 *
 * @return {Function}
 *
 * @api public
 */

Orchestrator.prototype.end = function () {
  var i = this.stack.length;
  var current = null;
  var next = chainEnd;

  while (i--) {
    var fn = this.stack[i];

    if (utils.isGeneratorFunction(fn)) {
      var promise = bb.promisify(co(fn));
      fn = promise;
    }

    current = chainFnWrapper(fn, next);
    next = current;
  }

  return current;
};

/**
 * Expose orchestrator constructor
 */

module.exports = Orchestrator;

'use strict';

var utils = require('./utils');
var Cache = require('./cache');
var Redirect = require('./redirect');
var Metadata = require('./metadata');
var Normalizer = require('./normalizer');

/**
 * After all functions of chain are executed,
 * we need to return result to caller
 *
 * @api private
 */

function chainEnd() {
  /*jshint validthis:true */
  var orchestrator = this;
  var result = orchestrator.result || arguments;

  if (result.length > 1) {
    return Array.prototype.slice.apply(result);
  }

  if (result.length === 1) {
    return result[0];
  }
}

function downstreamResult(result, toFn, metadata) {
  /*jshint validthis:true */
  var orchestrator = this;

  if (metadata.resultTo) {
    // argument of metadata.retulsTo functions will be
    // the same as result of current function -> only this step of chain
    orchestrator.redirect.prependResult(result, metadata);
  }

  // downstream result
  result = toFn.call(toFn, result);
  return orchestrator.normalizer.normalizeResult(result);
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
  /*jshint validthis:true */
  var orchestrator = this;

  // wrapper around actual function call
  return function () {
    var args;
    var metadata = fn.meta;

    // if there are arguments already prepared for this function
    if (metadata.args) {
      args = metadata.args.slice();
      metadata.args = null;
    } else {
      args = Array.prototype.slice.apply(arguments);
    }

    // if we need to set arguments for some other functions
    orchestrator.redirect.prependArgs(args, metadata);

    var res = fn.apply(fn, args);
    if (res.then) {
      return res.then(function (_res) {
        return downstreamResult.call(orchestrator, _res, next, metadata);
      });
    }

    return downstreamResult.call(orchestrator, res, next, metadata);
  };
}

/**
 * Main Orchestrator constructor
 */

function Orchestrator(opts) {
  if (this instanceof Orchestrator) {
    opts = opts || {};

    this.stack = [];
    this.result = null;
    this.finalResultIndex = null;

    this.cache = new Cache(this);
    this.redirect = new Redirect(this);
    this.metadata = new Metadata(this);
    this.normalizer = new Normalizer(this);

    return this;
  }

  return new Orchestrator(opts);
}

/**
 * Get last pushed fn to stack
 * If stack is empty it returns null
 */

Orchestrator.prototype.currentFn = function () {
  if (this.stack.length === 0) {
    return null;
  }

  return this.stack[this.stack.length - 1];
};

/**
 * Function for setting next chain part
 *
 * Function will set appropriate metadata to wrapped functions
 * Note that this function won't set any data to original Function object
 *
 * @param {Function} fn Function which will be next in chain
 * @return {Object} current orchestrator instance
 *
 * @api public
 */

Orchestrator.prototype.setNext = function (fn) {
  utils.assertIsFnValid(fn);
  fn = this.cache.get(fn);
  fn = this.normalizer.normalizeFn(fn);

  var previous = this.currentFn();
  fn.meta.previous = previous;

  if (previous) {
    previous.meta.next = fn;
  }

  this.stack.push(fn);

  return this;
};

/**
 * We can say for some chain function result to be used as final
 */

Orchestrator.prototype.asResult = function () {
  this.finalResultFn = this.currentFn();

  return this;
};

/**
 * We can say that we want redirect arguments (except next) of this function
 * to some other functions
 *
 * @params {Array} Array of function for will arguments will be setted.
 */

Orchestrator.prototype.argsTo = function () {
  return this.redirect.argsTo.apply(this.redirect, arguments);
};

/**
 * With this method you set result of some chain function to be argument of some other chain function
 */

Orchestrator.prototype.resultTo = function () {
  return this.redirect.resultTo.apply(this.redirect, arguments);
};

/**
 * Function for breaking up chain.
 * After this method is called, you will get function which is
 * composed of all passed functions to setNext method
 *
 *
 * @return {Function}
 *
 * @api public
 */

Orchestrator.prototype.end = function () {
  var current = null;
  var next = chainEnd.bind(this);
  var fn = this.currentFn();

  // until end of chain is not reached
  while (true) {
    // case when asResult function is called
    // in that case we need to mark result as final for current function
    if (fn === this.finalResultFn) {
      next = this.redirect.resultToEnd(next);
    }

    current = chainFnWrapper.call(this, fn, next);
    next = current;

    if (fn.meta.previous) {
      fn = fn.meta.previous;
    } else {
      break;
    }
  }

  return current;
};

/**
 * Expose orchestrator constructor
 */

module.exports = Orchestrator;

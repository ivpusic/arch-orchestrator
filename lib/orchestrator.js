'use strict';

var utils = require('./utils');
var co = require('co');
var bb = require('bluebird');
var crypto = require('crypto');

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

/**
 * Function for getting fn from cache, or if fn doesn't exists in cache,
 * then new wrapped around that function will be made.
 *
 * We need wrapper because we save __metadata__ to Function object.
 * We should not write on original Function object.
 *
 * @returns {Function}
 *
 * @api private
 */

function getFromCache(fn) {
  /*jshint validthis:true */
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

  return this.fnCache[key];
}

/**
 * Creating metadata object for function
 *
 * @returns {Function} with metadata
 *
 * @api private
 */

function createMetadata(fn) {
  fn.__metadata__ = {};

  return fn;
}

/**
 * Copying metadata to another function
 *
 * @returns {Function} Function which holds copyed metadata
 *
 * @api private
 */

function copyMetadata(from, to) {
  to.__metadata__ = from.__metadata__;
  to.__metasource__ = from;
  return to;
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
    var args;
    var metadata = fn.__metadata__;

    // if there are arguments already prepared for this function
    if (metadata.args) {
      args = metadata.args;
    } else {
      args = Array.prototype.slice.apply(arguments);
    }

    // if we need to set arguments for some other functions
    if (metadata.tapTo) {
      metadata.tapTo.forEach(function (fnToTap) {
        fnToTap.__metadata__.args = args.slice();
      });
    }

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
 * Function which is called when we want use result from current
 * chain function as final. Chain will went normal,
 * but final returned result from function will be located in orchestrator.result
 */

function nextAsFinalWrapper(next) {
  /*jshint validthis:true */
  var orchestrator = this;

  return function () {
    orchestrator.result = arguments;
    return next.apply(next, arguments);
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
    this.tapToNextIndexes = [];
    this.fnCache = {};

    return this;
  }

  return new Orchestrator(opts);
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

function normalize(fn) {
  if (!fn.__metadata__) {
    fn = createMetadata(fn);
  }

  if (utils.isGeneratorFunction(fn)) {
    var promise = bb.promisify(co(fn));
    promise = copyMetadata(fn, promise);
    return promise;
  }

  return fn;
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
  fn = getFromCache.call(this, fn);
  fn = normalize(fn);

  this.stack.push(fn);
  return this;
};

/**
 * We can say for some chain function result to be used as final
 */

Orchestrator.prototype.asResult = function () {
  this.finalResultIndex = this.stack.length;

  return this;
};

/**
 * We can say that we want redirect arguments (except next) of this function
 * to some other functions
 *
 * @params {Array} Array of function for will arguments will be setted.
 */

Orchestrator.prototype.tapTo = function () {
  var currentFn = this.stack[this.stack.length - 1];
  var fns = Array.prototype.slice.apply(arguments);
  var orchestrator = this;

  currentFn.__metadata__.tapTo = fns.map(function (fn) {
    utils.assertIsFnValid(fn);
    return getFromCache.call(orchestrator, fn);
  });

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
  var next = chainEnd.bind(this);

  while (i--) {
    var fn = this.stack[i];

    // case when asResult function is called
    // in that case we need to mark result as final for current function
    if (i + 1 === this.finalResultIndex) {
      next = nextAsFinalWrapper.call(this, next);
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

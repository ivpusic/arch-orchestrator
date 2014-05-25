'use strict';

var utils = require('./utils');

/**
 * After all functions of chain are executed,
 * we need to return result to caller
 *
 * @api private
 */

function chainEnd(result) {
  return result;
}

/**
 * Main Orchestrator constructor
 */

function Orchestrator(opts) {
  if (this instanceof Orchestrator) {
    opts = opts || {};

    this.logger = opts.logger;
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
    current = this.stack[i];
    current = current.bind(current, next);

    next = current;
  }

  return current;
};

/**
 * Expose orchestrator constructor
 */

module.exports = Orchestrator;

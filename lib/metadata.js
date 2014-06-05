'use strict';

function Metadata(orchestrator) {
	this.orchestrator = orchestrator;
}

/**
 * Creating metadata object for function
 *
 * @returns {Function} with metadata
 *
 * @api private
 */

Metadata.prototype.create = function (fn) {
  fn.meta = {};

  return fn;
};

/**
 * Copying metadata to another function
 *
 * @returns {Function} Function which holds copyed metadata
 *
 * @api private
 */

Metadata.prototype.copy = function (from, to) {
  to.meta = from.meta;
  to.meta_source = from;
  return to;
};

module.exports = Metadata;
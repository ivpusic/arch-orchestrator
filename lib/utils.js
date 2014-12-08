'use strict';

var assert = require('assert');

function isFunction(fn) {
  return fn instanceof Function;
}

function isGeneratorFunction(fn) {
  return fn && fn.constructor && fn.constructor.name === 'GeneratorFunction';
}

function isPromise(object) {
    return object && typeof(object.then) === "function";
}

/**
 * User must provide normal or generator function
 * Otherwise error will be thrown
 */

module.exports.assertIsFnValid = function (fn) {
  assert(isFunction(fn) || isGeneratorFunction(fn),
    'You must provide function or generator function to this method!');
};

module.exports.isFunction = isFunction;
module.exports.isGeneratorFunction = isGeneratorFunction;
module.exports.isPromise = isPromise;

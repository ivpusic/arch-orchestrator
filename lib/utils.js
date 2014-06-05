'use strict';

var assert = require('assert');

function isFunction(fn) {
  return fn instanceof Function;
}

function isGeneratorFunction(fn) {
  return fn && fn.constructor && fn.constructor.name === 'GeneratorFunction';
}

module.exports.assertIsFnValid = function (fn) {
  assert(isFunction(fn) || isGeneratorFunction(fn),
    'You must provide function or generator function to this method!');
};

module.exports.isFunction = isFunction;
module.exports.isGeneratorFunction = isGeneratorFunction;

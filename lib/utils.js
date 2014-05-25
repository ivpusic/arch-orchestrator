'use strict';

var assert = require('assert');

function isFunction(fn) {
  return fn instanceof Function;
}

function isGeneratorFunctio(fn) {
  return fn && fn.constructor && fn.constructor.name === 'GeneratorFunction';
}

module.exports.assertIsFnValid = function (fn) {
	assert(isFunction(fn) || isGeneratorFunctio(fn),
		'You must provide function or generator function to this method!');
};
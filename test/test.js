'use strict';

require('co-mocha');
var orchestrator = require('..');

function isFunction(fn) {
  var getType = {};
  return fn && getType.toString.call(fn) === '[object Function]';
}

function fn1(next, arg) {
  return next(arg + 100);
}

function fn2(next, arg) {
  return next(arg + 200);
}

function fn3(next, arg) {
  return next(arg + 300);
}

function first(next) {
  return next('first');
}

function second(next) {
  return next('second');
}

function third(next) {
  return next('third');
}

function * firstGen(next, arg) {
  return next(arg + 1);
}

function * secondGen(next, arg) {
  return next(arg + 10);
}

function * thirdGen(next, arg) {
  return next(arg + 10);
}

function fnMultipleArgs1(next, arg1, arg2) {
  arg1 += 1;
  arg2 += 2;

  return next(arg1, arg2);
}

function fnMultipleArgs2(next, arg1, arg2) {
  arg1 += 3;
  arg2 += 4;

  return next(arg1, arg2);
}

describe('arch-orchestrator', function () {
  var fn;

  it('should be able to compose functions', function () {
    fn = orchestrator()
      .setNext(fn1)
      .setNext(fn2)
      .setNext(fn3)
      .end();

    isFunction(fn).should.be.ok;
  });

  it('should be able to use result from multiple functions', function () {
    var res = fn(0);
    res.should.be.exactly(600);
  });

  it('should be able to switch order of functions', function () {
    fn = orchestrator()
      .setNext(fn3)
      .setNext(fn1)
      .end();

    isFunction(fn).should.be.ok;
  });

  it('should be able to use result from different order then initial', function () {
    var res = fn(1000);
    res.should.be.exactly(1400);
  });

  it('should throw error if neither Function or GeneratorFunction is provided as setNext callback', function (done) {
    try {
      orchestrator()
        .setNext('should fail')
        .end();
    } catch (ex) {
      done();
    }
  });

  it('should throw error is end function is not called', function (done) {
    fn = orchestrator()
      .setNext(fn1)
      .setNext(fn2);

    try {
      fn(10);
    } catch (ex) {
      done();
    }
  });

  it('should return null is none function are provided to setNext', function () {
    fn = orchestrator()
      .end();

    (fn === null).should.be.ok;
  });

  it('should call functions in defined order', function () {
    fn = orchestrator()
      .setNext(first)
      .setNext(second)
      .end();

    var res = fn();
    res.should.be.exactly('second');

    fn = orchestrator()
      .setNext(second)
      .setNext(first)
      .setNext(third)
      .end();

    res = fn();
    res.should.be.exactly('third');

    fn = orchestrator()
      .setNext(second)
      .setNext(first)
      .end();

    res = fn();
    res.should.be.exactly('first');
  });

  it('should be able to compose multiple generator functions', function * () {
    fn = orchestrator()
      .setNext(firstGen)
      .setNext(secondGen)
      .setNext(thirdGen)
      .end();

    var res = yield fn(10);
    res.should.be.exactly(31);
    (res === 100).should.not.be.ok;
  });

  it('should be able to combine normal functions and generators', function * () {
    fn = orchestrator()
      .setNext(firstGen)
      .setNext(fn1)
      .setNext(secondGen)
      .setNext(fn2)
      .end();

    var res = yield fn(10);
    res.should.be.exactly(321);
    (res === 100).should.not.be.ok;
  });

  it('should be able to use chain parts with multiple arguments', function () {
    fn = orchestrator()
      .setNext(fnMultipleArgs1)
      .setNext(fnMultipleArgs2)
      .end();

    var res = fn(10, 20);

    res[0].should.be.exactly(14);
    res[1].should.be.exactly(26);
  });
});

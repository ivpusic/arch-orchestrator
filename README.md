arch-orchestrator
=================

Orchestrator architectural pattern for large node.js applications

## Motivation

Managing architecture or big node.js applications can be challenging. With orchestrator approach you can improve
structure of your node.js application by decoupling different tasks on system. Let's see typical architecture
after moving to orchestrator approach.

![alt tag](http://oi60.tinypic.com/1zggqw7.jpg)

Now let's clarify some parts of this architecture:

### Participants

##### Route handler
- Function which knows which orchestrator method needs to call, in order to deliver requested resource.

##### Orchestrator
- Object which know how to construct chain of tasks. This object should know about each task.
In order to deliver chain (or direct results) to route handler, he needs to construct appropriate chain of tasks.

##### Task
- Function which knows how to finish some specific task. Tasks don't know anything about each other.
They have also small additional responsability. 
When action on task is finished, task needs to call ``next`` function in order to deliver
results to next part of task chain. Next step will have some another responsability, and so on, until end of chain.
When end of chain is reached, result will be available.

So, central point of this system is orchestrator, and there is power of architecture this type.
Orchestrator can decide to change order of actions in chain, can decide to add new steps to chain, can decide to remove
some steps from chain, etc. All these actions should not hit any of tasks, because task don't know anything about 
who is sending data to task, or to who task is delivering data. That is completely dynamic.

## Example

Okey, let's look some practical example of this architecture, using ``arch-orchestrator`` module.

### Without orchestrator pattern

Let' define few simple functions which do some actions in some order.

```
function add(next, arg) {
  return multiply(arg + 10);
}

function substract(next, arg) {
  return divide(arg - 10);
}

function multiply(next, arg) {
  return substract(arg * 10);
}

function divide(next, arg) {
  return arg / 10;
}
```

I suppose this situation is familiar to you. This is really Tight coupled situation.
If you want to change order of actions in this architecture, you will hit each
function. Or imagine that you want to keep current order of actions, but you want
to reuse functions in order (for example) divide -> add -> substract. 
Hmmmm, yes, that can end with dirty code.

### With orchestrator pattern

First let's define few tasks.

```
// each task accepts next as fist argument, 
// and result from previous action as second argument.
function add(next, arg) {
  // each task need to call next function
  // next function will call next part of chain, which is dynamic,
  // and defined by orchestrator
  return next(arg + 10);
}

function substract(next, arg) {
  return next(arg - 10);
}

function multiply(next, arg) {
  return next(arg * 10);
}

function divide(next, arg) {
  return next(arg / 10);
}
```

Now we can define chain for out tasks. Orchestrator is responsable for that.

```
var orchestrator = require('arch-orchestrator');

function doMagic() {
  return orchestrator()
    .setNext(add)
    .setNext(multiply)
    .setNext(substract)
    .setNext(divide)
    .end();
};
```

This chain is not very usefull, but it shows you idea of this approach. I belive you can see that you can easily 
remove/add/change order of tasks in chain, wihout hitting actual task. So if you want to do that, you could simply say for example:

```
function doMagic() {
  return orchestrator()
    .setNext(divide)
    .setNext(add)
    .setNext(substract)
    .end();
};
```

And at the end some route handler should ask orchestrator for chain of methods.

```
function (req, res) {
  var chain = doMagic();
  console.log(chain(100));
}
```

# License
**MIT**

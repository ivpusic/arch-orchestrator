arch-orchestrator
=================

Orchestrator for large node.js applications

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
- Object which contains funtions for delivering results to route handler. This object should know about each task.
In order to deliver results to route handler, he needs to construct appropriate chain of tasks. 
When all tasks are finished he should be able to deliver final results to route handler.

##### Task
- Function which knows how to finish some specific task. Tasks don't know anything about each other.
They have also small additional responsability. 
When action on task is finished, task needs to call ``next`` function in order to deliver
results to next part of task chain.

So, central point of this system is orchestrator, and there is power of architecture this type.
Orchestrator can decide to change order of actions in chain, can decide to add new steps to chain, can decide to remove
some steps from chain, etc. All these actions should not hit any of tasks, because task don't know anything about 
who is sending data to task, or to who task is delivering data. That is completely dynamic.


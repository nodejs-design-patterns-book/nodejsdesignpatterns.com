---
date: 2021-01-13T18:30:00
updatedAt: 2021-01-13T18:30:00
title: Node.js race conditions
permalink: /blog/node-js-race-conditions/
description: Can there be race conditions with Node.js? Actually yes, let's see some examples and some solutions.
layout: article
author: Luciano Mammino
author_profile_pic: /static/luciano-mammino-avatar-small.jpg
author_link: https://loige.co
tags: ["blog"]
---

A single-threaded event loop like the one used by JavaScript and Node.js, makes it somewhat harder to have race conditions, but, SPOILER ALERT: race conditions are still possible!

In this article we will explore the topic of race conditions in Node.js. We will discuss some examples and present a few different solutions that can help to make our code _race-conditions free_.


## What is a race condition?

First of all, let's try to clarify what a _race condition_ actually is.

A race condition is a type of _programming error_ that can occur when multiple processes or threads are accessing the same shared resource, for instance a file on a file system or a record in a database, and at least one of them is trying to modify the resource.

Let's try to present an example. Imagine that while a thread is trying to rename a file, another thread is trying to delete the same file. In this case, the system will crash because, when it's trying to delete the file, the file has already been moved to another location. Or, the other way around, while one thread is trying to rename the file, the file was already deleted by the other thread and it's not available on the filesystem anymore.

In other cases, race conditions can be even more subtle, because they wouldn't result in the program crashing, but they might just be the source of an incorrect or inconsistent behaviour. In these cases, since there is no explicit error and no stack trace, the issue is generally much harder to troubleshoot and fix.

A classic example is when 2 threads are trying to update the same data source and the new information is a function of the current value.

Let's pretend we are building a Roman Empire simulation game in which we can manage some cash flow and we have a global balance in [_aureus_](https://en.wiktionary.org/wiki/aureus) (a currency used in the Roman Empire around 100 B.C.E.). Now, let's say that our initial balance is `0` _aurei_ and that there are two independent game components (possibly running on separate threads) that are trying to increase the balance by `50` _aurei_ each, we should expect that in the end the balance is `100` _aurei_, right?

```
0 + 50 + 50 = 100 🤑
```

If we implement this in a naive way, we might have the two components performing three distinct operations each:

  1. Read the current value for `balance`
  2. Add `50` _aurei_ to it
  3. Save the resulting value into `balance`

Since the two components are running in parallel, without any synchronisation mechanism, the following case could happen:

{% responsiveImage './blog/articles/node-js-race-conditions/aurei-race-condition-node-js.png', 'A race condition example showing 2 processes trying to update a balance', { maxWidth: 848 }  %}

In the picture above you can see that **Component 2** ends up having a _stale_ view of the balance: the balance gets changed by **Component 1** after **Component 2** has read the balance. For this reason, when **Component 2** performs its own update, it is effectively overriding any change previously made by **Component 1**. This is why we have a race condition: the two components are effectively racing for completing their own tasks and they might end up stepping onto each other toes!

One way to solve this problem is to isolate the 2 concurrent operations into _transactions_ and make sure that there is only one transaction running at a given time. This idea might look like this:

{% responsiveImage './blog/articles/node-js-race-conditions/aurei-fixed-race-condition-node-js.png', 'Fixing a race condition using a transaction', { maxWidth: 848 }  %}

In the last picture, we are using transactions to make sure that all the steps of **Component 1** happen in order before all the steps of **Component 2**. This avoids any _stale read_ and makes sure that every component always has an up to date view of the world before doing any change.

In the rest of this article, we will zoom in more on race conditions in the context of Node.js and we will see some other approaches that can allow to deal with them.


## Can we have race conditions in Node.js?

It is a common misconception that Node.js does not have race conditions because of its single-threaded nature. While it is true that in Node.js you would not have multiple threads competing for resources, you might still end up with events belonging to different logical transactions being executed in a order that might result in _stale reads_ and generate a race condition.

In the example that we illustrated above, we intentionally represented the various events (_read_, _increase_ and _save_) as discrete units. Note how the system is never executing more than one event at the same time. This is a simple but accurate representation of how the Node.js event loop processes events on a single thread. Nonetheless, you can see that there migt be situations where multiple logical transactions (multiple deposits) are scheduled on the event loop and the discrete events might end up being intermigled resulting in a race condition.

TODO: differences around parallelism and concurrency.


## A Node.js example with a race condition


```javascript
const delay = (m) => new Promise(resolve => setTimeout(resolve, m))

let accountBalance = 0

async function getAccountBalance () {
  // simulates random delay to retrieve data from a remote source (e.g. a DB)
  await delay(Math.random() * 100)
  return accountBalance
};

async function setAccountBalance (value) {
  // simulates random delay to retrieve data from a remote source (e.g. a DB)
  await delay(Math.random() * 100)
  accountBalance = value
};

async function add$50 (label) {
  const balance = await getAccountBalance()
  console.log(`${label}: get balance`)
  const newBalance = balance + 50
  await setAccountBalance(newBalance)
  console.log(`${label}: set balance`)
};

async function main () {
  const transaction1 = add$50('transaction1') // NOTE no `await`
  const transaction2 = add$50('transaction2') // NOTE no `await`
  await transaction1 // awaiting here does not stop `transaction2` from being scheduled before transaction 1 is completed
  await transaction2
  const balance = await getAccountBalance()
  console.log(`$${balance}`)
};

main()
```

provide simple solution.


## Using a mutex in Node.js

example...





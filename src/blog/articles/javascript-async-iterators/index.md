---
date: 2021-05-02T18:00:00
updatedAt: 2021-05-02T18:00:00
title: JavaScript async iterators
permalink: /blog/javascript-async-iterators/
description: ~
layout: article
author: Luciano Mammino
author_profile_pic: /static/luciano-mammino-avatar-small.jpg
author_link: https://loige.co/
tags: ["blog"]
---

Did you know that JavaScript offers a few protocols to allow iteration over certain objects? Of course, we know we can easily iterate over arrays, but with these protocols you can make your own custom objects iterable as well.

When you have an iterable objects representing a collection, you can use the `for...of` syntax to iterate over every single item of the collection.

But what if an object abstracts data generated asyncrhonously? For instance, think of an abstraction that allows us to fetch data from a paginated API, or records consumed in batches from a database, or something as simple as a countdown timer. Well in these cases you can use the `for await...of` syntax!

In this article we will learn more about the _iterator_ and the _iterable_ protocol (and their async counterparts) and we will see how to create custom objects that can expose their internal data in an ergonomic and idiomatic way.


## JavaScript iteration with `for...of`

With EcmaScript 2015, JavaScript got the `for...of` syntax. This syntax provides a very easy way to iterate over collections, like arrays, string, sets and maps.

If you have never seen this syntax in action here are some examples:

```javascript
const judokas = [
  'Driulis Gonzalez Morales',
  'Ilias Iliadis',
  'Tadahiro Nomura',
  'Anton Geesink',
  'Teddy Riner',
  'Ryoko Tani'
]

for (const judoka of judokas) {
  console.log(judoka)
}
```

In the example above, we are iterating over an array using the `for...of` syntax. If we run this code, this is what we will get as output:

```text
Driulis Gonzalez Morales
Ilias Iliadis
Tadahiro Nomura
Anton Geesink
Teddy Riner
Ryoko Tani
```

The same syntax works also for iterating over the characters of a string:

```javascript
const judoka = 'Ryoko Tani'

for (const char of judoka) {
  console.log(char)
}
```

This will print:

```text
R
y
o
k
o

T
a
n
i
```

And we can even use this for `Set` and `Map`:

```javascript
const medals = new Set(['gold', 'silver', 'bronze'])

for (const medal of medals) {
  console.log(medal)
}
```

Which is going to output:

```text
gold
silver
bronze
```

`Map` is especially interesting, because we can use _destructuring_ to easily iterate over key-value pairs:

```javascript
const medallists = new Map([
  ['Teddy Riner', 33],
  ['Driulis Gonzalez Morales', 16],
  ['Ryoko Tani', 16],
  ['Ilias Iliadis', 15]
])

for (const [judoka, medals] of medallists) {
  console.log(`${judoka} has won ${medals} medals`)
}
```

This will output:

```text
Teddy Riner has won 33 medals
Driulis Gonzalez Morales has won 16 medals
Ryoko Tani has won 16 medals
Ilias Iliadis has won 15 medals
```

Finally, if you want to iterate over the key-value pairs of a regular object using the `for...of` syntax, we can do that by using the helper `Object.entries`:

```javascript
const medallists = {
  'Teddy Riner': 33,
  'Driulis Gonzalez Morales': 16,
  'Ryoko Tani': 16,
  'Ilias Iliadis': 15
}

for (const [judoka, medals] of Object.entries(medallists)) {
  console.log(`${judoka} has won ${medals} medals`)
}
```

This will produce the same output as the previous example.

What's interesting here is that, if we try to use the `for...of` syntax directly on the object `medallists` (without `Object.entries`), we get the following error:

```text
for (const [judoka, medals] of medallists) {
                               ^

TypeError: medallists is not iterable
    at Object.<anonymous> (.../05-for-of-object.js:8:32)
    at Module._compile (node:internal/modules/cjs/loader:1108:14)
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1137:10)
    at Module.load (node:internal/modules/cjs/loader:988:32)
    at Function.Module._load (node:internal/modules/cjs/loader:828:14)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:76:12)
    at node:internal/main/run_main_module:17:47
```

Let's read this error once again: `medallists is not iterable`!

Yeah, the error is clear: a regular JavaScript object is not _iterable_, while arrays, strings, maps and sets are!

But what does it mean for an object to be _iterable_?

During the rest of this article we will learn how JavaScript knows if a given object is **iterable** and how we can make our own custom _iterable_ objects.


## JavaScript iteration with `for await...of`

EcmaScript 2018 introduced a new syntax called `for await...of`. This syntax is somewhat similar to `for...of` but it allows us to iterate over _asynchronous collections_ where data becomes available over time in an asynchronous fashion.

A good use case for this syntax is reading data from a remote source like a database.

Here's an example that uses AWS DynamoDB and the `for await...of` syntax to list all the tables available in our account:

```javascript
import { DynamoDBClient, paginateListTables } from '@aws-sdk/client-dynamodb'

const client = new DynamoDBClient({}); 

for await (const page of paginateListTables({ client }, {})) {
  // page.TableNames is an array of table names
  for (const tableName of page.TableNames) {
    console.log(tableName)
  }
}
```

In the example above, `paginateListTables` will _produce_ pages over time, and every page will contain a portion of the data (information about all the available tables).

This approach allow us to list hundreds or even thousands of table names efficiently. In fact, the data can be printed as soon as it is available and we don't have to wait for the entire data set to be received.

Note how we are combining here `for await...of` and `for...of`. Pages comes over time asynchronously, so we need to use `for await...of` to iterate over this data. Every page contains an array of table names, so in this case, to iterate over every single table name we can simply use `for...of`.

In general, we can use the `for await...of` syntax with objects that are **async iterables**.

In the next few sections we will see how JavaScript classifies a given object as _async iterables_ and how we can build our custom _async iterables_.


## The JavaScript iterator protocol

JavaScript defines a number of protocols that are used to make object iterables (and async iterables).

The first one we are going to start with is the **iterator protocol**.

> In JavaScript, an object is **an iterator** if it has a `next()` method. Every time you call it, it returns an object with the keys `done` (boolean) and `value`.


Let's see an example. Let's say we want to build a countdown. This countdown can be initialized with a positive integer and it will produce all the numbers from that value to `0`:

```javascript
function createCountdown (from) {
  let nextVal = from
  return {
    next () {
      if (nextVal < 0) {
        return { done: true }
      }

      return { 
        done: false,
        value: nextVal--
      }
    }
  }
}
```

In this example, `createCountdown` is a simple factory function. From this function we return an _iterator_ object. In fact, the object implements the _iterator protocol_ defined above. Note that the returned object implements a `next()` method and that this method returns either `{done: true}` or `{done: false, value: someNumber}`.

Let's see now how can we use this object to extract all the values:

```javascript
const countdown = createCountdown(3)
console.log(countdown.next()) // { done: false, value: 3 }
console.log(countdown.next()) // { done: false, value: 2 }
console.log(countdown.next()) // { done: false, value: 1 }
console.log(countdown.next()) // { done: false, value: 0 }
console.log(countdown.next()) // { done: true }
```

Or if we want to use this object with a more generic loop:

```javascript
const countdown = createCountdown(3)
let result = countdown.next()
while (!result.done) {
  console.log(result.value)
  result = countdown.next()
}
```

This will produce:

```text
3
2
1
0
```

This is not the most intuitive or ergonomic approach, but the iterator protocol is the basic building block for the _iterable protocol_ which enables the `for...of` syntax.

## The JavaScript iterable protocol

As we said, the _iterable protocol_ builds on top of the _iterator protocol_ that we just explored. Let's see how:

> An object is **iterable** if it implements the `@@iterator` method, a zero-argument function that **returns an iterator**.

Note that with `@@iterator` we indicate a symbol that can be accessed with the global value `Symbol.iterator`.

Can we make our countdown example _iterable_? We certainly can!

```javascript
function createCountdown (from) {
  let nextVal = from
  return {
    [Symbol.iterator]: () => ({
      next () {
        if (nextVal < 0) {
          return { done: true }
        }

        return { done: false, value: nextVal-- }
      }
    })
  }
}
```

In this new example, our factory function returns an _iterable_ object. This object in fact has a method referenced with `Symbol.iterator` that returns an _iterator_ object.

At this point, once we have an instance of a countdown, we can use the `for..of` syntax to iterate over all the numbers from the countdown:

```javascript
const countdown = createCountdown(3)

for (const value of countdown) {
  console.log(value)
}
```

This will output:

```text
3
2
1
0
```

Hooray! Now we know how to make iterators and iterable objects. If you find the two terms confusing, don't worry, that's quite common!

One good way to try to remember and distinguish these 2 concepts is the following:

  - An _iterator_ is a lower-level object that allows us to iterate over some data set using `next()`
  - An _iterable_ is an object on which we can iterate over using the `for...of` syntax.


## Using JavaScript generator functions

An interesting detail is that JavaScript generator functions _produce_ iterators.

This allows us to simplify the way we can implement both the _iterator_ and the _iterable_ protocols.

Let's see how can we rewrite our countdown logic using a generator function:

```javascript
function * createCountdown (from) {
  for (let i = from; i >= 0; i--) {
    yield i
  }
}
```

If we call `createCountdown(3)` we get an _iterator_. So this is perfectly compatible with our previous _iterator_ implementation:

```javascript
const countdown = createCountdown(3)
console.log(countdown.next()) // { value: 3, done: false }
console.log(countdown.next()) // { value: 2, done: false }
console.log(countdown.next()) // { value: 1, done: false }
console.log(countdown.next()) // { value: 0, done: false }
console.log(countdown.next()) // { value: undefined, done: true }
```

Similarly, we can use generators to implement the _iterable protocol_:

```javascript
function createCountdown (from) {
  return {
    [Symbol.iterator]: function * () {
      for (let i = from; i >= 0; i--) {
        yield i
      }
    }
  }
}
```

And this factory will produce iterable objects, exactly as before:

```javascript
const countdown = createCountdown(3)

for (const value of countdown) {
  console.log(value)
}
```

In general, generators can be considered great syntactic sugars to write iterators.


## The JavaScript async iterator protocol

Ok, so far we have explored only synchronous iteration protocols. What about async?

Unsurprisingly, both the iterator protocol and the iterable protocol have their async counterparts!

Let's start with the **async iterator protocol**:

> An object is an **async iterator** if it has a `next()` method. Every time you call it, it returns **a promise that resolves** to an object with the keys `done` (boolean) and `value`.

Note how this is quite similar to the synchronous version of the iterator protocol. The main difference here is that the `next()` function won't return an object straight away. Instead it will return a promise that will eventually resolve to an object.

Let's now revisit our countdown example and let's say we want some time to pass before numbers are _produced_:

```javascript
import { setTimeout } from 'timers/promises'

function createAsyncCountdown (from, delay = 1000) {
  let nextVal = from
  return {
    async next () {
      await setTimeout(delay)
      if (nextVal < 0) {
        return { done: true }
      }

      return { done: false, value: nextVal-- }
    }
  }
}
```

Note that this time we are using an _async_ function to implement `next()`. This will make this method immediately return a promise, that will later resolve when we run one of the `return` statements from within the _async_ function.

Also, note that here we are using `setTimeout` from `timers/promises`, a new core module available from Node.js 16.

Ok, now we are ready to use this iterator:

```javascript
const countdown = createAsyncCountdown(3)
console.log(await countdown.next()) // { done: false, value: 3 }
console.log(await countdown.next()) // { done: false, value: 2 }
console.log(await countdown.next()) // { done: false, value: 1 }
console.log(await countdown.next()) // { done: false, value: 0 }
console.log(await countdown.next()) // { done: true }
```

This works very similarly as it's syncrhonous counterpart with two notable exceptions:

  - We need to use `await` to wait for the next element to be produced.
  - Between one element and another about 1 second will pass, so this iteration is much slower.

{% image './blog/articles/javascript-async-iterators/javascript-async-iterator-countdown.gif', 'An example of JavaScript async iterator', { maxWidth: 600 }  %}

Of course, here we can use generators as well as a nice syntactic sugar:

```javascript
import { setTimeout } from 'timers/promises'

async function * createAsyncCountdown (from, delay = 1000) {
  for (let i = from; i >= 0; i--) {
    await setTimeout(delay)
    yield i
  }
}
```

This code is more concise and probably more readable to those accustomed with async functions and generator functions.


## The JavaScript async iterable protocol

...

## Using JavaScript iteration protocols with Node.js

...


### Node.js streams are async iterators

...


### Converting a Node.js event emitter to an async iterator

...

## Consuming paginated data with async iterators

...

## Wrapping up

...
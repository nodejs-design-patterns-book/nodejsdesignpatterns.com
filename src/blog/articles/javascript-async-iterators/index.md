---
date: 2021-05-04T13:10:00
updatedAt: 2021-05-04T13:10:00
title: JavaScript async iterators
permalink: /blog/javascript-async-iterators/
description: An in-depth exploration of JavaScript iteration protocols with a special focus on async iterators
layout: article
author: Luciano Mammino
author_profile_pic: /static/luciano-mammino-avatar-small.jpg
author_link: https://loige.co/
tags: ["blog"]
---

Did you know that JavaScript offers a few protocols to allow iteration over certain objects? Of course, we know we can easily iterate over arrays, but with these protocols, you can make your own custom objects iterable as well.

When you have an iterable object representing a collection, you can use the `for...of` syntax to iterate over every single item of the collection.

But what if an object abstracts data generated asynchronously? For instance, think of an abstraction that allows us to fetch data from a paginated API, or think about some records consumed in batches from a database, or something as simple as a countdown timer. Well in these cases you can use the `for await...of` syntax!

In this article, we will learn more about the _iterator_ and the _iterable_ protocol (and their async counterparts) and we will see how to create custom objects that can expose their internal data in an ergonomic and idiomatic way.


## JavaScript iteration with `for...of`

With ECMAScript 2015, JavaScript got the `for...of` syntax. This syntax provides a very easy way to iterate over collections, such as arrays, string, sets, and maps.

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

The above will print:

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

`Map` is especially interesting because we can use _destructuring_ to iterate over key-value pairs:

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

The above example will output:

```text
Teddy Riner has won 33 medals
Driulis Gonzalez Morales has won 16 medals
Ryoko Tani has won 16 medals
Ilias Iliadis has won 15 medals
```

Finally, if you want to iterate over the key-value pairs of an object literal using the `for...of` syntax, we can do that by using the helper `Object.entries`:

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

The code snippet above will produce the same output as the previous example.

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

Yeah, the error is clear: a regular JavaScript object is not _iterable_, while arrays, strings, maps, and sets are!

But what does it mean for an object to be _iterable_?

During the rest of this article, we will learn how JavaScript knows if a given object is **iterable** and how we can make our own custom _iterable_ objects.

But first let's quickly take a look at how we can use async iterators.


## JavaScript iteration with `for await...of`

ECMAScript 2018 introduced a new syntax called `for await...of`. This syntax is somewhat similar to `for...of` but it allows us to iterate over _asynchronous collections_ where data becomes available over time in an asynchronous fashion.

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

This approach allows us to list hundreds or even thousands of table names efficiently. In fact, the data can be printed as soon as it is available and we don't have to wait for the entire data set to be received.

Note how we are combining here `for await...of` and `for...of`. Pages become available over time asynchronously, so we need to use `for await...of` to iterate over this data. Every page contains an array of table names, so in this case, to iterate over every single table name we can simply use `for...of`.

In general, we can use the `for await...of` syntax with objects that are **async iterable**.

In the next few sections, we will see how JavaScript classifies a given object as _async iterable_ and how we can build our custom _async iterable_ objects.


## The JavaScript iterator protocol

JavaScript defines a number of protocols that are used to make objects iterable (or async iterable).

The first one we are going to start with is the **iterator protocol**.

> In JavaScript, an object is **an iterator** if it has a `next()` method. Every time you call it, it returns an object with the keys `done` (boolean) and `value`.

Let's see an example. Let's say we want to build a countdown. This countdown is initialized with a positive integer and it will produce all the numbers from that value down to `0`:

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

In this example, `createCountdown` is a simple factory function. From this function, we return an _iterator_ object. In fact, the object implements the _iterator protocol_ defined above. Note that the returned object implements a `next()` method and that this method returns either `{done: true}` or `{done: false, value: someNumber}`.

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

The code above will produce the following output:

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

Note that with `@@iterator` we indicate a symbol that is accessed with the global value `Symbol.iterator`.

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

The example above will output:

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


### Using JavaScript generator functions

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


### The spread syntax for iterable objects

Another interesting detail is that all iterable objects can be used with the _spread syntax_.

The spread syntax looks like `...someIterable` and it basically allows us to apply every single element from the iterable to a given context.

The most common use cases are found with array literals and function calls.

Let's see a couple of examples:

```javascript
const countdown = createCountdown(3)
const from5to0 = [5, 4, ...countdown]
console.log(from5to0) // [ 5, 4, 3, 2, 1, 0 ]

const countdown2 = createCountdown(6)
console.log('countdown2 data:', ...countdown2)
// countdown2 data: 6 5 4 3 2 1 0
```

This is something we see most often with arrays, but it's important to note that any iterable object can be used with the spread syntax.


## The JavaScript async iterator protocol

Ok, so far we have explored only synchronous iteration protocols. What about async?

Unsurprisingly, both the iterator protocol and the iterable protocol have their async counterparts!

Let's start with the **async iterator protocol**:

> An object is an **async iterator** if it has a `next()` method. Every time you call it, it returns **a promise that resolves** to an object with the keys `done` (boolean) and `value`.

Note how this is quite similar to the synchronous version of the iterator protocol. The main difference here is that the `next()` function won't return an object straight away. Instead, it will return a promise that will eventually resolve to an object.

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

This works very similarly to its synchronous counterpart with two notable exceptions:

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

This code is more concise and probably more readable, at least to those accustomed to async functions and generator functions.


## The JavaScript async iterable protocol

Let's now discuss the last iteration protocol: the _async iterable protocol_!

> An object is an **async iterable** if it implements the `@@asyncIterator` method, a zero-argument function that returns an **async iterator**.

Note that with `@@asyncIterator` we indicate a symbol that can be accessed with the global value `Symbol.asyncIterator`.

Once again, this definition is quite similar to its synchronous counterpart. The main difference is that this type we have to use `Symbol.asyncIterator` and that it must return an _async_ iterator.

Let's revisit our async countdown example:

```javascript
import { setTimeout } from 'timers/promises'

function createAsyncCountdown (from, delay = 1000) {
  return {
    [Symbol.asyncIterator]: async function * () {
      for (let i = from; i >= 0; i--) {
        await setTimeout(delay)
        yield i
      }
    }
  }
}
```

At this point, our `createAsyncCountdown` returns a valid async iterator, so we can finally use the `for await...of` syntax:

```javascript
const countdown = createAsyncCountdown(3)

for await (const value of countdown) {
  console.log(value)
}
```

As you might expect, this code will produce `3`, `2`, `1` and `0` with a delay:

{% image './blog/articles/javascript-async-iterators/javascript-async-iterable-countdown.gif', 'An example of JavaScript async iterator', { maxWidth: 600 }  %}

Great!

At this point, we know how the JavaScript iteration protocol work and how to create iterator and iterable objects in a synchronous and asynchronous fashion!

## Combining iterator and iterable

Can an object be both an iterator and an iterable at the same time?

Yes! Nothing is stopping us from implementing both protocols for a given object. This basically means that `@@iterator` or `@@asyncIterator` will have to return the same object as in the following example:

```javascript
const iterableIterator = {
  next() {
    return { done: false, value: "hello" }
  },
  [Symbol.iterator]() {
    return this
  }
}

for (const value of iterableIterator) {
  console.log(value) // "hello"
}
```

The example above will print "hello" endlessly.

What's even cooler is that generator functions are also iterable. This means that we can greatly simplify our countdown examples.

Let's see how the syncrhonous countdown would look like:

```javascript
function * createCountdown (from) {
  for (let i = from; i >= 0; i--) {
    yield i
  }
}
```

We don't even need to bother with `Symbol.iterator`!

The same goes for the asynchronous version of our countdown:

```javascript
import { setTimeout } from 'timers/promises'

async function * createAsyncCountdown (from, delay = 1000) {
  for (let i = from; i >= 0; i--) {
    await setTimeout(delay)
    yield i
  }
}
```

And here we don't have to explicitly use `Symbol.asyncIterator`, in fact, an async generator function is already an async iterable!

If we decide to use generators, this will help us to write even more concise iterator and iterable objects.


## Using JavaScript iteration protocols with Node.js

Everything we have been discussing so far is part of the JavaScript specification, but what about Node.js?

Actually, support for these features looks quite good in Node.js!

Synchronous iteration protocols have been supported in Node.js for a long time (since Node.js 0.12).

Recent versions of Node.js (Node.js 10.3) introduced support for async iterators and the `for await...of` syntax.

Synchronous iterable objects and the `for...of` syntax are quite widespread, so in the next sections, we will focus on providing some examples of how you can take advantage of its asynchronous counterpart and the `for await...of` syntax.


### Node.js readable streams and async iterators

One interesting detail that needs a bit more visibility is that Node.js _Readable_ streams are async iterable objects since Node.js 11.14.

This basically means that we can consume data from a Readable stream using `for await...of`.

Let's see a simple example of a CLI utility that allows us to read the content of a given file and count the number of bytes:

```javascript
import { createReadStream } from 'fs'

const sourcePath = process.argv[2]
const sourceStream = createReadStream(sourcePath)

let bytes = 0
for await (const chunk of sourceStream) {
  bytes += chunk.length
}

console.log(`${process.argv[2]}: ${bytes} bytes`)
```

The interesting thing is that when we are using this approach the stream is consumed in _non-flowing_ (or _paused_) mode which can help us to handle backpressure in a very simple way.

Let's say that we want to write every chunk to a very slow transform stream (that we are going to identify with `SlowTransform`), this is how we can handle backpressure:

```javascript
import { createReadStream } from 'fs'
import { once } from 'events'

const sourcePath = process.argv[2]
const sourceStream = createReadStream(sourcePath)
const destStream = new SlowTransform()

for await (const chunk of sourceStream) {
  const canContinue = destStream.write(chunk)
  if (!canContinue) {
    // backpressure, now we stop and we need to wait for drain
    await once(destStream, 'drain')
    // ok now it's safe to resume writing
  }
}
```

Note that having an `await` inside the `for await...of` block will effectively pause the iteration. This will stop consuming data from the source stream until the destination stream is drained.


### Converting a Node.js event emitter to an async iterable

Another interesting use case for async iteration in Node.js is when dealing with repeated events happening over time.

Events are generally fired by an _event emitter_ and, since version 12.16, Node.js offers an interesting utility to convert a sequence of events into an async iterable.

We can see a simple example by using the third party module [`glob`](https://npm.im/glob) which allows us to find files matching a specific glob expression.

In this example we will find and print all the JavaScript files (`.js` extension) in the current folder (and subfolders):

```javascript
import { on } from 'events'
import glob from 'glob'

const matcher = glob('**/*.js')

for await (const [filePath] of on(matcher, 'match')) {
  console.log(filePath)
}
```

As you can see, we are using `on(matcher, 'match')` to create an async iterable that will _produce_ a new value every time the `matcher` instance fires a `match` event.

Note that the value produced by this async iterable at every iteration is an array containing all the values contained in the original `match` event. This is the reason why we need to use destructuring to extract the `filePath`.

At this point you might ask: "wait a second, but how do we know, with this approach, when there are no more events to process?"

And that's a great question... we don't!

In fact, we are only listening for `match` events and we don't really have a way to stop the loop.

If we put any code just after the `for await...of` loop, that code will never be executed.

One solution to this problem is the `AbortController`, which allows us to create an Async Iterable that can be aborted.

With that, we could listen for the `end` event on our `matcher` instance and, once that happens, we can use the `AbortController` to stop the iteration.

Let's see some code:

```javascript
import { on } from 'events'
import glob from 'glob'

const matcher = glob('**/*.js')
const ac = new global.AbortController()

matcher.once('end', () => ac.abort())

try {
  for await (const [filePath] of on(matcher, 'match', { signal: ac.signal })) {
    console.log(`./${filePath}`)
  }
} catch (err) {
  if (!ac.signal.aborted) {
    console.error(err)
    process.exit(1)
  }
}

console.log('NOW WE GETTING HERE! :)')
```

In the code example above, you can see that we are creating a new instance of `AbortController` by using `new global.AbortController()`.

Then, we listen for the `end` event on our `matcher` and when that happens we invoke `abort()` on our `AbortController` instance.

The last step is to pass the `AbortController` instance to the `on()` function. We do that by passing an options object and using the `signal` option.

You might have noticed that we also added a `try/catch` block. This is actually very important. When we stop the iteration using an `AbortController` this will not simply stop the iteration, but it will raise an exception.

In this case the exception is expected, so we handle it gracefully. We also want to distinguish the abort exception from other unintended exceptions, so we make sure to check wheter our abort signal was raised, otherwise we exit the program with an error.

Note that this is a lot of work, so this pattern, while it's cute, might not always give you great benefits compared to simply handling events using regular listeners.


## Consuming paginated data with async iterators

As we mentioned before with the DynamoDB examples, another great use case for async iteration is when we need to fetch data from a remote paginated dataset. Even more so when we cannot determine how to access the next page until we have fetched the previous one. This is a typical example of asynchronous sequential iteration and it's probably the most adequate use case for async iterators.

Just to present a very simple example, let's use [a free and open-source Star Wars API](https://swapi.dev/) (happy May 4th everyone!) which allows us to access all the Star Wars characters in a paginated fashion.

To get data from this API, we can make a GET request to the following endpoint:

```text
https://swapi.dev/api/people
```

This request will respond with a JSON message that looks like this:

```json
{
	"count": 82,
	"next": "http://swapi.dev/api/people/?page=2",
	"results": [
		{
			"name": "Sly Moore",
			"height": "178",
      "...": "more fields...",
    },
    {
      "name": "Another character",
			"height": "whatever",
      "...": "more fields...",
    },
    {
      "...": "more characters"
    }
  ]
}
```

Note that the `next` field contains the URL that we can use to fetch the data from the following page. All the records for the current page are presented in the `results` field.

With these details in mind, this is how we can create a custom client that allows us to fetch all the characters using the `for await...of` syntax:

```javascript
import axios from 'axios'

async function * starWarsCharacters () {
  let nextUrl = 'https://swapi.dev/api/people'
  while (nextUrl) {
    const response = await axios.get(nextUrl)
    nextUrl = response.data.next
    yield response.data.results
  }
}
```

Now we can use this function as follows:

```javascript
for await (const page of starWarsCharacters()) {
  for (const char of page) {
    console.log(char.name)
  }
}
```

If we run this code we should see the following output:

```text
Luke Skywalker
C-3PO
R2-D2
Darth Vader
Leia Organa
[... other 77 names]
```


## Wrapping up

This concludes our exploration of JavaScript iteration protocols. At this point, you should feel comfortable understanding what the various protocols are and how to use `for...of` and `for await...of` effectively in both JavaScript and Node.js.

These techniques are often ideal to implement synchronous and asynchronous sequential iteration patterns, which makes them very effective tools in our toolbelt.

If you are interested in learning more patterns and interesting Node.js techniques, consider checking out [Node.js Design Patterns](/). You can grab a free chapter for free by filling the form at the end of this page. Among other things, this free chapter contains some other examples of iteration and async iterators!

See you at the next post!

CIAO 👋

P.S. All the examples presented in this article are available on GitHub at [lmammino/javascript-iteration-protocols](https://github.com/lmammino/javascript-iteration-protocols).

<small>Thanks to [Mario Casciaro](https://twitter.com/mariocasciaro) for the kind review of this article and to [Kelvin Omereshone](https://twitter.com/Dominus_Kelvin) for finding and fixing a few typos.</small>

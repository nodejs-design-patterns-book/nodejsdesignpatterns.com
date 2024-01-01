---
date: 2022-03-11T12:30:00
updatedAt: 2022-03-11T21:20:00
title: Node.js stream consumer utilities
permalink: /blog/node-js-stream-consumer/
description: How to easily read all the content of a readable stream using async await
layout: article
author: Luciano Mammino
author_profile_pic: /static/luciano-mammino-avatar-small.jpg
author_link: https://loige.co
tags: ["blog"]
---

How many times did you need to read the entire content of a `Readable` stream into memory and ended up writing something like this?

```javascript
const chunks = []
someReadableStream.on('data', (chunk) => chunks.push(chunk))
someReadableStream.on('end', () => {
  const data = Buffer.concat(chunks)
  // do something with `data`
})
```

Or using [async iterators](/blog/javascript-async-iterators/):

```javascript
const chunks = []
for await (const chunk of someReadableStream) {
  chunks.push(chunk)
}
const data = Buffer.concat(chunks)
// do something with `data`
```

This is a bit of a boilerplate-heavy solution for just consuming an entire readable stream. Consider that here we are not even handling errors, trying to do that (as we should!) will add even more boilerplate!

If you wish there was an easier way, well keep reading, this article is for you!


## The `stream/consumers` module

Since Node.js version 16, there is a new built in stream utility library called `stream/consumers` which offers a bunch of useful utilities to consume the entire content of a `ReadableStream`.

~~At the time of writing this article, `stream/consumers` does not even appear in the official Node.js documentation, so it's still of a hidden gem. Hopefully this article will help to spread the word a little bit.~~

**UPDATE**: It turns out that this module is documented under the [Web Streams API section](https://nodejs.org/api/webstreams.html#streamconsumersjsonstream) and in fact these utilities are both compatible with Node.js streams and web streams.

Without further ado, let's see what's inside this module:

```javascript
import consumers from 'stream/consumers'
console.log(consumers)
```

If we run this code, we will see the following output:

```plain
{
  arrayBuffer: [AsyncFunction: arrayBuffer],
  blob: [AsyncFunction: blob],
  buffer: [AsyncFunction: buffer],
  text: [AsyncFunction: text],
  json: [AsyncFunction: json]
}
```

So, what we can tell is that the `stream/consumers` module exposes some async function that seem to be helpful to consume `Readable` streams in different ways:

  - As binary data (`ArrayBuffer`, `Blob`, `Buffer`)
  - As text
  - As JSON

In the next sections we will see some examples on how to use these functions.


## Reading a binary file from a Readable stream

Ok, let's say that we have to do some processing on a picture and, in order to do that, we need to load the entire binary content representing the picture from a file to memory.

We could easily use the `buffer` function from the `stream/consumers` library to do that:

```javascript
import path from 'path'
import { createReadStream } from 'fs'
import consumers from 'stream/consumers'

const __dirname = new URL('.', import.meta.url).pathname;
const readable = createReadStream(path.join(__dirname, 'picture.png'))
const data = await consumers.buffer(readable)
console.log(data)
```

If we execute this code, we will see the following output:

```plain
(node:7685) ExperimentalWarning: buffer.Blob is an experimental feature. This feature could change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
<Buffer 89 50 4e 47 0d 0a 1a 0a 00 00 00 0d 49 48 44 52 00 00 02 80 00 00 01 c1 08 02 00 00 00 76 43 9d 20 00 00 00 01 73 52 47 42 00 ae ce 1c e9 00 00 00 04 ... 347824 more bytes>
```

You can see that all the binary data (~300Kb) was loaded in the buffer, but also that this feature (as of v17.7.1) is still experimental and therefore we get a warning. You will get a similar warning also when trying to use `consumers.arrayBuffer` and `consumers.blob`. This will be the case until `buffer.Blob` is stabilised.


## Reading a JSON object from a Readable stream

Similarly to what we just saw in the previous section, we can use the `stream/consumers` library to consume the entire content of a `ReadableStream` as a JSON encoded string. For instance, we could use this to process the response body from an HTTP request:

```javascript
import { get } from 'https'
import consumers from 'stream/consumers'


const url = 'https://rickandmortyapi.com/api/character/639'
get(url, async (response) => {
  const data = await consumers.json(response)
  console.log(data)
})
```

Here we are using the awesome (and free) [The Rick and Morty API](https://rickandmortyapi.com/). If we run this code we should see the following output:

```json
{
  id: 639,
  name: 'Uncle Nibbles',
  status: 'Dead',
  species: 'Alien',
  type: 'Soulless Puppet',
  gender: 'Male',
  origin: {
    name: 'Tickets Please Guy Nightmare',
    url: 'https://rickandmortyapi.com/api/location/98'
  },
  location: {
    name: 'Tickets Please Guy Nightmare',
    url: 'https://rickandmortyapi.com/api/location/98'
  },
  image: 'https://rickandmortyapi.com/api/character/avatar/639.jpeg',
  episode: [ 'https://rickandmortyapi.com/api/episode/37' ],
  url: 'https://rickandmortyapi.com/api/character/639',
  created: '2020-08-06T16:51:23.084Z'
}
```

It's also worth mentioning that `consumers.json` does not produce any warning, so this feature can be considered stable in Node.js 16.


## Reading a text from a Readable stream

Let's discuss one more example. Let's try to consume an entire readable stream as text, which means that we will be consuming the stream assuming it's a valid UTF-8 encoded string and save the result into a string variable.

One simple example could be to try to read a string from the standard input in a CLI application:

```javascript
import consumers from 'stream/consumers'

const input = await consumers.text(process.stdin)
console.log(input)
```

If we try to run the script as follows:

```bash
cat mobydick.txt | node stdin.js
```

We should see something like this in the output:

```plain
CHAPTER 1

Loomings.


Call me Ishmael.  Some years ago--never mind how long
precisely--having little or no money in my purse, and nothing
particular to interest me on shore, I thought I would sail about a
little and see the watery part of the world.  It is a way I have of
driving off the spleen and regulating the circulation.  Whenever I
find myself growing grim about the mouth; whenever it is a damp,
drizzly November in my soul; whenever I find myself involuntarily
pausing before coffin warehouses, and bringing up the rear of every
funeral I meet; and especially whenever my hypos get such an upper
hand of me, that it requires a strong moral principle to prevent me
from deliberately stepping into the street, and methodically knocking
people's hats off--then, I account it high time to get to sea as soon
as I can.  This is my substitute for pistol and ball.  With a
philosophical flourish Cato throws himself upon his sword; I quietly
take to the ship.  There is nothing surprising in this.  If they but
knew it, almost all men in their degree, some time or other, cherish
very nearly the same feelings towards the ocean with me.

[...]
```

Again, no warnings, so this feature is stable in Node.js v16.


## Is this even a good idea?

Now that you know how to use this utility, it's worth mentioning that as with all good things it should be used with moderation.

In fact, accumulating all the content of a stream in memory is something that should not be done lightly.

Streams are an abstraction that has been built into Node.js to allow developers to handle arbitrary amounts of data (even infinite streams) and process such data as soon as possible, while still keeping the memory footprint low.

By processing the data in chunks, we can keep the amount of memory being allocated at any given time low and have our processing logic run efficiently.

When we accumulate an entire stream we are effectively defeating all the advantages of Node.js streams, so this is something that is recommended only when you are absolutely certain you are dealing with small amounts of data.


## Wapping up

This is all for this article, feel free to [reach out to me on Twitter](https://twitter.com/loige) if you found this article interesting and if you think you learned something useful.

If you are curious, you can also [read the code of the `stream/consumers` module](https://github.com/nodejs/node/blob/main/lib/stream/consumers.js), it's actually a really thin layer (less than 100 lines) and you can learn a trick or two by doing that.

See you in the next article!

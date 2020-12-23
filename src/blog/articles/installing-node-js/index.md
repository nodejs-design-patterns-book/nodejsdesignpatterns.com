---
title: 5 Ways to install Node.js
permalink: /blog/5-ways-to-install-node-js/
description: Learn what are the most common ways to install Node.js in your development machine
layout: article
author: Luciano Mammino
author_profile_pic: https://api.microlink.io/?url=https://twitter.com/loige&embed=image.url
author_link: https://loige.co
tags: ["blog"]
---

In this article we will explore some of the most common ways to install Node.js in your development system. We will see how to install Node.js using the official installer for various platforms, how to use a Node.js version manager such as `n` or `nvm` and, finally, we will also see how to compile and install Node.js from source. Along the way we will try to disclose one or two tips to get you even more productive with Node.js!

Let's get started!


## Which option should I pick?

There are many different ways to install Node.js and every one of them comes with its own perks and drawbacks. In this article we will try to explore the most common ones and by the end of it you should have a good understanding of which one should be more suitable to you.

### TLDR;

  - Use `nvm` or `n` if you develop with Node.js frequently and you expect to be needing to switch Node.js version while moving from one project to another or to debug potential compatibility issues in your project or library.
  - Use the system package manager like `apt`, `brew` or `winget` if you tend to install all your software this way and if you don't expect to be needing to switch or upgrade Node.js version too often.
  - Install Node.js from source if you are an advanced user and if you want to contribute back to Node.js itself. 
  - Use the official Node.js installer if you don't fall in any of the previous options...


### What other people seem to like

Before writing this article, I was actually curious to find out what are the options that most folks in my network prefer, so I run a [poll on Twitter](https://twitter.com/loige/status/1340999569807712257). In this poll I asked how you prefer to install Node.js and provided 4 options:

  - Official Installer
  - Version manager (`nvm` or `n`)
  - Package Manager (`apt`, `brew`, etc.)
  - From source

The results are quite interesting:

<a href="https://twitter.com/loige/status/1340999569807712257" rel="nofollow noreferrer">
{% responsiveImage './blog/articles/installing-node-js/poll-results.png', 'Install Node.js Twitter poll results', { maxWidth: 593 }  %}
</a>

It seems quite obvious that people in my network, mostly fellow software engineers, prefer to use version managers such as `nvm` or `n`.

The second place (actually very tight with the third one) is the official installer, followed by a system package manager and, last one, installing Node.js from source.


## Install Node.js using n

Since installing Node.js using a version manager seems to be the favourite option (and it's also my personal favorite!) let's start with it.

My favourite Node.js version manager is [`n` by TJ Holowaychuk](https://github.com/tj/n). The reason why I like it is because it is quite simple to install and use and it is generally up to date with the latest releases of Node.js.
The main issue with it is that it does not support Windows, so if Windows is your operative system, this is not an option for you!

Let's see how to install `n`:

If you are on macOS and you have `brew` installed, the simplest way to install `n` is to just do it with `brew`:

```bash
brew install n
```

Alternatively you can use the custom install script:

```bash
curl -L https://git.io/n-install | bash
```

If all goes well, you should now be able to use the `n` executable from your shell.

This are some of the commands you can run:

```bash
n --version # shows the version of `n` installed in your system
n lts # installs the latest LTS release of Node.js
n list # lists all the versions of Node.js currently available
n <some_version> # install the given version of Node.js and switch to it 
```

Or you can simply run:

```bash
n
```

For an interactive prompt that will show you all the available versions, highlight the ones you have already installed and let you pick the version you want to switch to.

{% image './blog/articles/installing-node-js/n.gif', 'n Node.js version manager in action', { width: 640, height: 428 } %}

In summary, this is where `n` shines or falls short:

  - 👎 No official support for Windows
  - 👍 Very easy to install on macOs and unix systems
  - 👍 Very easy to keep your Node.js install up to date and switch version on demand
  - 👍 It keeps all the installed versions cached, so you can switch quicly between versions (no full re-install)
  - 👍 Allows to keep the setup local to the user so you don't have to use admin permission to install global packages


## Install Node.js using nvm

With more than 45 thousand stars on GitHub, [`nvm`](https://github.com/nvm-sh/nvm), which stands for "Node.js Version Manager" (no surprises!), is probably the most famous Node.js version manager currently available.

`nvm` works on any POSIX-compliant shell (`sh`, `dash`, `ksh`, `zsh`, `bash`, etc.) and it has been strongly tested against the following systems: unix, macOS, and windows WSL.

The easiest way to install `nvm` on your system is to use the official installer script:

```bash
VERSION=v0.37.2
curl -o- "https://raw.githubusercontent.com/nvm-sh/nvm/${VERSION}/install.sh" | bash
```

**Note**: At the time of writing, version `v0.37.2` is the latest version available. Make sure to check out if there is any new version available if you are installing `nvm` following this tutorial.

Once `nvm` is installed in your system, here's some examples showing what you can do with it:

```bash
nvm install node # installs the latest version of No.js
nvm install --lts # installs the latest LTS version of Node.js
nvm install "10.10.0" # installs a specific version of Node.js
nvm use "8.9.1" # switch to a specific version of Node.js
nvm exec "4.2" node somescript.js # runs a specific script with a given version of Node.js (no switch)
nvm which "4.2" # shows the full path where a given version of Node.js was installed
nvm ls # lists all the versions of Node.js available
```

One great thing about `nvm` is that it allows to easily specify the Node.js version you want to use for a given project.

For instance, if you are working on a project that requires you to use Node.js `10.10` you can do the following (in the root folder of the project):

```bash
echo "10.10" > .nvmrc
```

Then every time you work on that project, you only need to run:

```bash
nvm use
```

Which should print something like this:

```
Found '/path/to/project/.nvmrc' with version <10.10>
Now using node v10.10.1 (npm v6.7.3)
```

At this point, you can be sure that you working using the correct Node.js version for your project.

If you don't want to do manually, you can enable [deeper shell integration](https://github.com/nvm-sh/nvm#deeper-shell-integration) to make this appen automatically when you `cd` into a folder that has a `.nvmrc` file.

**PRO tip**: You can also do that by using [`asdf`](https://asdf-vm.com/), a *meta* version manager that offers a unified interface for various languages and version managers (including Node.js, of course).

Finally, here are some pros and cons of `nvm`:

  - 👍 Most popular version manager for Node.js with a large community of users.
  - 👍 Very easy to install on POSIX systems.
  - 👍 It allows for easy (and even automated) switch of Node.js version based on the project you are working on.
  - 👍 It keeps all the installed versions cached, so you can switch quicly between versions (no full re-install)
  - 👍 You can run once off commands on a given version of Node.js without having to switch the entire system to that version.
  - 👎 You might have to take a bit of time to go through the documentation and make sure you install it and use it correctly.


## Install Node.js using the official installer

TODO

TODO: mention Nodesource


## Install Node.js using a package manager

TODO


## Install Node.js from source

TODO


## Node.js with Docker

...


## Conclusion

...
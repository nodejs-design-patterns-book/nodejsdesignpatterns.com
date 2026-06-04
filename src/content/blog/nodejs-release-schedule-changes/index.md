---
date: 2026-06-04T10:00:00
updatedAt: 2026-06-04T10:00:00
title: Node.js is changing its release schedule and version numbers
slug: nodejs-release-schedule-changes
description: Node.js is moving to one major release a year, year-based version numbers, every release becoming LTS, and a new Alpha channel. Here is what changes.
authors: ['luciano-mammino']
tags: ['blog']
faq:
  - question: How is the Node.js release schedule changing?
    answer: Starting in October 2026, Node.js moves from two major releases a year to one. A single major lands every April and is promoted to LTS every October. Every release now becomes LTS, so the old odd/even distinction goes away.
  - question: How will Node.js version numbers work now?
    answer: Major version numbers will line up with the calendar year of the release. Node.js 27 arrives in 2027, Node.js 28 in 2028, Node.js 29 in 2029, and so on. The number now tells you, at a glance, how old a runtime is.
  - question: Does every Node.js release become LTS now?
    answer: Yes. With the new model there is no more odd/even split. Every major release is promoted to Long Term Support after its six months on the Current line, and each line is supported for about 36 months in total.
  - question: What is the new Node.js Alpha channel?
    answer: The Alpha channel is a new six-month pre-release phase (for example 27.0.0-alpha.1) that runs before a version becomes Current. It is meant for library authors and CI pipelines to test breaking changes early. It is not meant for production.
  - question: Do I need to change anything if I only use LTS versions?
    answer: Not really. If you already upgrade only to LTS releases, little changes for you beyond the version numbering. LTS support windows stay around 30 months, and now every release eventually becomes LTS.
---

The Node.js project just announced the first big change to its release schedule in about ten years. Starting in October 2026, Node.js moves from **two major releases a year to one**, version numbers will start lining up with the calendar year, **every release becomes LTS**, and there is a brand new Alpha channel for early testing.

If that sounds like a lot, here is the reassuring part up front: if you are like most people and you only ever upgrade to LTS versions, very little actually changes for you beyond the version numbers on the box. But the change is interesting, it is genuinely well thought out, and it is worth understanding so you can plan your upgrades with confidence.

In this article we will look at what is changing, why the project decided to do it, and what it means for you in practice, whether you run Node.js in production, maintain a library, or are just trying to keep track of which version you are supposed to be on.

## Quick Answer: what is changing

If you only have a minute, here is the whole thing in six bullets:

1. **One major release a year**, not two. Each new major lands every **April** and is promoted to **LTS in October**.
2. **Year-based version numbers**. Node.js 27 ships in 2027, Node.js 28 in 2028, Node.js 29 in 2029, and so on.
3. **Every release becomes LTS**. The odd/even distinction is gone. Node.js 27 will become LTS, and so will every release after it.
4. **A new Alpha channel** (for example `27.0.0-alpha.1`) gives library authors and CI pipelines a six-month window to test breaking changes early.
5. **Support windows stay familiar**: LTS is still around 30 months, with roughly 36 months from first release to end of life.
6. **It starts in October 2026**. Node.js 26 is the last release under the old model, and Node.js 27 is the first under the new one.

The rest of this article unpacks each of these and adds the dates, the reasoning, and the practical advice.

## How Node.js releases work today (pre October 2026)

Before we get into what is changing, it is worth a quick refresher on how things have worked up to now, because the contrast is what makes the new model click.

Under the model we have had for the last decade, Node.js shipped **two majors a year**: one in April and one in October. Every new major spent six months on the **Current** line, the stabilization period where library authors test compatibility. After those six months, the version's fate depended on a single rule:

- **Odd-numbered** releases (like 25, 27) reached end of life and were never promoted.
- **Even-numbered** releases (like 24, 26) were promoted to **Active LTS** and supported for a total of 30 months.

If you have ever had to explain that rule to someone new, you already know the problem with it. I have written a whole book about Node.js and taught it for years, and I have lost count of how many times I have had to say "no, don't use that one, it's odd, wait for the even one." It is one of those things that feels obvious once you know it and completely arbitrary until you do. Newcomers trip over it constantly.

For the full mechanics of the old model, including how Active LTS and Maintenance LTS differ, our guide on [installing (and updating) Node.js](/blog/5-ways-to-install-node-js/) and the one on [checking your Node.js version](/blog/checking-node-js-version/) both walk through it. From here on, we will focus on what is new.

## What changes from October 2026

The new model keeps everything that worked about the old one (a predictable cadence, a stabilization period, long support windows) and removes the parts that caused friction. Let's go through the four headline changes.

### One major release a year

Instead of two majors a year, there will be **one**. The rhythm is simple and predictable:

- A new major enters **Current in April**.
- It is promoted to **LTS in October** of the same year.

That is it. April for the new toy, October for the stable one you actually deploy. Half as many majors to track, and the dates never move.

### Year-based version numbers

This is my favorite part, and it is the change the title of this article is really about. From now on, **the major version number lines up with the calendar year** of the release:

- Node.js **27** ships in **2027**
- Node.js **28** ships in **2028**
- Node.js **29** ships in **2029**

I will happily admit that I can never remember off the top of my head which year a given Node.js major actually came out. Was 18 a 2022 thing? 2023? With year-based numbers that question disappears. The number _is_ the year, so working out whether a runtime is getting old becomes trivial mental math. If you have ever used Ubuntu, where `24.04` instantly tells you "April 2024," you already know how nice this is to reason about.

### Every release becomes LTS

With one release a year, there is no longer any need for the odd/even dance. **Every release becomes LTS.** Node.js 27 will become LTS, Node.js 28 will become LTS, and so on, every single year.

This is the change I am quietly happiest about, and it ties directly into the project's own reasoning. The Node.js team openly acknowledged that **adoption of the odd-numbered releases has historically been very low**: most people simply waited for the next LTS and skipped the odd ones entirely. I have to put my hand up here, because I am exactly that person. I can count on one hand the number of times I have pushed an odd-numbered release to production, and honestly I tend to avoid them even for day-to-day development, precisely so that I am ready to go to production the moment the matching LTS lands. If the releases people actually run are the LTS ones, then making every release an LTS is just the model catching up with reality.

### A new Alpha channel

Here is the clever bit. The odd releases were not _only_ about version churn. They also served a real purpose: they gave library authors a real, tagged build to test breaking changes against before those changes reached an LTS. Drop the odd releases naively and you would lose that early-warning system.

So the project is replacing it with something better: a dedicated **Alpha channel**. For the six months before a version becomes Current (October to March), there will be signed, tagged Alpha builds, using the standard semver prerelease format like `27.0.0-alpha.1` and `27.0.0-alpha.2`.

Crucially, Alpha builds **allow semver-major (breaking) changes** and go through real quality gates (they are tested through CITGM, the project's "Canary in the Goldmine" tooling), which is more than the old Nightly builds offered. They are explicitly **not for production**: they are a testing ground for the people who need to catch breaking changes early. As a bonus, this also lets the project land V8 engine updates earlier in the cycle.

## The new release lifecycle

Putting it all together, every release now flows through the same four phases:

| Phase           | Duration  | What it is for                                             |
| --------------- | --------- | ---------------------------------------------------------- |
| **Alpha**       | 6 months  | Oct to Mar. Early testing. Breaking changes still allowed. |
| **Current**     | 6 months  | Apr to Oct. Stabilization, the same role it has today.     |
| **LTS**         | 30 months | The long, stable window you deploy to production.          |
| **End of Life** | -         | The project stops providing fixes.                         |

That is roughly **36 months** from a version's first Current release to its end of life, which keeps the overall support window very close to what we have today. Here is how the new lifecycle looks across the next few releases, side by side with Node.js 26 on the old model so you can see the difference:

<figure>

![Timeline of the Node.js release schedule from April 2026 to April 2032. The top row shows Node.js 26 on the old model: Current, then Active LTS, then Maintenance. Below it, Node.js 27, 28 and 29 each follow the new model: a six-month orange Alpha phase, a six-month green Current phase, then a 30-month blue LTS phase. Each new major starts one year after the previous one, in a regular annual staircase.](./nodejs-new-release-schedule-2026.svg)

<figcaption>The new Node.js release schedule: one major a year, each flowing through Alpha, Current, and LTS</figcaption>

</figure>

Notice the regular staircase: every year a new Alpha begins as the previous version settles into LTS. There is always plenty of overlap between supported LTS lines, so you keep the comfortable migration windows you have today.

## Node.js 26 vs Node.js 27

The cleanest way to see the shift is to compare the last release of the old world with the first release of the new one.

**Node.js 26** (the last under the old model):

| Milestone   | Date         |
| ----------- | ------------ |
| Released    | April 2026   |
| Enters LTS  | October 2026 |
| Maintenance | October 2027 |
| End of Life | April 2029   |

**Node.js 27** (the first under the new model):

| Milestone         | Date         |
| ----------------- | ------------ |
| Alpha begins      | October 2026 |
| Released (27.0.0) | April 2027   |
| Enters LTS        | October 2027 |
| End of Life       | April 2030   |

If you are running Node.js 26 today, nothing about _your_ version changes. It lives out its full, normal LTS life under the old rules. The new model simply begins with the version that comes after it.

## The schedule going forward

Because the cadence is now so regular, you can read the schedule years into the future without a calendar. Each major enters Alpha in October, goes Current the following April, becomes LTS that October, and reaches end of life three years after it first shipped:

| Version | Alpha    | Current  | LTS      | End of Life |
| ------- | -------- | -------- | -------- | ----------- |
| 27.x    | Oct 2026 | Apr 2027 | Oct 2027 | Apr 2030    |
| 28.x    | Oct 2027 | Apr 2028 | Oct 2028 | Apr 2031    |
| 29.x    | Oct 2028 | Apr 2029 | Oct 2029 | Apr 2032    |
| 30.x    | Oct 2029 | Apr 2030 | Oct 2030 | Apr 2033    |
| 31.x    | Oct 2030 | Apr 2031 | Oct 2031 | Apr 2034    |
| 32.x    | Oct 2031 | Apr 2032 | Oct 2032 | Apr 2035    |

It is hard to overstate how much easier this is to plan around than "wait, is the next one odd or even?"

## Why the project is doing this

A change like this is not made lightly, so it is worth understanding the reasoning, because it tells you a lot about the health of the project.

The honest, unglamorous truth is that **Node.js is maintained largely by volunteers**, and the old model asked a lot of them. Keeping security fixes flowing across four or five active release lines at once means a huge amount of backporting, testing, and coordination, and most of that effort went into release lines that, as we saw, comparatively few people were actually running.

The data backed this up on every front:

- **Low odd-release adoption.** Most users waited for LTS and skipped the odd releases, so the effort of maintaining them rarely paid off.
- **Newcomer confusion.** The odd/even rule is a genuine stumbling block for people new to the ecosystem.
- **Sustainability.** Fewer concurrent release lines means less backporting toil and more energy focused on the releases people depend on.

I want to take a moment here, because it is easy to read an announcement like this as just logistics. It is not. A volunteer-run project looking honestly at where its maintainers' time goes, and then choosing to cut its own busywork so that the people keeping Node.js secure can breathe a little, is exactly the kind of quiet, responsible decision that keeps a project alive for another decade. The fundamentals do not change, but the people maintaining them get a more sustainable life. That is a very good thing, and the maintainers deserve a genuine thank you for it.

## What it means for you

Let's bring this back down to practical advice, because what you should do depends on who you are.

**If you only run LTS in production** (which is what we always recommend), this is almost a non-event. Keep doing exactly what you do today: deploy LTS, upgrade to the next LTS when you have time to test, and enjoy not having to remember the odd/even rule ever again. The one thing to internalize is the new mental model: the version number is now the year, and every yearly release is one you can eventually run in production.

**If you maintain a library or a tool**, this is where you have a real job to do, and the project is asking for your help. Please wire the new **Alpha** releases into your CI as early as you can. The whole point of the Alpha channel is to surface breaking changes before they reach the users who depend on you, and that only works if maintainers actually test against it. If you only ever test on LTS, you will find out about breakage at the same time your users do, which is exactly the situation Alpha exists to prevent. I will be adding Alpha runs to the CI of my own open source packages, and I would gently nudge you to do the same.

**Either way**, a good habit is to know exactly what you are running. If you are not sure, our short guide on [checking your Node.js version](/blog/checking-node-js-version/) covers all the ways to find out, and when the time comes to move, [installing (and updating) Node.js](/blog/5-ways-to-install-node-js/) walks through the smoothest paths with version managers like `fnm` and `nvm`.

And if you are curious what actually ships _inside_ these releases rather than just when they ship, our tour of [what's new in Node.js 26](/blog/whats-new-in-nodejs-26/) is a good companion read. As a fun side effect of this whole change, there will now be one of those "what's new" articles a year instead of two, which I cannot pretend I am sad about.

:::tip[Want to write Node.js that survives every release?]
Release schedules come and go, but the patterns that make Node.js code scalable and maintainable stay remarkably stable. Our book **Node.js Design Patterns** focuses on exactly those fundamentals: streams, async control flow, modules, and scalable architectures that outlast any version number.

[Get a FREE chapter →](/#free-chapter)
:::

## Wrapping up

The new Node.js release model is, at heart, the project simplifying itself to match how people actually use it. One major a year, version numbers that tell you the year, every release becoming LTS, and a proper Alpha channel for the folks who need to test ahead. Less to remember, less to confuse newcomers, and a more sustainable load for the volunteers who keep the whole thing running.

For most of us, the takeaway is delightfully boring: keep deploying LTS, and from Node.js 27 onward just read the version number as a year. For library authors, there is one concrete action: get Alpha into your CI early.

For the canonical details, the [official announcement, "Evolving the Node.js Release Schedule"](https://nodejs.org/en/blog/announcements/evolving-the-nodejs-release-schedule), is the source of truth, and you can always check the live [Node.js releases page](https://nodejs.org/en/about/previous-releases) for the current status of every version. The discussion that led here lives in the [nodejs/Release proposal](https://github.com/nodejs/Release/issues/1113) if you want to read the thinking in full.

And, as always, a heartfelt thank you to the Node.js team and every contributor who keeps this runtime thoughtful, stable, and a genuine pleasure to build on. Here is to the next decade. 😉

See you in the next article!

## Frequently Asked Questions

### How is the Node.js release schedule changing?

Starting in October 2026, Node.js moves from two major releases a year to one. A single major lands every April and is promoted to LTS every October. Every release now becomes LTS, so the old odd/even distinction goes away.

### How will Node.js version numbers work now?

Major version numbers will line up with the calendar year of the release. Node.js 27 arrives in 2027, Node.js 28 in 2028, Node.js 29 in 2029, and so on. The number now tells you, at a glance, how old a runtime is.

### Does every Node.js release become LTS now?

Yes. With the new model there is no more odd/even split. Every major release is promoted to Long Term Support after its six months on the Current line, and each line is supported for about 36 months in total.

### What is the new Node.js Alpha channel?

The Alpha channel is a new six-month pre-release phase (for example `27.0.0-alpha.1`) that runs before a version becomes Current. It is meant for library authors and CI pipelines to test breaking changes early. It is not meant for production.

### Do I need to change anything if I only use LTS versions?

Not really. If you already upgrade only to LTS releases, little changes for you beyond the version numbering. LTS support windows stay around 30 months, and now every release eventually becomes LTS.

---
title: Building a Blog with Astro
date: 2023-09-30
tags: ["Astro", "Programming"]
category: Programming
thumbnail: images/how-standards-proliferate.png
---

## Astro v3

My third time with [Astro](https://astro.build/). Astro has moved to v3.
So this is my third attempt: the first was v1, the second was v2, and now this.
Each time I only got as far as listing posts and then lost interest,
so the blog never got updated.

The thing that bothered me most was image handling in Markdown:
Astro required custom scripts to load images via relative paths.
This may not be unique to Astro, but as a static site generator,
not resolving paths for static files outside the `public`
directory felt inadequate and drained my motivation.

![How standards proliferate](./images/how-standards-proliferate.png)

However, since v3 was released, I expected some improvements and
started rebuilding the blog.

As you can see, the image above loads via the relative path
`./images/how-standards-proliferate.png`, and it also appears to be
converted to WebP. While writing this article, I also noticed that
extra spaces inserted after line breaks when converting Markdown to HTML
for CJK (Chinese, Japanese, Korean) text no longer occur by default.
Previously I had to use a plugin like
[purefun/remark-join-cjk-lines](https://github.com/purefun/remark-join-cjk-lines)
to remove those spaces, but that is no longer necessary.

With version 3, Astro seems mature enough to meet most general needs.
Still, there were a few things I wanted to do in this build that I
could not accomplish.

## Libraries that caught my attention

I noted some libraries I discovered while building this blog but failed to adopt.

### Syntax highlighting

- [wooorm/starry-night](https://github.com/wooorm/starry-night)
- [Microflash/rehype-starry-night](https://github.com/Microflash/rehype-starry-night)
- [Code Hike](https://codehike.org/)

Code Hike was a library that interested me last time rather than this time.
It still did not seem to support Astro, so I skipped it.
Starry Night is the open-source version of a project that was developed
inside GitHub. There appears to be a plugin as well, and if it works,
it should display source code nicely. I tried disabling Shiki in
`astro.config.mjs` and adding it as a rehype plugin, but it did not work.
I want to try again after the blog setup settles down.

## Impressions

I implemented listing posts and rendering content, and then deployed it.
Given that I had touched Astro before and that it requires little learning
if you only need static site generation, I finished it in about half a day.

I only implemented the bare minimum, so while writing articles I want to
keep adding features going forward.

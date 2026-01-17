---
title: Design Renewal
date: 2026-01-16
tags: ["Design", "Vibe Coding", "Poem"]
category: Programming
thumbnail: images/renewal.png
---

I renewed the site's design.
Compared to the previous design, it feels more consistent and calm.

Both the old and current blog are built with Next.js static site generation (SSG).
The technology is the same, but I rewrote the code from scratch.

## Technical changes

The technical differences are:

- UnoCSS -> TailwindCSS
- Feature Sliced Design
- RadixUI, shadcn/ui

You might think this could be done by modifying the existing code rather than rebuilding,
but based on the past few months, I decided it would be better to move to an AI-first codebase
that doesn't require direct manual edits, which should reduce total cost when adding features later.

## AI-first codebase

By an AI-first codebase, I mean a codebase that does not include manual architectural decisions or implementations,
and where nearly all design and implementation policies are driven by prompts.
In other words, although details of generated code may differ, it should be reproducible using prompts alone.
The prompts themselves are not special or elaborate; they simply guide the intended output.
I did not use long prompts. Each prompt was about as short as a single sentence in this article.
In fact, this entire article is longer than all the prompts I gave combined.
**In this world, building with Next.js on GitHub Actions and publishing to GitHub Pages takes fewer keystrokes than writing a single blog post.**

## Why rebuild and how long it took

There were other reasons to rebuild from scratch.
I have several features I want to add to this blog.
They could be separate sites, but since this site already has an approved Google Adsense,
I decided to build on it so I could earn at least some pocket money.

As mentioned, the prompt volume was small, and the build took about six hours.
If I had subscribed to the ChatGPT (Codex) Pro plan, it would have been even faster.
It took six hours because I hit the per-session usage limit.
In other words, **the site migration completed in one session (five hours) plus a little extra**.

## Site design

I gave a few prompt hints for the design, but mostly left it to Codex.
The only fixes I made were to remove AI-typical design patterns that appear with any coding agent.
These "AI-ish" patterns are often pointed out; representative examples include:

- Purple/blue gradients, dark backgrounds, pale accent colors
- Glass/transparent effects, subtle shadows, soft glow
- Neutral sans-serif fonts like Inter/Roboto
- Very bold headings and thin body text, wide line spacing
- Rounded cards laid out at equal spacing
- Feature cards with icons, CTA buttons, FAQ accordions in standard positions
- Abstract 3D blobs, isometric illustrations, emoji-like icons
- Typical SaaS landing page ordering
- Mostly center-aligned and symmetry-focused

I got this list from ChatGPT 5.2 Thinking DeepResearch, and it all feels familiar.
I tried to remove these tendencies in the new design, but AI-ness still remains in places.

I feel these tendencies are stronger with Claude Code than with Codex.
This might just be because I have used Claude Code longer and built more software with it.
Still, for site design, I feel Codex currently has the edge over Claude Code.

## Coding from here on

If I ended here, it would just be "I renewed the site," so I'll share thoughts on future coding.
Both personal and work coding has become almost entirely coding-agent-driven.
This likely creates disparities across companies.
People with a Claude Max-level license and those with only a Pro-level license or GitHub Copilot
will have completely different opinions about coding agents.
The gap is **literally a different experience**.
It's like 3G vs 5G, or ADSL vs 10Gb fiber (ADSL might not resonate anymore).

I think this also explains why general users and programmers evaluate Claude so differently.
Programmers are evaluating models under the assumption of **generous access to Claude Opus 4.5 (at least Max plan)**.
At this moment, I don't think any model rivals Claude Opus 4.5 in coding tasks.
If I could use GPT-5.2-Codex without rate limits, my evaluation might change,
but in coding, Anthropic will likely remain dominant for a while.
That said, Codex is not inferior in every way.
Depending on the use case, Codex has advantages.
Even for coding, I don't think it is hugely behind Claude Code.
In fact, 99% of this blog was implemented by Codex (I only used Claude Code briefly when I hit rate limits).

The fact that most users do not feel a decisive performance difference in common use cases means
LLM companies are being forced to choose among (or pursue in parallel) the following:

- Maintain performance while lowering cost
- Improve single-model performance for complex tasks
- Increase token generation speed
- Prioritize services built around their own models
- Strengthen multimodal capabilities

These are not fully independent, but being mediocre at each will make it hard to survive future competition.
If general users are becoming satisfied with current quality and speed,
Anthropic's focus on enterprise and OpenAI's focus on consumer features could lead to more than just short-term profit differences.

That was a digression from coding, but Claude Opus 4.5 already shows potential to take away coding tasks from engineers in professional workflows.
Famous programmers have said similar things recently, but even rank-and-file programmers feel it.
Engineers who can only write code may no longer have a place...

That said, this is not necessarily pessimistic.
If coding time is taken over, we can spend it on other things, which is positive for employed engineers.
However, the skill set required of programmers will definitely change.
The problem is that **access to the latest development environment will become even more difficult than before**.
Where you work and whether you can afford a personal monthly expense of tens of thousands of yen
now greatly affects what skills you can gain.

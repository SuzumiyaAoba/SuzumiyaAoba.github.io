---
title: Aircraft Boarding Strategy
date: 2025-04-15
category: Diary
tags: ["Optimization", "Diary"]
---

## Prologue

I took a flight for the first time in six years.
To board a plane, you gather at the gate by the specified time, then you're called based on your seat position, and you line up when it's your turn.
Depending on the case, you may take a bus to the aircraft, and if you are lucky with a gate that connects directly, you board immediately.
On the airline I took recently, the boarding order was decided by whether your seat was in the front or back of the aircraft.
There were 32 rows total, with five seats per row, and passengers from row 16 and back boarded first, followed by those in the front.

However, with that strategy, if aisle-seat passengers sit first, window-seat passengers have to step out into the aisle to sit down,
and that blocks the flow of people trying to move further back.
Watching that made me wonder: what is the optimal boarding strategy?

## Prior research

Searching in Japanese led me to the following document.

- [Optimizing Boarding Strategies for Aircraft](https://orsj.org/wp-content/corsj/or61-10/or61_10_686.pdf)

It seems to be a publication by [ORSJ (The Operations Research Society of Japan)](https://orsj.org/).
Looking at their site, they handle many problems that seem solvable by mathematical optimization.

I also found the following article.

- [Why the "waiting time" when boarding a plane doesn't get shorter — the reason lies in airline revenue structure | WIRED.jp](https://wired.jp/2018/02/28/airlines-boarding-process/)

As an optimization problem, it feels familiar and practical, and I wondered if there are better solutions than
Back-to-Front.
I also thought it would be fun to build a page to simulate it if one exists.

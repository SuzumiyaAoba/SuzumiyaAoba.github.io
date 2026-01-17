---
title: Hello, World
date: 2023-09-30
category: "Test"
tags: ["Test"]
draft: true
model: GPT-5.2-Codex
---

## org-mode

This is an article to verify org rendering. It checks that org, which is supported on this site, works correctly.

### Headings

# h1

h1

## h2

h2

### h3

h3

#### h4

h4

##### h5

h5

###### h6

h6

## Emphasis

- _Italic_ (_italic_)
- **Bold** (**bold**)
- <u>Underline</u> (<u>underline</u>)
- ~~Strikethrough~~ (~~strikethrough~~)
- x<sup>2</sup>
- x<sub>0</sub>

## Quote

> I actually claim that the difference between a good programmer and a bad one is whether they consider data structures important. Bad programmers worry about the code itself, while good programmers worry about data structures and their relationships.
>
> -- Linus Torvalds

## Lists

In org, bullet lists written with `*` or `-` are converted into lists using the `ul` tag.

- Item 1
  - Item 1-1
    - Item 1-1-1
  - Item 1-2
- Item 2

`ul` stands for "Unordered List."

If you use `1.` instead of `*` or `-`, it will be converted into a list using the `ol` tag.

1. Item 1
   1. Item 1.1
      1. Item 1.1.1
   1. Item 1.2
1. Item 2

You can also express checkboxes with `- [ ]`.

- [ ] Unchecked
  - [ ] Nested
- [x] Checked
  - [ ] Nested

## Horizontal Rule

---

## Tables

Table

| A   | B   |
| --- | --- |
| a   | b   |

Following text

### Center alignment

Center alignment

|  A  |  B  |  C  |
| :-: | :-: | :-: |
|  a  |  b  |  c  |
|  1  |  2  |  3  |

Following text

### Left alignment

Left alignment

|  A  |  B  |  C  |
| :-: | :-: | :-: |
|  a  |  b  |  c  |
|  1  |  2  |  3  |

Following text

### Right alignment

Right alignment

|  A  |  B  |  C  |
| :-: | :-: | :-: |
|  a  |  b  |  c  |
|  1  |  2  |  3  |

Following text

## Code

```
console.log("Hello, World");
```

```js
// Print Hello, World! to the console
console.log("Hello, World!");
```

```java Main.java
public class Main {
  public static void main(args: String[]) {
    System.out.println("Hello, World!");
  }
}
```

## Math

$E = mc^2$.

Fourier transform formula.

$$\mathcal{F}(\omega) = \frac{1}{\sqrt{2\pi}}\int^{\infty}_{-\infty} f(x) e^{-i\omega x} dx$$

---
title: 論理演算子 ― 条件を組み合わせる
llm: true
co-author: ["Claude Opus 4.7"]
---

## 論理演算子 ― 条件を組み合わせる

**論理演算子**（Logical Operator）は、`true` / `false`（`boolean`）を組み合わせて、より複雑な条件を作る演算子です。

たとえば「点数が 0 以上 **かつ** 100 以下」のように、複数の条件をまとめて判断したいときに使います。

| 演算子 | 読み | 意味 |
|---|---|---|
| `&&` | かつ（AND） | 両方とも `true` のとき `true` |
| `\|\|` | または（OR） | どちらか一方でも `true` なら `true` |
| `!` | でない（NOT） | `true` と `false` を反転する |

---

## かつ（&&）と または（||）

`&&` は「両方とも成り立つ」、`||` は「どちらか一方でも成り立つ」を表します。

```text line-numbers=false
jshell> boolean a = true && false;
a ==> false
jshell> boolean b = true || false;
b ==> true
```

- `true && false` … 両方が `true` でないと `true` にならないので、`false`
- `true || false` … どちらかが `true` なら `true` なので、`true`

実際の条件と組み合わせると、わかりやすくなります。

```text line-numbers=false
jshell> int score = 80;
score ==> 80
jshell> boolean pass = score >= 0 && score <= 100;
pass ==> true
```

`score >= 0`（`true`）と `score <= 100`（`true`）の両方が成り立つので、`&&` の結果は `true` です。

---

## でない（!）

`!` は、`boolean` の値を反転します。`true` を `false` に、`false` を `true` にします。

```text line-numbers=false
jshell> boolean closed = !true;
closed ==> false
```

「開いている（`true`）の、逆」なので「閉じている（`false`）」というイメージです。

---

## 真理値表

`&&`・`||` の結果を、表にまとめておきます。

| A | B | `A && B` | `A \|\| B` |
|---|---|---|---|
| `true` | `true` | `true` | `true` |
| `true` | `false` | `false` | `true` |
| `false` | `true` | `false` | `true` |
| `false` | `false` | `false` | `false` |

> **補足: 必要なくなったら、それ以上は調べない（短絡評価）**
>
> `&&` は、左が `false` なら、その時点で全体が `false` に決まるので、右は調べません。
> `||` も、左が `true` なら、右を調べません。
> このしくみを**短絡評価**（ショートサーキット）と呼びます[^short-circuit]。

---

## 短絡評価が役に立つ場面

短絡評価は、ただの豆知識ではなく、実際に役立ちます。
たとえば、「0 で割るとエラーになる」のを避けたいとき、次のように書けます。

```java
int x = 0;
boolean safe = (x != 0) && (10 / x > 1);
```

```text line-numbers=false
jshell> safe
safe ==> false
```

`x` が 0 のとき、左の `x != 0` は `false` です。`&&` は左が `false` なら右を調べないので、**`10 / x`（0 での割り算）は実行されません**。
もし短絡評価がなければ、`10 / 0` が実行されてエラーになっていたはずです（0 での割り算はエラーになります。くわしくは第20章で学びます）。

このように、「**左の条件が成り立つときだけ、右の条件を調べる**」順序をうまく使うと、安全なコードが書けます。
そのため、`&&` では「**先に調べるべき条件・守りの条件を左に**」書くのが定石です。

---

## まとめ

この節では、論理演算子を学びました。

- 論理演算子は、`boolean` を組み合わせる：`&&`（かつ）・`||`（または）・`!`（でない）
- `&&` は両方が `true` のとき、`||` はどちらかが `true` のとき、`true` になる
- `!` は `true` と `false` を反転する
- これらは、第6章の条件分岐で「複数の条件をまとめて判断する」のに使う

次の節では、複数の演算子が混ざったときの計算順序 ―― **演算子の優先順位**を学びます。

[^short-circuit]: *The Java® Language Specification, Java SE 25 Edition*, §15.23 "Conditional-And Operator &&," §15.24 "Conditional-Or Operator ||," [https://docs.oracle.com/javase/specs/jls/se25/html/jls-15.html#jls-15.23](<https://docs.oracle.com/javase/specs/jls/se25/html/jls-15.html#jls-15.23>)。`&&` と `||` は短絡評価を行い、右オペランドは左オペランドの結果が決定できない場合のみ評価される。`&`／`|` は評価を短絡しない論理演算子。

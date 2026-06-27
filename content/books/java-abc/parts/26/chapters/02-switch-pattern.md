---
title: switch のパターンマッチング
llm: true
co-author: ["Claude Opus 4.7"]
---

## switch のパターンマッチング

第6章で学んだ `switch` は、値（`int` や `String`、`enum`）で分岐するものでした。
Java 21 からは、`switch` で**型による分岐**ができるようになりました。
これが、**switch のパターンマッチング**です。
この節では、その書き方を学びます。

---

## instanceof の連打は、読みにくい

「相手の型に応じて、処理を変えたい」場面を考えます。
パターンマッチングなしだと、`if-else if` で `instanceof` を並べることになります。

```java
static String describe(Object obj) {
    if (obj instanceof Integer i) {
        return "整数: " + i;
    } else if (obj instanceof String s) {
        return "文字列: " + s;
    } else if (obj instanceof Double d) {
        return "小数: " + d;
    } else {
        return "その他";
    }
}
```

動きはしますが、`else if` と `instanceof` が何度も続いて、少し読みにくいですね。
第15章でも、「`instanceof` の連打は避けたい」と触れました。

---

## switch なら、すっきり書ける

これを **switch のパターンマッチング**で書くと、こうなります。

```java
static String describe(Object obj) {
    return switch (obj) {
        case Integer i -> "整数: " + i;
        case String s  -> "文字列: " + s;
        case Double d  -> "小数: " + d;
        default        -> "その他";
    };
}

IO.println(describe(42));
IO.println(describe("hello"));
IO.println(describe(3.14));
```

```text
整数: 42
文字列: hello
小数: 3.14
```

`case Integer i ->` は、「`obj` が `Integer` なら、それを `i` に入れて、この処理をする」という意味です。
第6章の switch 式（`->`）と同じ形ですが、`case` のラベルが「**値**」ではなく「**型（とパターン変数）**」になっています。

`if-else if` の連打が、整然とした `case` の並びになりました。
それぞれの `case` で、パターン変数（`i`・`s`・`d`）を、すぐ使えるのも便利です。

---

## switch 式なので、値を返せる

上の例は、第6章で学んだ **switch 式**（`->` で値を返す形）です。
各 `case` の結果が、そのまま `switch` 全体の値になり、`return` で返せます。

「型を見分けて、それぞれに応じた値を作る」という処理が、1つの式にまとまるのです。
`if-else if` で `return` を何度も書くより、ずっと見通しがよくなります。

---

## null も case で扱える

ふつうの `switch` は、`null` を渡すと `NullPointerException` になりました（第6章）。
ですが、パターンマッチングの `switch` では、**`case null`** と書いて、`null` を安全に扱えます。

```java
static String describe(Object obj) {
    return switch (obj) {
        case null      -> "null です";
        case Integer i -> "整数: " + i;
        case String s  -> "文字列: " + s;
        default        -> "その他";
    };
}

IO.println(describe(null));
IO.println(describe(42));
```

```text
null です
整数: 42
```

`case null ->` を書いておけば、`null` が来ても、例外にならず、ちゃんと「null です」と処理できます。
「`null` のチェックを、`switch` の中に含められる」のは、地味ですが、とても便利な改善です。

---

## まとめ

- Java 21 から、**`switch` で型による分岐**ができる（switch のパターンマッチング）
- `case 型 変数 ->` で、「その型なら、変数に入れて処理する」（`instanceof` の連打より読みやすい）
- **switch 式**（`->`）なので、各 `case` の結果を、値として返せる
- **`case null`** で、`null` も安全に扱える（ふつうの switch と違う）

次の節では、レコードの中身を分解して取り出す、**レコードパターン**を学びます。

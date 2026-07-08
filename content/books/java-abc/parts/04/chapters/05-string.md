---
title: 文字列型 String ― 文字のまとまりを扱う
llm: true
co-author: ["Claude Opus 4.7"]
---

## 文字列型 String ― 文字のまとまりを扱う

第3章から、`"Hello, World!"` のような文字のまとまりを、何度も使ってきました。
このような**文字のまとまり**を扱う型が、**文字列型 String**（ストリング）です[^java-string-class]。

前の節で学んだ `char` が「1文字」だったのに対し、`String` は「**何文字でもよい、文字のまとまり**」を扱えます。

> **補足: String は基本データ型ではない**
>
> `String` は、前節で学んだ基本データ型（プリミティブ型）には**含まれません**。第3節で触れた**参照型**の仲間です。
> `int` などと違って先頭が大文字なのも、そのためです。
> ただし、文字列はとてもよく使うので、本書ではこの章で特別に取り上げます。参照型の本当のしくみは、第2部でくわしく学びます。

---

## 文字列を変数に入れる

文字列は、**ダブルクォート `"`** で囲んで書き、`String` 型の変数に入れます。

```text line-numbers=false
jshell> String hello = "Hello";
hello ==> "Hello"
```

`hello ==> "Hello"` のように、文字列は前後に `"` が付いて表示されます。
これは「これは文字列ですよ」と jshell が示しているためで、`IO.println` で表示すると、`"` は付かずに中身だけが出ます。

```text line-numbers=false
jshell> IO.println(hello);
Hello
```

---

## 文字列をつなげる ― `+` による連結

文字列は、**`+`** を使ってつなげることができます。これを**連結**（れんけつ）と呼びます[^jls-string-concat]。

```text line-numbers=false
jshell> String combined = hello + ", World";
combined ==> "Hello, World"
jshell> IO.println(combined);
Hello, World
```

`hello`（中身は `"Hello"`）と `", World"` がつながって、`"Hello, World"` になりました。

文字列には、数値をつなげることもできます。

```text line-numbers=false
jshell> String scoreMsg = "得点: " + 80 + "点";
scoreMsg ==> "得点: 80点"
jshell> IO.println(scoreMsg);
得点: 80点
```

`"得点: "` という文字列に数値 `80` をつなげると、`80` は自動的に文字へと変換され、`"得点: 80"` になります。
さらに `"点"` をつなげて、`"得点: 80点"` というメッセージができあがりました。

このように、`+` で文字列と値をつなげることで、表示したいメッセージを組み立てられます。

> **注意: `+` には2つの顔がある**
>
> 同じ `+` でも、はたらきが変わります。
>
> - `"得点: " + 80` … 文字列が関わると、**連結**（文字としてつなげる）
> - `1 + 2` … 数値どうしなら、**足し算**（計算して `3`）
>
> そのため、`"答え: " + 1 + 2` のように混ぜると、思わぬ結果になることがあります。
> このあたりのくわしい話は、第5章「演算子と式」で取り上げます。いまは「文字列が関わる `+` は連結になる」とだけ覚えておきましょう。

---

## 文字数を数える ― length()

`String` には、文字列を便利に扱うための「操作」が、たくさん用意されています。
たとえば、文字数を数える `length()`（レングス）を使ってみましょう。

```text line-numbers=false
jshell> "Hello".length()
$1 ==> 5
```

`"Hello"` は5文字なので、`5` が返ってきました。
（行頭の `$1` は、jshell が「式の結果」に自動で付ける名前です。番号は気にしなくてかまいません。）

このような、値に対して行える操作を**メソッド**（Method）と呼びます。
`String` には `length()` のほかにも、文字を探したり、一部を取り出したりする便利なメソッドがたくさんあります。
それらは、第10章「文字列の操作」でまとめて学びます。

---

## char と String の違い

最後に、よく似た `char` と `String` の違いを、はっきりさせておきましょう。

| | char | String |
|---|---|---|
| 入れるもの | **1文字だけ** | 文字のまとまり（0文字以上、何文字でも） |
| 囲む記号 | シングルクォート `'` | ダブルクォート `"` |
| 例 | `'A'` | `"A"`, `"Hello"`, `"こんにちは"` |
| 種類 | 基本データ型 | 参照型 |

ポイントは、囲む記号が違うことです。
`'A'` は1文字（`char`）、`"A"` は文字列（`String`）―― 同じ「A」でも、囲む記号で型が変わります。

ふだん、画面に文章を表示したり、名前やメッセージを扱ったりするときは、`String` を使うことがほとんどです。

---

## まとめ

この節では、文字列型 String を学びました。

- **String** は、文字のまとまりを扱う型。ダブルクォート `"` で囲む
- `String` は基本データ型ではなく、**参照型**の仲間（だから先頭が大文字）
- `+` で文字列を**連結**できる。数値をつなげると、自動的に文字へ変換される
- `"…".length()` で文字数を数えられる（こうした操作を**メソッド**と呼ぶ。くわしくは第10章）
- `'A'` は1文字（`char`）、`"A"` は文字列（`String`）。囲む記号で型が変わる

次の節では、ここまで何気なく書いてきた `100` や `"Hello"`、`'A'` のような「コードに直接書いた値」＝**リテラル**を、整理して学びます。

[^java-string-class]: Java SE 25 API Specification, `java.lang.String`, [https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/String.html](<https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/String.html>)。`String` は不変（immutable）クラスで、`length()`、`charAt(int)`、`substring(int,int)`、`equals(Object)` などのメソッドを持つ。

[^jls-string-concat]: *The Java® Language Specification, Java SE 25 Edition*, §15.18.1 "String Concatenation Operator +," [https://docs.oracle.com/javase/specs/jls/se25/html/jls-15.html#jls-15.18.1](<https://docs.oracle.com/javase/specs/jls/se25/html/jls-15.html#jls-15.18.1>)。オペランドのいずれかが `String` 型のとき `+` は文字列連結となり、もう一方は文字列変換（§5.1.11）される。

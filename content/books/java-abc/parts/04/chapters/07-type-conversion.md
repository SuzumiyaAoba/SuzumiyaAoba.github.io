---
title: 型変換 ― 自動変換とキャスト
llm: true
co-author: ["Claude Opus 4.7"]
---

## 型変換 ― 自動変換とキャスト

プログラムを書いていると、型の違う値どうしを一緒に扱う場面が出てきます。
たとえば、整数（`int`）を小数（`double`）の箱に入れたいときなどです。

このように、ある型の値を別の型に変えることを、**型変換**（Type Conversion）と呼びます。
型変換には、**自動で行われるもの**と、**自分で指示するもの**の2種類があります。

---

## 自動でできる変換 ― 狭い型から広い型へ

`int`（整数）の値を、`double`（小数）の箱に入れてみましょう。

```text line-numbers=false
jshell> double d = 10;
d ==> 10.0
```

整数の `10` を入れたのに、`10.0` という小数になりました。
`int` から `double` への変換が、**自動的に**行われたのです。

このように、**より広い範囲を扱える型へ**の変換は、Java が自動で行ってくれます[^jls-widening-conversion]。
`int`（整数）から `double`（小数）へは、情報が失われる心配がないため、安全に自動変換できるのです。

---

## キャスト ― 広い型から狭い型へ

では、逆に `double`（小数）を `int`（整数）の箱に入れたいときは、どうなるでしょうか。
この場合は、小数点以下が**失われてしまう**ため、Java は自動では変換してくれません。

そこで、「情報が失われてもいいので、変換してください」と、自分で指示します。
これを**キャスト**（Cast、型キャスト）と呼び、`(int)` のように、変換したい型をかっこで囲んで書きます[^jls-narrowing-conversion]。

```text line-numbers=false
jshell> int i = (int) 3.9;
i ==> 3
```

`3.9` を `int` にキャストすると、小数点以下が**切り捨て**られて `3` になりました。
ここで注意したいのは、**四捨五入ではなく、切り捨て**だということです（`3.9` でも `3` になります）。

![自動変換とキャスト。int から double のような広い型へは自動変換され、double から int のような狭い型へはキャストが必要で、小数点以下が切り捨てられる。](./images/type-conversion.svg)

---

## つまずきポイント1: 整数どうしの割り算

ここからは、初心者がとてもよくつまずく落とし穴を2つ紹介します。

まず、**整数どうしの割り算**です。`7 ÷ 2` を計算してみましょう。

```text line-numbers=false
jshell> int a = 7 / 2;
a ==> 3
```

`7 ÷ 2 = 3.5` のはずなのに、結果は `3` になりました。
これは、**整数どうしの計算は、結果も整数になる**ためです。小数点以下は切り捨てられてしまいます。

小数の結果がほしいときは、どちらか一方を**小数**にします。

```text line-numbers=false
jshell> double b = 7.0 / 2;
b ==> 3.5
```

`7.0`（`double`）にすると、もう一方の `2` も自動的に `double` に変換され、計算結果も `3.5` になりました。

> **注意: `double` の箱に入れても、手遅れになることがある**
>
> 「`double` の箱に入れれば小数になるのでは？」と思うかもしれません。ですが、次のように書いても `3.0` にしかなりません。
>
> ```text
> jshell> double c = 7 / 2;
> c ==> 3.0
> ```
>
> これは、`7 / 2` の計算が**先に整数で**行われて `3` になり、そのあとで `double` に変換されるためです。
> 小数で計算したいなら、計算の**前に** `7.0 / 2` のように小数にしておく必要があります。

---

## つまずきポイント2: 桁あふれ（オーバーフロー）

もう一つの落とし穴が、型の**範囲を超えてしまう**ことです。

第4節で学んだとおり、`int` で扱える整数には上限（およそ 21 億）があります。
その上限ぎりぎりの値に、さらに `1` を足すと、どうなるでしょうか。

```text line-numbers=false
jshell> int maxv = 2147483647;
maxv ==> 2147483647
jshell> int over = maxv + 1;
over ==> -2147483648
```

`2147483647` は `int` の最大値です。それに `1` を足したら、もっと大きい数になる…と思いきや、結果は**いちばん小さい数（マイナス）**になってしまいました。

このように、型の範囲を超えて値があふれることを、**桁あふれ**（オーバーフロー、Overflow）と呼びます[^jls-integer-overflow]。
メーターが一周して戻ってしまうようなイメージです。

大きな数を扱うとわかっているときは、`int` ではなく `long` を使う、といった対策が必要です。

---

## 文字列と数値は、自動では変換されない

最後に、文字列（`String`）と数値のあいだの変換にも触れておきます。

第5節で見たように、文字列に数値を `+` でつなげると、連結された文字列になります。
たとえば、文字列の `"5"` と数値の `3` を `+` すると…

```text line-numbers=false
jshell> String s = "5" + 3;
s ==> "53"
```

`8` ではなく、`"53"` という文字列になりました。
`"5"` はあくまで**文字**であって、数値の `5` とは別物だからです。`+` は「足し算」ではなく「連結」として働きます。

文字列を数値として計算したいときは、`Integer.parseInt(...)` を使って、文字列を整数に変換します[^java-integer-parseInt]。

```text line-numbers=false
jshell> int n = Integer.parseInt("5") + 3;
n ==> 8
```

`Integer.parseInt("5")` で、文字列 `"5"` が整数の `5` に変換され、`5 + 3` で `8` になりました。

> **補足: `Integer.parseInt` は、これから先で活躍する**
>
> キーボードから入力された文字を数値として扱いたいときなど、`Integer.parseInt(...)` のような変換は、実際の場面でよく登場します。
> いまは「文字列と数値は別物で、変換するための道具がある」と知っておけば十分です。

---

## まとめ

この節では、型変換を学びました。

- **型変換**には、自動で行われるものと、自分で指示する**キャスト**がある
- `int` → `double` のような**広い型へ**の変換は、自動で行われる
- `double` → `int` のような**狭い型へ**の変換は、`(int)` のように**キャスト**で指示する（小数点以下は切り捨て）
- **整数どうしの割り算は、結果も整数になる**（`7 / 2` は `3`）。小数がほしいなら `7.0 / 2` とする
- 型の範囲を超えると**桁あふれ（オーバーフロー）**が起きる
- 文字列と数値は別物。`"5" + 3` は `"53"`（連結）。数値にするには `Integer.parseInt(...)` を使う

次の節では、型を自分で書くかわりに Java に推論してもらう、便利な書き方 **var** を学びます。

[^jls-widening-conversion]: *The Java® Language Specification, Java SE 25 Edition*, §5.1.2 "Widening Primitive Conversion," [https://docs.oracle.com/javase/specs/jls/se25/html/jls-5.html#jls-5.1.2](<https://docs.oracle.com/javase/specs/jls/se25/html/jls-5.html#jls-5.1.2>)。`byte → short → int → long → float → double` などの拡大変換は暗黙に行われ、`char → int → ...` も含まれる。

[^jls-narrowing-conversion]: *The Java® Language Specification, Java SE 25 Edition*, §5.1.3 "Narrowing Primitive Conversion," [https://docs.oracle.com/javase/specs/jls/se25/html/jls-5.html#jls-5.1.3](<https://docs.oracle.com/javase/specs/jls/se25/html/jls-5.html#jls-5.1.3>)。縮小変換（`double → int` など）は明示的キャストが必要で、浮動小数点から整数への変換では小数部が切り捨てられる（§5.1.3 表）。

[^jls-integer-overflow]: *The Java® Language Specification, Java SE 25 Edition*, §15.18.2 "Additive Operators (+ and -) for Numeric Types," [https://docs.oracle.com/javase/specs/jls/se25/html/jls-15.html#jls-15.18.2](<https://docs.oracle.com/javase/specs/jls/se25/html/jls-15.html#jls-15.18.2>)。"If an integer addition overflows, then the result is the low-order bits of the true mathematical sum as represented in some sufficiently large two's-complement format." と規定されている（オーバーフロー時は例外を投げず、2の補数表現で巻き戻る）。

[^java-integer-parseInt]: Java SE 25 API Specification, `java.lang.Integer#parseInt(String)`, [https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Integer.html#parseInt(java.lang.String)](<https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Integer.html#parseInt(java.lang.String)>)。"Parses the string argument as a signed decimal integer." 解析できない場合は `NumberFormatException` を投げる。

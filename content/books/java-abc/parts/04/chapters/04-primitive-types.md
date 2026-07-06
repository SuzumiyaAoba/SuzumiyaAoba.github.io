---
title: 基本データ型 ― 整数・小数・真偽・文字
llm: true
co-author: ["Claude Opus 4.7"]
---

## 基本データ型 ― 整数・小数・真偽・文字

前の節で、型には**基本データ型（プリミティブ型）**と**参照型**の2種類があると学びました。
この節では、よく使う**基本データ型**を、一つずつ見ていきます。

基本データ型は全部で8種類ありますが[^jls-primitive-types]、最初からすべてを覚える必要はありません。
まずは、次の4つをおさえれば十分です。

- 整数を表す `int`
- 小数を表す `double`
- 真偽（はい／いいえ）を表す `boolean`
- 1文字を表す `char`

順に試していきましょう。

---

## 整数を表す ― int と long

整数を入れる箱が `int`（イント、integer ＝ 整数の略）です。
ここまで何度も使ってきた、いちばん身近な型ですね。

```text
jshell> int i = 100;
i ==> 100
```

`int` で扱えるのは、およそ **-21 億から 21 億まで**の整数です（厳密には `−2³¹` 〜 `2³¹−1`）[^jls-int-range]。
日常で使う整数なら、ほとんどこの範囲に収まります。

ですが、それを超える大きな数を扱いたいときは、`long`（ロング）を使います。

```text
jshell> long big = 10000000000L;
big ==> 10000000000
```

ここで、値の末尾に付いている **`L`** に注目してください。
`10000000000`（100 億）は `int` の範囲を超えているため、そのまま書くとエラーになります。
末尾に `L` を付けて「これは `long` の値ですよ」と Java に伝える必要があるのです[^jls-long-literal]。

> **補足: なぜ範囲があるのか**
>
> コンピュータは、1つの数を保存するために、決まった大きさの場所（メモリ）を使います。
> その場所の大きさが型ごとに決まっているため、入れられる数の範囲にも上限があります。
> `int` より `long` のほうが、より広い場所を使うので、大きな数を入れられる、というわけです。

---

## 小数を表す ― double

`3.14` や `100.5` のような小数を入れる箱が `double`（ダブル）です。

```text
jshell> double d = 3.14;
d ==> 3.14
```

小数を扱いたいときは、ふつうこの `double` を使えば十分です。
（`float`（フロート）という小数の型もありますが、`double` より精度が低く、使う場面は限られます。）

---

## 真偽を表す ― boolean

`boolean`（ブーリアン）は、**`true`（真・はい）** か **`false`（偽・いいえ）** の、どちらか一方だけを入れられる型です。

```text
jshell> boolean isOpen = true;
isOpen ==> true
```

入れられる値は `true` と `false` の2つだけ、という、とてもシンプルな型です。
この型は、第6章で学ぶ「条件によって処理を変える（条件分岐）」のときに、大きな役割を果たします。

---

## 1文字を表す ― char

`char`（チャー、character ＝ 文字の略）は、**たった1文字**を入れる型です。
文字は、**シングルクォート `'`** で囲みます。

```text
jshell> char initial = 'A';
initial ==> 'A'
```

ここで注意したいのが、第3章でも少し触れた `'`（シングルクォート）と `"`（ダブルクォート）の違いです。

- `'A'` … **1文字**だけ（`char`）。シングルクォートで囲む
- `"A"` … **文字列**（`String`）。ダブルクォートで囲む。1文字でも文字列

この違いは、次の第5節（文字列型 String）でも、あらためて取り上げます。

---

## 基本データ型の一覧

基本データ型8種類を、表にまとめておきます。
**太字の4つ（`int`・`double`・`boolean`・`char`）を、まずは覚えましょう。** 残りは「こういうものもある」と眺めておけば十分です。

| 型 | 入れる値 | 例 | 備考 |
|---|---|---|---|
| **`int`** | 整数 | `100`, `-5` | 整数はふつうこれ（約 -21 億〜21 億） |
| **`double`** | 小数 | `3.14`, `-0.5` | 小数はふつうこれ |
| **`boolean`** | 真偽 | `true`, `false` | 「はい／いいえ」の2つだけ |
| **`char`** | 1文字 | `'A'`, `'あ'` | シングルクォートで囲む1文字 |
| `long` | 大きな整数 | `10000000000L` | `int` に収まらない数。末尾に `L` |
| `float` | 小数（精度低め） | `3.14f` | `double` で足りるので、あまり使わない |
| `byte` | 小さな整数 | `127` | -128〜127。あまり使わない |
| `short` | 小さめの整数 | `32000` | -32768〜32767。あまり使わない |

> **補足: 型の名前は、すべて小文字**
>
> `int`・`double`・`boolean`・`char` のように、基本データ型の名前は**すべて小文字**です。
> 次の節で学ぶ `String` が大文字で始まるのは、`String` が基本データ型ではなく「参照型」の仲間だからです。
> 「小文字で始まるのは基本データ型」と知っておくと、両者を見分ける手がかりになります。

---

## まとめ

この節では、基本データ型を学びました。

- 整数は **`int`**（大きな数は `long`、末尾に `L`）
- 小数は **`double`**
- 真偽（`true` / `false`）は **`boolean`**
- 1文字は **`char`**（シングルクォート `'` で囲む）
- 基本データ型は全部で8種類あるが、まずは `int`・`double`・`boolean`・`char` の4つを覚えれば十分
- 基本データ型の名前は、すべて小文字で始まる

次の節では、文字のまとまりを扱う**文字列型 String** を、くわしく見ていきます。

[^jls-primitive-types]: *The Java® Language Specification, Java SE 25 Edition*, §4.2 "Primitive Types and Values," [https://docs.oracle.com/javase/specs/jls/se25/html/jls-4.html#jls-4.2](<https://docs.oracle.com/javase/specs/jls/se25/html/jls-4.html#jls-4.2>)。8つの基本型 `boolean`／`byte`／`short`／`int`／`long`／`char`／`float`／`double` の定義と値域が規定されている。

[^jls-int-range]: *The Java® Language Specification, Java SE 25 Edition*, §4.2.1 "Integral Types and Values," [https://docs.oracle.com/javase/specs/jls/se25/html/jls-4.html#jls-4.2.1](<https://docs.oracle.com/javase/specs/jls/se25/html/jls-4.html#jls-4.2.1>)。`int` は32ビット符号付き2の補数表現で、値域は `−2^31`（−2,147,483,648）から `2^31 − 1`（2,147,483,647）。`long` は64ビット符号付きで、値域は `−2^63` から `2^63 − 1`。

[^jls-long-literal]: *The Java® Language Specification, Java SE 25 Edition*, §3.10.1 "Integer Literals," [https://docs.oracle.com/javase/specs/jls/se25/html/jls-3.html#jls-3.10.1](<https://docs.oracle.com/javase/specs/jls/se25/html/jls-3.html#jls-3.10.1>)。末尾に `L` または `l` が付いた整数リテラルは `long` 型として扱われ、付かないものは `int` 型として扱われる（`int` の範囲を超えるとコンパイルエラー）。

---
title: 文字列を加工する
llm: true
co-author: ["Claude Opus 4.7"]
---

## 文字列を加工する

文字列の一部を**切り出したり**、**置き換えたり**、**大文字・小文字に変換したり**する方法を学びます。

ここで何度も思い出してほしいのが、第1節で学んだ**不変性**です。
これらのメソッドは、**元の文字列を変えず、加工した「新しい文字列」を返します**。結果を使いたいときは、必ず変数で受け取りましょう。

---

## 一部を切り出す ― substring

**`substring`**（サブストリング、部分文字列）は、文字列の一部を切り出します。2つの使い方があります。

**1. `substring(開始位置)`** … 開始位置から、最後まで

```java
String s = "Hello, World";
```

```text line-numbers=false
jshell> s.substring(7)
$2 ==> "World"
```

インデックス `7` から最後までを切り出して、`"World"` が得られました。

**2. `substring(開始位置, 終了位置)`** … 開始位置から、終了位置の**手前**まで

```text line-numbers=false
jshell> s.substring(0, 5)
$2 ==> "Hello"
```

ここで注意したいのが、**終了位置の文字は含まれない**ことです。
`substring(0, 5)` は、インデックス `0`・`1`・`2`・`3`・`4` の5文字（`"Hello"`）で、**インデックス `5` は含みません**。

```text line-numbers=false
"Hello, World"
 0  1  2  3  4  5
 H  e  l  l  o  ,
└──── 0〜4 ────┘  ← substring(0, 5) はここまで（5 は含まない）
```

「開始は含む、終了は含まない」――これは Java の範囲指定でよく出てくる考え方です。
切り出される文字数は、ちょうど「終了位置 − 開始位置」（`5 - 0 = 5` 文字）になります。

---

## 置き換える ― replace

**`replace`** は、文字列の中の特定の部分を、**すべて**別の文字列に置き換えます。

```java
String s = "Hello, World";
```

```text line-numbers=false
jshell> s.replace("o", "0")
$2 ==> "Hell0, W0rld"
```

`"o"` が2つとも `"0"` に置き換わりました（**最初の1つだけ**ではなく、**すべて**置き換わる点に注意）。

もちろん、これも新しい文字列を返すだけで、元の `s` は `"Hello, World"` のままです。

---

## 大文字・小文字にする ― toUpperCase / toLowerCase

**`toUpperCase()`** は全部を大文字に、**`toLowerCase()`** は全部を小文字にした、新しい文字列を返します。

```java
String s = "Hello, World";
```

```text line-numbers=false
jshell> s.toUpperCase()
$2 ==> "HELLO, WORLD"

jshell> s.toLowerCase()
$3 ==> "hello, world"
```

大文字・小文字を無視して比較したいときの下ごしらえなどに使います（比較は第6節で学びます）。

---

## 前後の空白を取り除く ― strip

入力された文字列の前後に、よけいな空白が付いていることがあります。
それを取り除くのが **`strip()`** です。

```text line-numbers=false
jshell> "  hi  ".strip()
$1 ==> "hi"
```

前後のスペースが取り除かれ、`"hi"` になりました（**間**の空白は取り除かれません）。

> **`strip()` と `trim()`**
>
> 同じ働きの古いメソッドに `trim()` があります。
> `trim()` は古い空白の定義しか扱えませんが、`strip()`（Java 11 で追加）は全角スペースなどの **Unicode の空白**にも対応しています。
> これから書くなら、**`strip()`** を使うのがおすすめです。

---

## まとめ

| やりたいこと | メソッド | 例 |
|---|---|---|
| 一部を切り出す | `substring(開始)` / `substring(開始, 終了)` | `"Hello".substring(0, 2)` → `"He"` |
| 置き換える（すべて） | `replace(前, 後)` | `"aaa".replace("a", "b")` → `"bbb"` |
| 大文字／小文字に | `toUpperCase()` / `toLowerCase()` | `"Hi".toUpperCase()` → `"HI"` |
| 前後の空白を除く | `strip()` | `"  hi  ".strip()` → `"hi"` |

- `substring(開始, 終了)` は、**終了位置を含まない**
- すべてのメソッドは**新しい文字列を返す**（元は変わらない）。結果は変数で受け取る

次の節では、文字列を**つなぐ・区切る・体裁を整える**方法を学びます。

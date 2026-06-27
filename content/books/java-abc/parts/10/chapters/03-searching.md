---
title: 文字列を調べる
llm: true
co-author: ["Claude Opus 4.7"]
---

## 文字列を調べる

「この文字列に、ある文字が含まれているか？」「どこにあるか？」「どう始まるか？」――
文字列の中身を**調べる**メソッドを学びます。これらは、入力チェックや検索でよく使います。

以下では、次の文字列を例に使います。

```java
String s = "Hello, World";
```

---

## 含まれているか ― contains

ある文字列が**含まれているか**を調べるのが、**`contains`** です。`boolean`（`true` / `false`）を返します。

```text
jshell> s.contains("World")
$2 ==> true

jshell> s.contains("Java")
$3 ==> false
```

「メールアドレスに `@` が含まれているか」のような判定に、よく使います。
`boolean` を返すので、`if` の条件にそのまま書けます。

```java
if (s.contains("World")) {
    IO.println("World が見つかりました");
}
```

---

## どこにあるか ― indexOf

**`indexOf`** は、指定した文字・文字列が**最初に現れる位置（インデックス）**を返します。

```text
jshell> s.indexOf("o")
$2 ==> 4

jshell> s.indexOf("World")
$3 ==> 7
```

`"Hello, World"` の最初の `"o"` は、インデックス `4`（`Hell` の次）にあります。

ここで**とても大事な注意**があります。
探している文字列が**見つからないときは、`-1` を返します**。

```text
jshell> s.indexOf("z")
$2 ==> -1
```

「見つからない ＝ `-1`」は、文字列処理の定番ルールです。
`indexOf` の結果が `-1` かどうかで、「含まれているか」を判定することもできます（`contains` は、内部的にはこの仕組みを使っています）。

また、**最後に現れる位置**を知りたいときは、**`lastIndexOf`** を使います。

```text
jshell> s.lastIndexOf("o")
$2 ==> 8
```

`"Hello, World"` には `"o"` が2つあり、最後のもの（`World` の `o`）はインデックス `8` です。

---

## どう始まる・終わるか ― startsWith / endsWith

文字列が、特定の文字列で**始まるか／終わるか**を調べるのが、**`startsWith`** と **`endsWith`** です。どちらも `boolean` を返します。

```text
jshell> s.startsWith("Hello")
$2 ==> true

jshell> s.endsWith("World")
$3 ==> true

jshell> s.endsWith(".txt")
$4 ==> false
```

「ファイル名が `.txt` で終わるか」「URL が `https` で始まるか」といった判定に便利です。

---

## 空っぽか ― isEmpty / isBlank

文字列が**空かどうか**を調べるメソッドもあります。

| メソッド | 意味 | 例 |
|---|---|---|
| `isEmpty()` | 長さが `0`（空文字列 `""`）か | `"".isEmpty()` → `true` |
| `isBlank()` | 空、または**空白文字だけ**か | `"   ".isBlank()` → `true` |

```text
jshell> "".isEmpty()
$1 ==> true

jshell> "   ".isEmpty()
$2 ==> false

jshell> "   ".isBlank()
$3 ==> true
```

`"   "`（スペースだけ）は、長さが `0` ではないので `isEmpty()` は `false` ですが、中身は空白だけなので `isBlank()` は `true` です。
入力欄が「実質的に空か」を確かめたいときは、`isBlank()` が役立ちます（`isBlank()` は Java 11 で追加されました）。

---

## まとめ

| やりたいこと | メソッド | 返すもの |
|---|---|---|
| 含まれているか | `contains(...)` | `boolean` |
| 位置を知る（最初／最後） | `indexOf(...)` / `lastIndexOf(...)` | `int`（なければ `-1`） |
| 始まり／終わりの判定 | `startsWith(...)` / `endsWith(...)` | `boolean` |
| 空か／空白だけか | `isEmpty()` / `isBlank()` | `boolean` |

- 特に、**`indexOf` は見つからないと `-1` を返す**ことを覚えておく

次の節では、文字列を**加工する**（切り出し・置き換え・大文字小文字）メソッドを学びます。

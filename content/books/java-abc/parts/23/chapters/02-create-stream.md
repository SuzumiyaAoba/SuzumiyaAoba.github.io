---
title: ストリームを作る
llm: true
co-author: ["Claude Opus 4.7"]
---

## ストリームを作る

ストリーム処理の最初の工程は、データを**ストリームに乗せる**こと（生成）です。
この節では、ストリームを作るいくつかの方法を学びます。

---

## コレクションから ― stream()

もっとも基本的なのは、List や Set などのコレクションから作る方法です。
コレクションの **`.stream()`** を呼ぶだけです。

```java
List<String> names = List.of("佐藤", "鈴木", "高橋");
names.stream()           // ストリームを作る
    .forEach(IO::println);   // （ここでは、各要素を表示）
```

```text
佐藤
鈴木
高橋
```

`names.stream()` で、リストの中身が「流れる準備」をします。
そのうしろに、中間操作や終端操作をつなげていきます。ここでは、終端操作の `forEach`（各要素に処理する）で、そのまま表示しています。

Set でも、まったく同じく `.stream()` で作れます。

---

## 値を並べて ― Stream.of

「決まったいくつかの値」から、その場でストリームを作るには、**`Stream.of(...)`** を使います。

```java
import java.util.stream.Stream;

Stream.of("赤", "緑", "青")
    .forEach(IO::println);
```

```text
赤
緑
青
```

`Stream.of(...)` は、`( )` に並べた値を流すストリームを作ります。
コレクションをわざわざ用意しなくても、手軽に試せます。
（`Stream` は `java.util.stream` パッケージにあるので、ファイルに書くときは `import` が必要です。jshell では自動 import されます。）

---

## 数値の範囲から ― IntStream

「1 から 5 まで」のような、**連続した整数**を流したいときは、**`IntStream`** が便利です。

```java
import java.util.stream.IntStream;

IntStream.rangeClosed(1, 5)      // 1 から 5 まで（5 を含む）
    .forEach(IO::println);
```

```text
1
2
3
4
5
```

- `IntStream.rangeClosed(1, 5)` … 1 から 5 まで（**終わりを含む**）
- `IntStream.range(1, 5)` … 1 から 4 まで（**終わりを含まない**。第7章の for と同じ感覚）

`IntStream` は、`int` 専用のストリームで、数値の合計や平均を求めるのが得意です（第4節）。

`IntStream` を、ふつうのストリーム（`Stream<Integer>`）にしたいときは、**`boxed()`** を使います。

```java
List<Integer> nums = IntStream.rangeClosed(1, 5).boxed().toList();
IO.println(nums);
```

```text
[1, 2, 3, 4, 5]
```

`boxed()` は、`int` を `Integer` に「箱詰め」する操作です（第19章のオートボクシングと同じ発想）。
これで、`1` から `5` までの整数リストを、ループなしで作れました。

---

## ストリームの作り方まとめ

| 元にするもの | 作り方 | 例 |
|---|---|---|
| コレクション | `.stream()` | `list.stream()` |
| 決まった値 | `Stream.of(...)` | `Stream.of("a", "b")` |
| 整数の範囲 | `IntStream.rangeClosed(a, b)` | `IntStream.rangeClosed(1, 5)` |
| 配列 | `Arrays.stream(配列)` | `Arrays.stream(arr)` |

いちばんよく使うのは、コレクションからの **`.stream()`** です。
まずはこれを覚え、必要に応じてほかの作り方を思い出せれば十分です。

---

## まとめ

- ストリームの最初の工程は、データを**ストリームに乗せる**こと
- コレクションからは **`.stream()`** で作る（もっとも基本）
- 決まった値からは **`Stream.of(...)`**
- 連続した整数は **`IntStream.rangeClosed(a, b)`**（`b` を含む）／`range(a, b)`（含まない）
- `IntStream` を `Stream<Integer>` にするには **`boxed()`**

次の節では、ストリームを加工する**中間操作**（`filter`・`map`・`sorted`）を学びます。

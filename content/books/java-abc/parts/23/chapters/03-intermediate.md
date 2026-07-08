---
title: 中間操作 ― filter・map・sorted
llm: true
co-author: ["Claude Opus 4.7"]
---

## 中間操作 ― filter・map・sorted

**中間操作**は、ストリームを流れるデータを「加工する」工程です。
何個でもつなげられ、結果はまたストリームになります。
この節では、もっともよく使う中間操作 ―― `filter`・`map`・`sorted` などを学びます。

---

## filter ― 条件で絞り込む

**`filter`** は、「**条件に合う要素だけ**」を通す中間操作です。
条件は、ラムダ式（第22章の `Predicate`、`true`/`false` を返す）で書きます。

```java
List<Integer> nums = List.of(1, 2, 3, 4, 5, 6);

List<Integer> evens = nums.stream()
    .filter(n -> n % 2 == 0)   // 偶数だけ通す
    .toList();

IO.println(evens);
```

```text line-numbers=false
[2, 4, 6]
```

`filter(n -> n % 2 == 0)` は、「`n` が偶数（2で割り切れる）なら通す」という意味です。
条件が `true` の要素だけが、次の工程へ流れます。`false` の要素（奇数）は、ここで取り除かれます。

「合格者だけ」「在庫があるものだけ」「東京在住の人だけ」のように、**絞り込み**は、もっともよく使う操作です。

---

## map ― 各要素を変換する

**`map`** は、「**各要素を、別の値に変換する**」中間操作です。
変換は、ラムダ式（第22章の `Function`、受け取って変換して返す）で書きます。

```java
List<Integer> nums = List.of(1, 2, 3);

List<Integer> doubled = nums.stream()
    .map(n -> n * 2)           // 各要素を2倍に
    .toList();

IO.println(doubled);
```

```text line-numbers=false
[2, 4, 6]
```

`map(n -> n * 2)` は、「各要素 `n` を、`n * 2` に変える」という意味です。
`1 → 2`、`2 → 4`、`3 → 6` と、すべての要素が変換されました。要素の**数は変わりません**（絞り込む `filter` との違いです）。

型を変える変換もできます。たとえば、文字列を「その長さ（数値）」に変換できます。

```java
List<String> words = List.of("apple", "banana", "cherry");

List<Integer> lengths = words.stream()
    .map(String::length)       // 各文字列 → その長さ
    .toList();

IO.println(lengths);
```

```text line-numbers=false
[5, 6, 6]
```

`String::length`（第22章のメソッド参照）で、「各単語を、その文字数に変換」しています。
`Stream<String>` が、`Stream<Integer>` に変わったのです。
「データを別の形に作り変える」のが、`map` の役割です。

---

## sorted ― 並べ替える

**`sorted`** は、要素を**並べ替える**中間操作です。
引数なしで呼ぶと、自然な順序（数値なら小さい順、文字列なら辞書順）で並びます。

```java
List<String> names = List.of("Charlie", "Alice", "Bob");

List<String> sorted = names.stream()
    .sorted()                  // 辞書順に並べ替え
    .toList();

IO.println(sorted);
```

```text line-numbers=false
[Alice, Bob, Charlie]
```

逆順や、独自のルールで並べたいときは、**`Comparator`**（比較のルール）を渡します。

```java
List<Integer> nums = List.of(3, 1, 4, 1, 5);

List<Integer> desc = nums.stream()
    .sorted(Comparator.reverseOrder())   // 大きい順
    .toList();

IO.println(desc);
```

```text line-numbers=false
[5, 4, 3, 1, 1]
```

`Comparator.reverseOrder()` で、「逆順（大きい順）」を指定しています。
`Comparator` は並べ替えのルールを表すもので、`Comparator.comparing(...)` で「何を基準に並べるか」を細かく指定することもできます（実践例は第6節）。

---

## そのほかの中間操作

ほかにも、便利な中間操作があります。

| 中間操作 | 役割 | 例 |
|---|---|---|
| `filter` | 条件で絞り込む | `.filter(n -> n > 0)` |
| `map` | 各要素を変換する | `.map(n -> n * 2)` |
| `sorted` | 並べ替える | `.sorted()` |
| `distinct` | 重複を取り除く | `.distinct()` |
| `limit` | 先頭から n 個だけ | `.limit(3)` |
| `skip` | 先頭の n 個を飛ばす | `.skip(2)` |

たとえば、`distinct` で重複を消し、`limit` で先頭3個だけにできます。

```java
List<Integer> nums = List.of(3, 1, 3, 2, 1, 5, 4);

List<Integer> result = nums.stream()
    .distinct()    // 重複を消す → 3, 1, 2, 5, 4
    .limit(3)      // 先頭3個   → 3, 1, 2
    .toList();

IO.println(result);
```

```text line-numbers=false
[3, 1, 2]
```

中間操作は、このように**いくつでもつなげられます**。
「絞る → 変換する → 並べる → 先頭だけ取る」のように、やりたい加工を、上から順に並べていくだけです。

---

## まとめ

- **中間操作**は、ストリームを加工する工程。いくつでもつなげられ、結果はまたストリーム
- **`filter`** … 条件に合う要素だけ通す（絞り込み。要素が減る）
- **`map`** … 各要素を別の値に変換する（要素数は変わらない。型も変えられる）
- **`sorted`** … 並べ替える（引数なしで自然順、`Comparator` で独自順）
- ほかに `distinct`（重複除去）・`limit`（先頭 n 個）・`skip`（先頭を飛ばす）など
- 中間操作だけでは、まだ実行されない（終端操作が必要 ― 次の節）

次の節では、結果を取り出す**終端操作**（`toList`・`count`・`sum`・`forEach`）を学びます。

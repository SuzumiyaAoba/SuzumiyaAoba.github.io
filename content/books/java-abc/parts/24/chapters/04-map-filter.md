---
title: map と filter ― 箱に入れたまま処理する
llm: true
co-author: ["Claude Opus 4.7"]
---

## map と filter ― 箱に入れたまま処理する

`Optional` には、ストリーム（第23章）と同じ名前の **`map`** や **`filter`** があります。
これらを使うと、中身を取り出さずに、**箱に入れたまま**変換・絞り込みができます。
この節では、その使い方を学びます。

---

## map ― 中身を変換する

**`map(変換)`** は、「中身があれば変換し、空ならそのまま空」を返します。

```java
Optional<String> name = Optional.of("佐藤");

Optional<Integer> length = name.map(s -> s.length());   // 中身を「文字数」に変換
IO.println(length.orElse(0));
```

```text line-numbers=false
2
```

`name`（「佐藤」入りの箱）を `map` で変換すると、「文字数（2）」が入った新しい箱になりました。
ポイントは、**箱の中身を取り出さずに**、箱ごと変換できることです。

空の箱を `map` しても、エラーにはなりません。**空のまま**を返します。

```java
Optional<String> empty = Optional.empty();
Optional<Integer> length = empty.map(s -> s.length());   // 空 → 空のまま
IO.println(length.isEmpty());
```

```text line-numbers=false
true
```

`empty.map(...)` は、中身がないので変換も行われず、空の箱がそのまま返ります。
「中身があれば変換、なければ何もしない」を、`if` なしで安全に書けるのです。

---

## filter ― 条件で絞り込む

**`filter(条件)`** は、「中身が条件を満たせばそのまま、満たさなければ空にする」を返します。

```java
Optional<Integer> age = Optional.of(25);

Optional<Integer> adult = age.filter(a -> a >= 18);   // 18以上か
IO.println(adult.isPresent());
```

```text line-numbers=false
true
```

`25` は `18` 以上なので、`filter` を通り抜け、中身はそのまま残りました。
もし条件を満たさなければ、**空の箱**になります。

```java
Optional<Integer> age = Optional.of(15);
Optional<Integer> adult = age.filter(a -> a >= 18);   // 15 は 18未満
IO.println(adult.isPresent());
```

```text line-numbers=false
false
```

`15` は条件（18以上）を満たさないので、箱は空になりました。
「条件に合わなければ、値はなかったことにする」という処理が書けます。

---

## つなげて書く ― メソッドチェーン

`Optional` の `map`・`filter` は、ストリームと同じく**つなげて**書けます。
「値があれば、変換して、条件で絞って、最後にデフォルト」といった処理が、流れるように書けます。

```java
Optional<String> input = Optional.of("  42  ");

int result = input
    .map(String::trim)                 // 前後の空白を取る → "42"
    .filter(s -> !s.isEmpty())         // 空文字でなければ
    .map(Integer::parseInt)            // 数値に変換 → 42
    .orElse(0);                        // 空なら 0

IO.println(result);
```

```text line-numbers=false
42
```

`"  42  "` を、空白除去 → 空チェック → 数値変換と、段階的に処理し、最後に `orElse(0)` で締めています。
途中のどこかで空になれば（たとえば入力が空文字なら）、以降の処理はスキップされ、最後に `0` が返ります。
**`null` チェックや `if` を何重にも書かずに、安全な処理が1本につながる** ―― これが、`Optional` の `map`・`filter` の強みです。

---

## ストリームとの共通点

気づいたかもしれませんが、`Optional` の `map`・`filter` は、第23章のストリームの `map`・`filter` と、考え方がそっくりです。

| | ストリーム | Optional |
|---|---|---|
| 扱うもの | 複数の要素の流れ | 0個または1個の値 |
| `map` | 各要素を変換 | 中身を変換（空なら空） |
| `filter` | 条件で絞り込む | 条件で絞り込む（合わなければ空） |

`Optional` は、いわば「**要素が最大1個のストリーム**」のようなものだと考えると、すっと理解できます。
「箱（やストリーム）に入れたまま、中身を取り出さずに処理する」 ―― これは、モダン Java に共通する、大切なスタイルです。

---

## まとめ

- **`map(変換)`** … 中身があれば変換、空なら空のまま（取り出さずに変換できる）
- **`filter(条件)`** … 条件を満たせばそのまま、満たさなければ空にする
- `map`・`filter`・`orElse` は**つなげて**書ける（メソッドチェーン）
- 途中で空になれば、以降の処理はスキップされ、安全に最後までつながる
- `Optional` の `map`・`filter` は、ストリームと同じ発想（最大1個のストリームのようなもの）

次の節では、Optional でつまずきやすいポイントを、まとめて確認します。

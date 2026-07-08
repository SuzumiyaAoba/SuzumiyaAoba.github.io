---
title: コレクションの繰り返し処理
llm: true
co-author: ["Claude Opus 4.7"]
---

## コレクションの繰り返し処理

コレクションに入れたデータは、**1つずつ順に取り出して処理**したいことがほとんどです。
この節では、List・Set・Map の中身を、繰り返し処理する方法を学びます。
第8章で学んだ **for-each**（拡張 for 文）が、ここでも主役になります。

---

## List を for-each で回す

第8章で、配列を for-each で回しました。List も、まったく同じように書けます。

```java
List<String> names = List.of("佐藤", "鈴木", "高橋");

for (String name : names) {
    IO.println(name);
}
```

```text line-numbers=false
佐藤
鈴木
高橋
```

`for (String name : names)` は、「`names` の要素を、1つずつ `name` に取り出して、くり返す」という意味でした。
List は順序を保つので、**入れた順（0番目から）**に取り出されます。
配列のときと、書き方も動きも、まったく同じです。

---

## Set を for-each で回す

Set も、同じく for-each で回せます。

```java
Set<String> tags = new HashSet<>();
tags.add("Java");
tags.add("プログラミング");
tags.add("入門");

for (String tag : tags) {
    IO.println(tag);
}
```

ただし、`HashSet` は**順序を保証しない**ので、取り出される順番は、入れた順とは限りません（実行環境によって変わることもあります）。
「**全部を1つずつ処理する**」のが目的で、**順番に意味がない**ときに使う、と考えてください。
（順番が重要なら、第4節で触れた `LinkedHashSet` や `TreeSet` を使います。）

---

## Map を for-each で回す ― entrySet

Map は「キーと値のペア」なので、少し書き方が変わります。
**`entrySet()`** を使うと、「キーと値のペア」を1つずつ取り出して回せます。

```java
Map<String, Integer> scores = new HashMap<>();
scores.put("佐藤", 80);
scores.put("鈴木", 95);
scores.put("高橋", 70);

for (var entry : scores.entrySet()) {
    IO.println(entry.getKey() + " : " + entry.getValue());
}
```

```text line-numbers=false
高橋 : 70
鈴木 : 95
佐藤 : 80
```

- `scores.entrySet()` … キーと値の**ペアの集まり**を返す
- ペア（`entry`）から、`getKey()` で**キー**、`getValue()` で**値**を取り出せる

変数の型は、第4章で学んだ `var` を使うと簡潔です（正式には `Map.Entry<String, Integer>` という型です）。

> **注意: HashMap の順番は保証されない**
>
> 上の出力は `高橋 → 鈴木 → 佐藤` の順ですが、これは「入れた順」でも「五十音順」でもありません。
> `HashMap` は、**並び順を保証しません**（内部のしくみで決まり、人間には予測できない順になります）。
> 「入れた順」で取り出したいなら `LinkedHashMap`、「キーの順」で並べたいなら `TreeMap` という実装を使います（Set の `LinkedHashSet`・`TreeSet` と同じ関係です）。

---

## キーだけ・値だけを回す ― keySet / values

「キーだけ」「値だけ」がほしいときは、**`keySet()`**・**`values()`** を使います。

```java
Map<String, Integer> scores = new HashMap<>();
scores.put("佐藤", 80);
scores.put("鈴木", 95);

// キーだけ
for (String name : scores.keySet()) {
    IO.println(name);
}

// 値だけ（合計を求める）
int total = 0;
for (int score : scores.values()) {
    total += score;
}
IO.println("合計: " + total);
```

```text line-numbers=false
鈴木
佐藤
合計: 175
```

- `keySet()` … すべての**キー**の集まり（Set）
- `values()` … すべての**値**の集まり

「名前の一覧だけほしい」なら `keySet()`、「点数を合計したい」なら `values()`、というように使い分けます。

---

## 繰り返しの早見表

| コレクション | 書き方 |
|---|---|
| List | `for (型 x : list) { ... }` |
| Set | `for (型 x : set) { ... }` |
| Map（キーと値） | `for (var e : map.entrySet()) { e.getKey() / e.getValue() }` |
| Map（キーだけ） | `for (型 k : map.keySet()) { ... }` |
| Map（値だけ） | `for (型 v : map.values()) { ... }` |

List と Set は、配列と同じ感覚で for-each できます。
Map だけは、「ペア（entrySet）」「キー（keySet）」「値（values）」のどれを回すかを選ぶ、と覚えておきましょう。

> **先取り: もっとスマートな繰り返し ― ストリーム**
>
> for-each は分かりやすいですが、「合計する」「条件で絞る」「変換する」といった処理を、もっと簡潔に書く方法もあります。
> それが、第23章で学ぶ**ストリーム API** です。
> たとえば「値の合計」は、ストリームを使うと1行で書けます。いまは for-each をしっかり押さえ、その便利さは第23章で体験しましょう。

---

## まとめ

- List・Set は、配列と同じく **for-each**（`for (型 x : コレクション)`）で回せる
- `HashSet`・`HashMap` は**順序を保証しない**（順番が必要なら `Linked〜` や `Tree〜`）
- Map は **`entrySet()`** で「キーと値のペア」を回し、`getKey()` / `getValue()` で取り出す
- **`keySet()`** でキーだけ、**`values()`** で値だけを回せる
- ペアの変数の型は `var` を使うと簡潔（正式には `Map.Entry<...>`）

次の節では、コレクションでつまずきやすいポイントを、まとめて確認します。

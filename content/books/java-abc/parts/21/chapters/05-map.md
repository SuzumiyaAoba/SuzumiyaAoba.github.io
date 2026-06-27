---
title: Map ― キーと値の対応
llm: true
co-author: ["Claude Opus 4.7"]
---

## Map ― キーと値の対応

**Map**（マップ）は、「**キー**（鍵）と**値**を、ペアで対応づける」コレクションです。
「名前 → 点数」「商品コード → 価格」のように、**あるものから、別のものを引きたい**ときに使います。
この節では、Map の使い方を学びます。

---

## Map の特徴 ― 辞書のようなもの

Map は、**辞書**にたとえると分かりやすいでしょう。

- 辞書は、「単語（キー）」を引くと、「意味（値）」が出てきます
- Map も、「キー」を渡すと、対応する「値」が返ってきます

| Map の言葉 | 意味 | 辞書でいうと |
|---|---|---|
| **キー**（Key） | 引くための目印 | 単語 |
| **値**（Value） | キーに対応する中身 | 意味 |

Map はジェネリックで、型引数を**2つ**指定します。`Map<キーの型, 値の型>` です。

```java
Map<String, Integer> scores = new HashMap<>();   // String → Integer
```

`Map<String, Integer>` は、「`String`（名前）をキーに、`Integer`（点数）を値とする」マップ、と読みます。
基本の実装は **`HashMap`**（ハッシュマップ）です。

---

## 値を登録する・取り出す ― put / get

キーと値のペアを登録するには、**`put(キー, 値)`** を使います。

```java
Map<String, Integer> scores = new HashMap<>();
scores.put("佐藤", 80);
scores.put("鈴木", 95);
scores.put("高橋", 70);
```

登録した値を取り出すには、**`get(キー)`** を使います。

```java
IO.println(scores.get("佐藤"));
IO.println(scores.get("鈴木"));
```

```text
80
95
```

`scores.get("佐藤")` で、「佐藤」に対応する点数 `80` が返ってきました。
「名前から点数を引く」が、まさに辞書のように実現できています。

---

## キーがないときは ― null と getOrDefault

登録していないキーを `get` すると、どうなるでしょうか。

```java
IO.println(scores.get("田中"));   // 登録していないキー
```

```text
null
```

存在しないキーを引くと、**`null`**（第11章）が返ります。
これをうっかり使うと `NullPointerException` になるので、注意が必要です。

そこで便利なのが、**`getOrDefault(キー, デフォルト値)`** です。
キーがなければ、`null` ではなく、指定した**デフォルト値**を返してくれます。

```java
IO.println(scores.getOrDefault("田中", 0));   // なければ 0
IO.println(scores.getOrDefault("佐藤", 0));   // あれば その値
```

```text
0
80
```

「登録がなければ `0` 点とみなす」のように、`null` を避けて安全に書けます。

---

## キーがあるか調べる ― containsKey

「あるキーが登録されているか」は、**`containsKey(キー)`** で調べられます。

```java
IO.println(scores.containsKey("鈴木"));
IO.println(scores.containsKey("田中"));
```

```text
true
false
```

`get` した結果が `null` かどうかで判定するより、`containsKey` を使うほうが、意図がはっきりします。

---

## 同じキーに put すると、上書きされる

すでにあるキーに、もう一度 `put` すると、値は**上書き**されます（追加ではありません）。

```java
Map<String, Integer> scores = new HashMap<>();
scores.put("佐藤", 80);
scores.put("佐藤", 100);   // 同じキーに、もう一度
IO.println(scores.get("佐藤"));
```

```text
100
```

`佐藤` の値が、`80` から `100` に上書きされました。
**1つのキーに対応する値は、つねに1つ**です。Map に「同じキーが2つ」存在することはありません。
（だからこそ、キーは「重複のない目印」として働きます。Set と似た性質ですね。）

---

## 要素数とサイズ

Map に登録されているペアの数は、**`size()`** で分かります。

```java
Map<String, Integer> scores = new HashMap<>();
scores.put("佐藤", 80);
scores.put("鈴木", 95);
IO.println(scores.size());
```

```text
2
```

---

## 最初から作る ― Map.of

中身の決まった Map は、**`Map.of(キー, 値, キー, 値, ...)`** で、一度に作れます。

```java
Map<String, Integer> prices = Map.of("りんご", 150, "みかん", 100);
IO.println(prices.get("りんご"));
```

```text
150
```

`List.of` と同じく、`Map.of` で作った Map も**変更不可**（`put` できない）です。
「あとから登録していくなら `new HashMap<>()`、決まった対応表なら `Map.of(...)`」と使い分けます。

---

## よく使う操作のまとめ

| やりたいこと | メソッド | 例 |
|---|---|---|
| 登録（上書き） | `put(キー, 値)` | `scores.put("佐藤", 80)` |
| 取得 | `get(キー)` | `scores.get("佐藤")` |
| なければデフォルト | `getOrDefault(キー, 既定値)` | `scores.getOrDefault("田中", 0)` |
| キーがあるか | `containsKey(キー)` | `scores.containsKey("鈴木")` |
| 削除 | `remove(キー)` | `scores.remove("佐藤")` |
| 個数 | `size()` | `scores.size()` |

---

## まとめ

- **Map** は、**キー**と**値**をペアで対応づけるコレクション（辞書のようなもの）
- 型は2つ指定する（`Map<String, Integer>`）。基本の実装は **`HashMap`**
- **`put(キー, 値)`** で登録、**`get(キー)`** で取得
- 存在しないキーの `get` は **`null`**。`getOrDefault` でデフォルト値を返せる
- **`containsKey`** でキーの有無を判定できる
- 同じキーへの `put` は**上書き**（1キーにつき値は1つ）。`Map.of(...)` は変更不可

次の節では、List・Set・Map に共通する、**繰り返し処理**を学びます。

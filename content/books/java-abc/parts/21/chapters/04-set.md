---
title: Set ― 重複のない集まり
llm: true
co-author: ["Claude Opus 4.7"]
---

## Set ― 重複のない集まり

**Set**（セット、集合）は、「**重複のない、データの集まり**」を表すコレクションです。
同じ値を入れても、自動的に1つにまとめられます。
この節では、Set の特徴と使い方を学びます。

---

## Set の特徴

Set には、次の特徴があります。

- **重複を許さない** … 同じ値を入れても、1つしか保持しない（自動で重複が消える）
- **順序は、基本的に保証されない** … 入れた順番どおりに並ぶとは限らない（実装による）

「出席者の名簿」「すでに見たページの記録」「タグの一覧」のように、**「いる／いない」だけを管理し、重複に意味がない**データに向いています。

List が「順番に並べる（重複OK）」だったのに対し、Set は「**重複をなくす（順番は気にしない）**」コレクションです。

---

## Set を作る ― HashSet

Set の基本的な実装は、**`HashSet`**（ハッシュセット）です。
List と同じく、左辺はインターフェース `Set`、右辺は実装 `HashSet` にします。

```java
Set<String> tags = new HashSet<>();
tags.add("Java");
tags.add("プログラミング");
tags.add("Java");        // 同じ「Java」をもう一度
IO.println(tags.size());
```

```text
2
```

`add("Java")` を2回呼びましたが、`size()` は **`2`** です。
2回目の「Java」は、すでにあるので**追加されず、無視**されました。
これが Set の最大の特徴 ―― 「**重複は、自動的に取り除かれる**」です。

`add` の戻り値（`boolean`）で、「実際に追加されたか」も分かります。

```java
Set<String> tags = new HashSet<>();
IO.println(tags.add("Java"));    // 新しく追加された
IO.println(tags.add("Java"));    // すでにあるので追加されなかった
```

```text
true
false
```

---

## 含まれているかを調べる ― contains

Set は「いる／いない」を管理するのが得意です。
**`contains(値)`** で、ある値が含まれているかを、すばやく調べられます。

```java
Set<String> visited = new HashSet<>();
visited.add("page1");
visited.add("page2");

IO.println(visited.contains("page1"));   // 訪問済みか
IO.println(visited.contains("page3"));
```

```text
true
false
```

「すでに処理したか」「もう登場したか」を記録しておき、`contains` で確認する ―― これは、Set のとても典型的な使い方です。

---

## List から重複を取り除く

Set の「重複が消える」性質は、**リストから重複を取り除く**のに使えます。
List を、いったん Set に入れ直すだけです。

```java
List<String> withDup = List.of("赤", "緑", "赤", "青", "緑");
Set<String> unique = new HashSet<>(withDup);   // Set に入れ直す
IO.println(unique.size());
```

```text
3
```

`赤`・`緑` が重複していた5要素のリストが、Set に入れると、重複が消えて **3種類**になりました。
`new HashSet<>(リスト)` のように、コレクションを渡して作ると、その中身をまとめて取り込めます。

---

## 順番を保ちたいなら ― LinkedHashSet / TreeSet

`HashSet` は速い反面、**並び順が保証されません**。「入れた順」や「五十音順」で並べたいときは、別の実装を使います。

| 実装 | 並び順 |
|---|---|
| `HashSet` | 保証されない（速い） |
| `LinkedHashSet` | **入れた順**を保つ |
| `TreeSet` | **自動的に並べ替える**（昇順など） |

たとえば、数を入れて、自動で小さい順に並べたいなら、`TreeSet` を使います。

```java
Set<Integer> sorted = new TreeSet<>(List.of(3, 1, 2, 1));
IO.println(sorted);
```

```text
[1, 2, 3]
```

`3, 1, 2, 1` を入れたのに、重複（`1`）が消え、しかも **`[1, 2, 3]` と小さい順**に並びました。
「重複をなくしつつ、並べ替えたい」ときは、`TreeSet` が便利です。

> **補足: 「並び順」が必要かどうかで選ぶ**
>
> - 並び順は気にしない（速さ優先） → **`HashSet`**
> - 入れた順を保ちたい → **`LinkedHashSet`**
> - 自動で並べ替えたい → **`TreeSet`**
>
> まずは基本の `HashSet` を覚え、「順番が必要だ」と気づいたときに、ほかの実装を思い出せれば十分です。

---

## まとめ

- **Set** は、**重複のない**データの集まり。同じ値を入れても1つにまとまる
- 基本の実装は **`HashSet`**（`Set<型> x = new HashSet<>();`）
- **重複は自動で取り除かれる**（`add` の戻り値で、追加されたか分かる）
- **`contains`** で「いる／いない」をすばやく判定できる
- `new HashSet<>(リスト)` で、**リストから重複を取り除ける**
- 並び順がほしいときは `LinkedHashSet`（入れた順）や `TreeSet`（並べ替え）を使う

次の節では、**キーと値を対応づける**コレクション ―― **Map** を学びます。

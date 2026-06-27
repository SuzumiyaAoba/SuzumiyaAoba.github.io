---
title: よくあるつまずき
llm: true
co-author: ["Claude Opus 4.7"]
---

## よくあるつまずき

コレクションで、初心者がつまずきやすいポイントを、まとめて確認します。

---

## 1. 型引数に基本型を使おうとする

第19章でも学んだとおり、型引数（`< >` の中）には、**参照型しか使えません**。

```java
List<int> nums = new ArrayList<>();   // ✕ 基本型は使えない
```

`int` のかわりに、ラッパークラスの **`Integer`** を使います（`double` なら `Double`、`boolean` なら `Boolean`）。

```java
List<Integer> nums = new ArrayList<>();   // ◯ Integer を使う
nums.add(123);                            // int の 123 を入れられる（自動変換）
int n = nums.get(0);                      // int として取り出せる
```

`Integer` を指定しておけば、`int` の値をほぼそのままの感覚で出し入れできます（オートボクシング、第19章）。

---

## 2. List.of / Map.of は「変更できない」

`List.of(...)` や `Map.of(...)` で作ったコレクションは、**変更できません**（読み取り専用）。
これに `add` や `put` をすると、実行時にエラーになります。

```java
List<String> colors = List.of("赤", "緑", "青");
colors.add("黄");   // ✕ 変更不可
```

```text
Exception in thread "main" java.lang.UnsupportedOperationException
```

「あとから変更する」なら、`new ArrayList<>()` で作ります。
変更したい中身を `of` で用意したい場合は、いったん可変リストに移し替えます。

```java
List<String> colors = new ArrayList<>(List.of("赤", "緑", "青"));   // 可変にする
colors.add("黄");   // ◯ これならOK
```

「**`of` は決まった一覧（読み取り専用）／`new ArrayList<>()` は変更できる**」と覚えておきましょう。

---

## 3. 存在しないキーの get は null

Map で、登録していないキーを `get` すると、**`null`** が返ります。
これをうっかりそのまま使うと、`NullPointerException`（第11章）になります。

```java
Map<String, Integer> scores = new HashMap<>();
scores.put("佐藤", 80);

int n = scores.get("田中");   // 田中 は未登録 → null
                              // int に null を入れようとして NullPointerException
```

「キーがあるか分からない」ときは、`getOrDefault` を使うか、`containsKey` で先に確認します。

```java
int n = scores.getOrDefault("田中", 0);   // なければ 0
```

---

## 4. HashSet・HashMap の順番をあてにする

`HashSet`・`HashMap` は、**並び順を保証しません**。
「入れた順に出てくるはず」と思って書くと、思わぬ順番になり、バグの原因になります。

```java
Map<String, Integer> scores = new HashMap<>();
scores.put("佐藤", 80);
scores.put("鈴木", 95);
// for-each で回しても、佐藤 → 鈴木 の順とは限らない
```

順番が大切なら、目的に合った実装を選びます。

| ほしい順番 | List | Set | Map |
|---|---|---|---|
| 入れた順 | `ArrayList` | `LinkedHashSet` | `LinkedHashMap` |
| 並べ替え | （`sort` で） | `TreeSet` | `TreeMap` |

「`Hash〜` は順番を気にしない用、順番が要るなら `Linked〜`・`Tree〜`」と覚えておきましょう。

---

## 5. 繰り返し中に、要素を追加・削除する

for-each でコレクションを回している**最中に**、そのコレクションへ `add` や `remove` をすると、エラーになります。

```java
List<String> names = new ArrayList<>(List.of("佐藤", "鈴木", "高橋"));
for (String name : names) {
    if (name.equals("佐藤")) {
        names.remove(name);   // ✕ 回している最中に削除
    }
}
```

```text
Exception in thread "main" java.util.ConcurrentModificationException
```

`ConcurrentModificationException`（同時変更例外）は、「回している最中に、中身を変えた」ときに起きます。
削除したいときは、**`removeIf`** を使うのが簡単で安全です。

```java
List<String> names = new ArrayList<>(List.of("佐藤", "鈴木", "高橋"));
names.removeIf(name -> name.equals("佐藤"));   // 条件に合うものを削除
IO.println(names);
```

```text
[鈴木, 高橋]
```

`removeIf(...)` の `->` は、第22章で学ぶ**ラムダ式**です。いまは「条件に合う要素を、まとめて安全に削除できる」と知っておけば十分です。

---

## まとめ

- 型引数に基本型は使えない。`int` → **`Integer`** などラッパークラスを使う
- **`List.of` / `Map.of` は変更不可**。変更するなら `new ArrayList<>()` / `new HashMap<>()`
- 存在しないキーの `get` は **`null`**。`getOrDefault` や `containsKey` で備える
- **`Hash〜` は順番を保証しない**。順番が要るなら `Linked〜`・`Tree〜`
- 繰り返し中の追加・削除は **`ConcurrentModificationException`**。削除は **`removeIf`** で

次は、この章で学んだ言葉を、用語集としてまとめます。

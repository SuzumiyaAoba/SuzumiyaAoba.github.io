---
title: 終端操作 ― 結果を得る
llm: true
co-author: ["Claude Opus 4.7"]
---

## 終端操作 ― 結果を得る

**終端操作**は、ストリーム処理の最後に1回だけ呼ぶ工程です。
ここで、流れてきたデータを「**最終結果**」（リスト・数値・真偽など）として受け取ります。
終端操作を呼んで、初めてストリーム全体が実行される、という点も大切でした（第1節）。

---

## リストにまとめる ― toList

もっともよく使う終端操作が、**`toList()`** です。
処理結果を、新しい List として受け取ります。

```java
List<Integer> nums = List.of(1, 2, 3, 4, 5, 6);

List<Integer> evens = nums.stream()
    .filter(n -> n % 2 == 0)
    .toList();

IO.println(evens);
```

```text
[2, 4, 6]
```

中間操作で加工した結果を、最後に `toList()` で「集めて、リストにする」わけです。
ストリーム処理の締めくくりとして、もっとも頻繁に登場します。

---

## 各要素に処理する ― forEach

**`forEach`** は、流れてくる要素1つずつに、処理を行う終端操作です（第22章の `Consumer`、戻り値なし）。

```java
List<String> names = List.of("佐藤", "鈴木", "高橋");

names.stream()
    .forEach(name -> IO.println(name));   // 各要素を表示
```

```text
佐藤
鈴木
高橋
```

「表示する」「保存する」のように、**結果を集めるのではなく、1つずつ何かしたい**ときに使います。
（なお、ただ全要素を処理するだけなら、第8章で学んだ for-each 文（`for (String name : names)`）でも同じことができます。ストリームの中間操作と組み合わせるときに、`forEach` が活きてきます。）

---

## 個数を数える ― count

**`count()`** は、流れてきた要素の**個数**を返します（結果は `long` 型）。

```java
List<Integer> nums = List.of(1, 2, 3, 4, 5, 6);

long c = nums.stream()
    .filter(n -> n > 3)    // 3より大きいものに絞って
    .count();              // その個数を数える

IO.println(c);
```

```text
3
```

`filter` で絞り込んだあとに `count` すると、「条件に合う要素が何個あるか」を、すっきり数えられます。

---

## 合計・平均を求める ― sum / average

数値の**合計**や**平均**を求めるには、まず **`mapToInt`** で `int` のストリーム（`IntStream`）に変換し、**`sum()`**・**`average()`** を呼びます。

```java
List<Integer> nums = List.of(1, 2, 3, 4, 5, 6);

int total = nums.stream()
    .mapToInt(Integer::intValue)   // IntStream に変換
    .sum();                        // 合計

IO.println(total);
```

```text
21
```

```java
double avg = nums.stream()
    .mapToInt(Integer::intValue)
    .average()                     // 平均
    .orElse(0);                    // 空のときは 0

IO.println(avg);
```

```text
3.5
```

- `sum()` … 合計（`int`）を返す
- `average()` … 平均を返す（ただし「要素が0個」のこともあるので、第24章で学ぶ `Optional` の数値版 `OptionalDouble` で返ります。`orElse(0)` で「空なら0」とします）

「点数の合計」「平均年齢」のような集計が、ループなしで書けます。
（`max()`・`min()` で、最大値・最小値も求められます。）

---

## 条件を満たすか調べる ― anyMatch / allMatch

「条件を満たす要素があるか／すべてが満たすか」を調べる終端操作もあります。結果は `boolean` です。

```java
List<Integer> nums = List.of(1, 2, 3, 4, 5, 6);

IO.println(nums.stream().anyMatch(n -> n > 5));    // 1つでも 5より大きい？
IO.println(nums.stream().allMatch(n -> n > 0));    // すべて 0より大きい？
IO.println(nums.stream().noneMatch(n -> n > 10));  // 10より大きいものは皆無？
```

```text
true
true
true
```

- `anyMatch` … **1つでも**条件を満たせば `true`
- `allMatch` … **すべて**が条件を満たせば `true`
- `noneMatch` … **1つも**満たさなければ `true`

「合格者がいるか」「全員が成人か」のような判定に使います。

---

## 終端操作のまとめ

| 終端操作 | 役割 | 戻り値 |
|---|---|---|
| `toList()` | リストにまとめる | `List` |
| `forEach(...)` | 各要素に処理する | なし |
| `count()` | 個数を数える | `long` |
| `sum()` / `average()` | 合計 / 平均（`IntStream` で） | `int` / `OptionalDouble` |
| `max()` / `min()` | 最大 / 最小 | `Optional` |
| `anyMatch` / `allMatch` / `noneMatch` | 条件判定 | `boolean` |

**1つのストリームに、終端操作は1回だけ**です。終端操作を呼ぶと、そのストリームは「使い終わり」になります（第7節のつまずきで改めて触れます）。

---

## まとめ

- **終端操作**は、ストリームの最後に1回呼び、最終結果を取り出す
- **`toList()`** … 結果をリストにする（もっともよく使う）
- **`forEach(...)`** … 各要素に処理する（表示・保存など）
- **`count()`** … 個数を数える
- **`sum()` / `average()`** … `mapToInt` で `IntStream` にしてから、合計・平均
- **`anyMatch` / `allMatch` / `noneMatch`** … 条件を満たすかを判定する

次の節では、より高度に「集約する」 ―― `Collectors` とグループ化を学びます。

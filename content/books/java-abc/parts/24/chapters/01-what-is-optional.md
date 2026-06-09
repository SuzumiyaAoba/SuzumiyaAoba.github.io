---
title: Optional とは ― 値の有無を表す箱
llm: true
---

## Optional とは ― 値の有無を表す箱

**`Optional`**（オプショナル）は、「**値があるかもしれないし、ないかもしれない**」を表す箱です。
この節では、`null` の問題をふり返り、`Optional` がそれをどう解決するのかを学びます。

---

## null の何が問題なのか

`null`（第11章）は、「何も指していない」状態を表す、便利なしくみでした。
ですが、`null` には、大きな落とし穴があります。

```java
Map<String, Integer> scores = new HashMap<>();
scores.put("佐藤", 80);

Integer score = scores.get("田中");   // 田中はいない
IO.println(score.intValue());         // null に対してメソッド → NullPointerException
```

問題は、**型を見ても「`null` かもしれない」と分からない**ことです。
`scores.get(...)` の戻り値の型は `Integer` です。この型からは、「値が返る」としか読み取れません。
「実は `null` のこともある」という事実は、**型に表れていない**のです。

そのため、`null` チェックをうっかり忘れ、`NullPointerException` で初めて気づく ―― という事故が、後を絶ちません。
`null` は「**いつ来るか分からない、隠れた地雷**」のようなものなのです。

---

## Optional ―「ないかもしれない」を型で表す

そこで `Optional` の出番です。
「値がないかもしれない」とき、`null` を返すかわりに、**`Optional` という箱に入れて**返します。

```text
値がある場合:  Optional[80]   ← 箱の中に 80 が入っている
値がない場合:  Optional.empty  ← 箱は空っぽ
```

`Optional<Integer>` という型を見れば、「**この値は、空っぽのこともある**」と、**型からはっきり分かります**。
受け取った人は、「中身を使う前に、空かどうか確かめなきゃ」と、自然に意識できます。

`null` が「隠れた地雷」だったのに対し、`Optional` は「**ここは注意が必要ですよ**」と、**目に見える形で教えてくれる**のです。
これが、`Optional` の最大の価値です。

---

## 中身があるか確かめる ― isPresent / isEmpty

`Optional` の箱に、中身があるかどうかは、**`isPresent()`**（あるか）・**`isEmpty()`**（空か）で調べられます。

```java
Optional<String> present = Optional.of("こんにちは");   // 中身あり
Optional<String> empty = Optional.empty();             // 空っぽ

IO.println(present.isPresent());   // 中身があるか
IO.println(empty.isPresent());
IO.println(empty.isEmpty());       // 空か
```

```text
true
false
true
```

- `present` … 「こんにちは」が入った箱 → `isPresent()` は `true`
- `empty` … 空っぽの箱 → `isPresent()` は `false`、`isEmpty()` は `true`

（`Optional.of(...)`・`Optional.empty()` の作り方は、次の節でくわしく学びます。）

---

## ストリームでも Optional が返っていた

第23章で、`max()` や `average()` の結果が `Optional` だったのを思い出してください。
これは、「**要素が0個のときは、最大値が存在しない**」からです。

```java
List<Integer> nums = List.of(3, 1, 4, 1, 5);
Optional<Integer> max = nums.stream().max(Comparator.naturalOrder());
IO.println(max.isPresent());
```

```text
true
```

もし `nums` が空のリストだったら、「最大値」は存在しません。
そのとき `max()` は、`null` を返すのではなく、**空の `Optional`** を返します。
「結果がないかもしれない」ことを、`Optional` という型で、はっきり示しているのです。

---

## Optional は「箱」だと考える

`Optional` を理解するコツは、「**中身が入っているかもしれない、小さな箱**」とイメージすることです。

- 値がある → 箱の中に、その値が1つ入っている
- 値がない → 箱は空っぽ

そして、これから学ぶ `Optional` のメソッドは、すべて「**この箱を、どう安全に開けるか／開けずに扱うか**」のためのものです。
「いきなり中身を取り出す」のではなく、「空かもしれない箱として、ていねいに扱う」 ―― これが、`Optional` とのつきあい方です。

---

## まとめ

- **`Optional`** は、「**値があるかもしれないし、ないかもしれない**」を表す箱
- `null` は「型に表れない隠れた地雷」で、`NullPointerException` の原因になりやすい
- `Optional<T>` という型は、「**値が空のこともある**」ことを、型ではっきり示す
- 中身の有無は、**`isPresent()`**（あるか）・**`isEmpty()`**（空か）で調べられる
- ストリームの `max`・`average` などが `Optional` を返すのは「結果がないかも」だから

次の節では、`Optional` を**作る**方法（`of`・`ofNullable`・`empty`）を学びます。

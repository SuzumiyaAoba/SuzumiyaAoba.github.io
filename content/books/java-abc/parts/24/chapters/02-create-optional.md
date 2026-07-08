---
title: Optional を作る
llm: true
co-author: ["Claude Opus 4.7"]
---

## Optional を作る

`Optional` の箱を作る方法は、3つあります。
「中身が必ずある」「中身が `null` かもしれない」「空っぽ」の、それぞれに対応します。
この節で、その使い分けを学びます。

---

## Optional.of ― 中身が必ずあるとき

**`Optional.of(値)`** は、「**必ず中身がある**」箱を作ります。

```java
Optional<String> name = Optional.of("佐藤");
IO.println(name.isPresent());
```

```text line-numbers=false
true
```

`Optional.of("佐藤")` で、「佐藤」が入った箱ができました。
ただし、`Optional.of(...)` に **`null` を渡してはいけません**。`null` を渡すと、その場で `NullPointerException` になります。

```java
Optional<String> bad = Optional.of(null);   // ✕ NullPointerException
```

「絶対に `null` ではない」と分かっている値にだけ、`Optional.of` を使います。

---

## Optional.ofNullable ― null かもしれないとき

「値が `null` かもしれない」ときは、**`Optional.ofNullable(値)`** を使います。
渡した値が `null` なら**空の箱**に、`null` でなければ**中身入りの箱**にしてくれます。

```java
String maybeNull = null;
Optional<String> opt = Optional.ofNullable(maybeNull);
IO.println(opt.isEmpty());
```

```text line-numbers=false
true
```

`null` を渡しても、`Optional.ofNullable` はエラーにならず、空の `Optional` にしてくれました。
**`null` を返すかもしれない、古いメソッドの結果を受け取る**ときに、とても役立ちます。

```java
Map<String, Integer> scores = new HashMap<>();
scores.put("佐藤", 80);

// get の結果（null かもしれない）を、Optional に包む
Optional<Integer> score = Optional.ofNullable(scores.get("田中"));
IO.println(score.isEmpty());
```

```text line-numbers=false
true
```

`scores.get("田中")` は `null`（田中はいない）ですが、`ofNullable` で包むことで、空の `Optional` として、安全に扱えるようになりました。

---

## Optional.empty ― 最初から空

「中身がない」ことが分かっているなら、**`Optional.empty()`** で、空の箱を作れます。

```java
Optional<String> empty = Optional.empty();
IO.println(empty.isEmpty());
```

```text line-numbers=false
true
```

たとえば、「探したけれど見つからなかった」ときに、`Optional.empty()` を返す、といった使い方をします。

---

## 3つの作り方の使い分け

| 作り方 | いつ使う | null を渡すと |
|---|---|---|
| `Optional.of(値)` | 値が**必ずある**とき | `NullPointerException` |
| `Optional.ofNullable(値)` | 値が **`null` かもしれない**とき | 空の Optional になる |
| `Optional.empty()` | **空**だと分かっているとき | （値を渡さない） |

迷ったときの目安は、こうです。

- 自分で「これは絶対 `null` じゃない」と確信できる → `of`
- 外から来た値や、`null` を返すメソッドの結果を包む → `ofNullable`
- 「見つからなかった」など、空を表したい → `empty`

実際には、**`ofNullable`** を使う場面が、いちばん多いでしょう。

---

## メソッドの戻り値として Optional を返す

`Optional` の、もっとも大切な使い道は、**メソッドの戻り値**です。
「見つかるかもしれないし、見つからないかもしれない」メソッドは、`null` を返すのではなく、`Optional` を返すようにします。

```java
// 名前から年齢を探す（見つからないかもしれない）
Optional<Integer> findAge(String name) {
    Map<String, Integer> ages = Map.of("佐藤", 25, "鈴木", 30);
    return Optional.ofNullable(ages.get(name));   // null かもしれない結果を包む
}

IO.println(findAge("佐藤").isPresent());   // 見つかる
IO.println(findAge("田中").isPresent());   // 見つからない
```

```text line-numbers=false
true
false
```

戻り値の型が `Optional<Integer>` なので、このメソッドを使う人は、「**見つからないこともある**」と、すぐに分かります。
`null` を返していたら気づけなかった「値がない可能性」を、型で伝えられるのです。
これが、`Optional` の本領です。

---

## まとめ

- **`Optional.of(値)`** … 中身が必ずあるとき（`null` を渡すとエラー）
- **`Optional.ofNullable(値)`** … `null` かもしれないとき（`null` なら空の箱に）
- **`Optional.empty()`** … 最初から空の箱
- 外から来た値・`null` を返すメソッドの結果は、**`ofNullable`** で包むのが定番
- `Optional` のいちばんの使い道は、**メソッドの戻り値**（`null` のかわりに返す）

次の節では、`Optional` から**安全に値を取り出す**方法を学びます。

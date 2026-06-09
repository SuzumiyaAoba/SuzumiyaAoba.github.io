---
title: 値を取り出す ― orElse・ifPresent
llm: true
---

## 値を取り出す ― orElse・ifPresent

`Optional` の箱から、中身をどう取り出すか ―― ここが、`Optional` の使い方のかなめです。
大切なのは、「**空かもしれない**ことを考えながら、安全に取り出す」ことです。
この節では、その安全な方法を学びます。

---

## いちばん避けたい ― get()

`Optional` には、中身をそのまま取り出す **`get()`** があります。
ですが、これは**もっとも避けるべき**方法です。

```java
Optional<String> empty = Optional.empty();
IO.println(empty.get());   // ✕ 空の箱から取り出そうとする
```

```text
Exception in thread "main" java.util.NoSuchElementException: No value present
```

空の `Optional` に `get()` すると、`NoSuchElementException`（要素がない例外）になります。
これでは、`null` をうっかり使って `NullPointerException` になるのと、**何も変わりません**。
せっかく `Optional` を使う意味が、なくなってしまいます。

`get()` を使うなら、必ず `isPresent()` で確認してから ―― ですが、それよりもっとよい方法があります。それが、これから学ぶ `orElse` や `ifPresent` です。
**基本的に `get()` は使わない**、と覚えておきましょう。

---

## orElse ― 空ならデフォルト値

**`orElse(デフォルト値)`** は、「中身があればそれを、なければデフォルト値を」返します。
空かどうかを自分で確認しなくても、安全に値を得られます。

```java
Optional<String> present = Optional.of("佐藤");
Optional<String> empty = Optional.empty();

IO.println(present.orElse("名無し"));   // 中身がある → 佐藤
IO.println(empty.orElse("名無し"));     // 空 → デフォルトの 名無し
```

```text
佐藤
名無し
```

`empty.orElse("名無し")` は、箱が空なので、デフォルトの「名無し」を返しました。
「値がなければ、これを使う」という処理が、1行で安全に書けます。
第21章の Map の `getOrDefault` と、よく似た発想ですね。

---

## orElseGet ― 空のときだけ計算する

`orElse` は、いつも便利ですが、「デフォルト値を作るのに、手間のかかる処理」のときは、注意が必要です。
`orElse(...)` は、**中身があってもなくても、デフォルト値を必ず用意**してしまうからです。

そんなときは、**`orElseGet(() -> ...)`** を使います。
これは、「**空のときだけ**、デフォルト値を計算する」ものです。

```java
Optional<String> present = Optional.of("佐藤");

// 空のときだけ、ラムダ式が実行される
String name = present.orElseGet(() -> {
    IO.println("デフォルトを計算中…");   // present は中身があるので、これは呼ばれない
    return "名無し";
});
IO.println(name);
```

```text
佐藤
```

`present` には中身があるので、`orElseGet` のラムダ式は**実行されません**（「デフォルトを計算中…」は表示されない）。
デフォルト値を作るのに重い処理が必要なときは、`orElse` より `orElseGet` が効率的です。
（引数に第22章の `Supplier` を取ります。）

---

## ifPresent ― 中身があるときだけ処理する

「**中身があるときだけ、何かしたい**」ときは、**`ifPresent(値 -> ...)`** を使います。

```java
Optional<String> present = Optional.of("佐藤");
Optional<String> empty = Optional.empty();

present.ifPresent(name -> IO.println("こんにちは、" + name + "さん"));
empty.ifPresent(name -> IO.println("これは表示されない"));
```

```text
こんにちは、佐藤さん
```

`present` は中身があるので、ラムダ式が実行され、「こんにちは、佐藤さん」が表示されました。
`empty` は空なので、ラムダ式は**実行されません**（何も表示されない）。

`if (opt.isPresent()) { ... opt.get() ... }` と書くかわりに、`ifPresent` を使えば、空のチェックと値の取り出しを、安全に1つにまとめられます。
（引数に第22章の `Consumer` を取ります。）

---

## orElseThrow ― 空なら例外にする

「空のときは、エラーとして処理を止めたい」ときは、**`orElseThrow()`** を使います。
中身があればそれを返し、空なら例外（第20章）を投げます。

```java
Optional<String> name = findName(id);
String result = name.orElseThrow();   // 空なら例外
```

「ここに値がないのは、ありえない（あったら異常事態）」という場面で使います。
`get()` と動きは似ていますが、「**空なら例外を投げる**」という意図が、名前から明確に伝わります。

---

## 取り出し方の使い分け

| メソッド | 動き | いつ使う |
|---|---|---|
| `orElse(値)` | 空ならデフォルト値 | 「なければ、この値」 |
| `orElseGet(() -> 値)` | 空のときだけ値を計算 | デフォルト計算が重いとき |
| `ifPresent(値 -> 処理)` | 中身があるときだけ処理 | 「あれば、これをする」 |
| `orElseThrow()` | 空なら例外 | 「ないのは異常」なとき |
| `get()` | そのまま取り出す | **基本、使わない**（空だと例外） |

**`get()` を避け、`orElse`・`ifPresent`・`orElseThrow` を使う** ―― これが、`Optional` を安全に使うコツです。

---

## まとめ

- **`get()` は基本使わない**（空だと `NoSuchElementException`。`null` 事故と変わらない）
- **`orElse(値)`** … 空ならデフォルト値を返す
- **`orElseGet(() -> 値)`** … 空のときだけデフォルト値を計算する（重い処理向き）
- **`ifPresent(値 -> 処理)`** … 中身があるときだけ処理する
- **`orElseThrow()`** … 空なら例外を投げる（「ないのは異常」なとき）

次の節では、Optional を箱に入れたまま変換・絞り込みする `map`・`filter` を学びます。

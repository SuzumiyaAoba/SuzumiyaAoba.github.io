---
title: よくあるつまずき
llm: true
---

## よくあるつまずき

`Optional` で、初心者がつまずきやすいポイントを、まとめて確認します。

---

## 1. すぐに get() してしまう

もっともよくある誤りが、`Optional` を受け取って、すぐに **`get()`** することです。

```java
Optional<String> name = findName(id);
String result = name.get();   // ✕ 空だったら NoSuchElementException
```

これでは、`Optional` を使う意味がありません。空のときに `NoSuchElementException` になり、`null` 事故と同じことが起きます。

`get()` ではなく、**`orElse`・`ifPresent`・`orElseThrow`** を使いましょう。

```java
String result = name.orElse("名無し");        // 空ならデフォルト
name.ifPresent(n -> IO.println(n));            // あるときだけ処理
String r = name.orElseThrow();                 // 空なら例外（意図が明確）
```

「`Optional` を見たら、`get()` ではなく `orElse` か `ifPresent`」を、口ぐせにしましょう。

---

## 2. isPresent() + get() で書く

`get()` を避けようとして、`isPresent()` で確認してから `get()` する、という書き方も、よく見かけます。

```java
if (name.isPresent()) {
    IO.println(name.get());   // △ 動くが、Optional らしくない
}
```

これは動きますが、結局 `if` と `get` を書いており、`Optional` のうまみが活きていません。
同じことは、**`ifPresent`** で、もっとすっきり書けます。

```java
name.ifPresent(n -> IO.println(n));   // ◯ 確認と取り出しが1つに
```

「`isPresent()` + `get()` を書きそうになったら、`ifPresent` や `map`・`orElse` で書けないか」を考えましょう。

---

## 3. Optional に null を入れる

`Optional` 自体を `null` にしたり、`Optional.of(null)` としたりするのは、本末転倒です。

```java
Optional<String> opt = null;            // ✕ Optional 変数が null（最悪）
Optional<String> bad = Optional.of(null); // ✕ NullPointerException
```

`Optional` は「`null` をなくす」ための道具なのに、その `Optional` が `null` では、意味がありません。
**「空」を表したいなら、`null` ではなく `Optional.empty()`** を使います。
`null` かもしれない値を包むなら、`Optional.ofNullable(値)` です。

---

## 4. フィールドや引数に Optional を使う

`Optional` は、主に**メソッドの戻り値**のために設計されています。
**フィールド**（クラスの状態）や、**メソッドの引数**に `Optional` を使うのは、一般的に推奨されません。

```java
class Person {
    private Optional<String> nickname;   // △ フィールドに Optional は避ける
}
```

フィールドに使うと、かえって扱いが複雑になります。
「ニックネームがないかも」を表したいなら、フィールドはふつうに持ち、**取り出すメソッドの戻り値**を `Optional` にするほうが自然です。

```java
class Person {
    private String nickname;   // null かもしれない
    public Optional<String> getNickname() {
        return Optional.ofNullable(nickname);   // 戻り値で Optional にする
    }
}
```

「`Optional` は、戻り値で使うもの」と覚えておきましょう。

---

## 5. 何でも Optional でラップする

「`null` が怖いから」と、何でもかんでも `Optional` で包むのも、考えものです。
「値が必ずある」とはっきりしているものまで `Optional` にすると、コードが無駄に複雑になります。

`Optional` を使うのは、「**値が、本当にないことがある**」場面 ―― 検索結果、見つからないかもしれない値、空かもしれない集計結果など ―― に絞りましょう。
「必ずある」ものは、そのままの型で扱えば十分です。

---

## まとめ

- **すぐ `get()` しない**。`orElse`・`ifPresent`・`orElseThrow` を使う
- `isPresent()` + `get()` より、**`ifPresent` や `map`** で書く
- 「空」は `null` ではなく **`Optional.empty()`**。`Optional` 変数を `null` にしない
- `Optional` は、主に**戻り値**で使う（フィールド・引数には使わない）
- 「本当に値がないことがある」場面に絞って使う（何でも包まない）

次は、この章で学んだ言葉を、用語集としてまとめます。

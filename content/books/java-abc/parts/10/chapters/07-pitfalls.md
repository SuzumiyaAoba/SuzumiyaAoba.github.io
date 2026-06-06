---
title: よくあるつまずき
llm: true
---

## よくあるつまずき

文字列でつまずきやすいポイントを、まとめて確認します。

---

## 1. 文字列の比較に == を使ってしまう

これまでで何度も触れた、最も多い失敗です。

```java
String input = new String("yes");
if (input == "yes") {          // × == で比べている
    IO.println("はい");
}
```

このコードは、`input` の中身が `"yes"` でも、`==` が `false` になり、「はい」が表示されないことがあります。
**文字列の比較は、必ず `equals` を使いましょう。**

```java
if (input.equals("yes")) {     // ◯ equals で中身を比べる
    IO.println("はい");
}
```

> リテラルで試すと `==` でも動いてしまうため、気づきにくいバグです。「文字列は equals」と体に覚えさせましょう（第6節）。

---

## 2. 加工した結果を受け取り忘れる

文字列は**不変**なので、加工メソッドは元を変えず、新しい文字列を返します。
結果を受け取らないと、何も変わりません。

```java
String s = "hello";
s.toUpperCase();          // × 結果を捨てている
IO.println(s);            // → hello（変わっていない！）
```

加工の結果を使いたいなら、戻り値を**受け取り直す**必要があります。

```java
s = s.toUpperCase();      // ◯ 結果を s に入れ直す
IO.println(s);            // → HELLO
```

`replace`・`strip`・`substring` など、すべての加工メソッドで同じ注意が必要です。

---

## 3. インデックスの範囲を超える

`charAt` や `substring` で、存在しない位置を指定すると、実行時にエラーになります。

```java
String s = "abc";       // インデックスは 0・1・2 だけ
IO.println(s.charAt(5));
```

```text
例外java.lang.StringIndexOutOfBoundsException: Index 5 out of bounds for length 3
```

`StringIndexOutOfBoundsException` は、第8章の配列の `ArrayIndexOutOfBoundsException` の、文字列版です。
インデックスは `0` から「長さ − 1」まで、と意識しましょう。

---

## 4. indexOf の結果（-1）を確かめずに使う

`indexOf` は、見つからないと `-1` を返します（第3節）。
これを確かめずに使うと、思わぬ動きになります。

```java
String s = "Hello";
int pos = s.indexOf("z");   // 見つからない → pos は -1
// pos を位置として substring などに使うと、エラーや想定外の結果に
```

`indexOf` の結果を位置として使う前に、「`-1` ではないか（＝見つかったか）」を確認しましょう。

```java
if (pos != -1) {
    // 見つかったときだけ、pos を使う
}
```

---

## 5. null の文字列を操作する

文字列の変数が `null`（何も指していない状態）のときに、メソッドを呼ぶとエラーになります。

```java
String s = null;
IO.println(s.length());    // → NullPointerException
```

`null` に対してメソッドを呼ぶと、`NullPointerException`（ヌルポインタ例外）という、Java で最も有名なエラーが起きます。
`null` のくわしい扱いは第11章以降や第24章（Optional）で学びますが、「**文字列が `null` かもしれないときは、メソッドを呼ぶ前に確認が必要**」とだけ覚えておきましょう。

---

## まとめ

- 文字列の比較は **`equals`**（`==` は使わない）
- 加工メソッドの結果は **`s = s.xxx()` で受け取り直す**（不変だから）
- `charAt`・`substring` の**インデックス範囲**に注意（`StringIndexOutOfBoundsException`）
- `indexOf` の結果は、**`-1`（見つからない）かどうか**を確かめてから使う
- `null` の文字列にメソッドを呼ぶと **`NullPointerException`**

次は、この章で学んだ言葉を、用語集としてまとめます。

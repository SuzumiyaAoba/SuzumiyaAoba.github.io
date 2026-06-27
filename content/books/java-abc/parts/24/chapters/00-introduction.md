---
title: はじめに ― この章で学ぶこと
llm: true
co-author: ["Claude Opus 4.7"]
---

## はじめに ― この章で学ぶこと

第23章のストリームで、`average()` や `max()`、`findFirst()` の結果が、`int` や要素そのものではなく、**`Optional`** という型で返ってきました。
この章では、その `Optional`（オプショナル）を、じっくり学びます。

`Optional` は、ひとことで言えば、

> **「値があるかもしれないし、ないかもしれない」を、安全に表す箱**

です。

この章のテーマは、本書で何度も登場してきた、あの厄介者 ―― **`null`** との戦いです。
第11章で学んだ `NullPointerException` を覚えているでしょうか。`null` に対してメソッドを呼ぼうとして起きる、Java でもっとも有名なエラーです。
`Optional` は、この `null` による事故を、**根本から減らす**ための道具です。

---

## なぜ Optional が必要なのか ― null の問題

「値がないかもしれない」を、これまでは `null` で表していました。
たとえば、第21章の Map で、存在しないキーを `get` すると `null` が返りました。

```java
Map<String, Integer> scores = new HashMap<>();
scores.put("佐藤", 80);

Integer score = scores.get("田中");   // 田中はいない → null
IO.println(score + 10);               // null に + 10 → NullPointerException!
```

`null` の問題は、「**`null` かもしれない、と気づきにくい**」ことです。
`scores.get("田中")` の戻り値が `null` になりうるなんて、型（`Integer`）を見ても分かりません。
うっかり `null` のまま使ってしまい、`NullPointerException` で初めて気づく ―― これが、`null` による事故の典型です。

`Optional` を使うと、戻り値の型が `Optional<Integer>` になります。
これを見た人は、「**ああ、値がないこともあるんだな**」と、すぐに気づけます。
そして、`Optional` は「中身を取り出す前に、値の有無を考える」ことを、自然とうながしてくれるのです。

---

## この章で学ぶこと

第24章は、次の6つの節で構成されています。

| 節 | タイトル | 内容 |
|---|---|---|
| 1 | Optional とは | null の問題と、Optional の考え方 |
| 2 | Optional を作る | `of`・`ofNullable`・`empty` |
| 3 | 値を取り出す | `orElse`・`ifPresent`（`get` は避ける） |
| 4 | map と filter | Optional のまま、変換・絞り込み |
| 5 | よくあるつまずき | get の乱用・null を入れる など |

前半（1〜3節）で、Optional の作り方と、安全な値の取り出し方を学びます。
後半（4〜5節）で、Optional を「箱に入れたまま」扱う方法と、注意点を学びます。

---

## この章を読み終えると

第24章を読み終えるころには、次のことができるようになっています。

- `Optional` が「値の有無を安全に表す箱」だと理解できる
- `Optional.of`・`ofNullable`・`empty` で Optional を作れる
- `orElse`・`orElseGet`・`ifPresent` で、安全に値を扱える
- `map`・`filter` で、Optional を箱に入れたまま処理できる
- `null` を返すかわりに `Optional` を使う、という設計の発想がわかる

> **補足: Optional は Java 8 から**
>
> `Optional` も、ラムダ式・ストリームと同じ **Java 8** で導入されました。
> これら3つ（ラムダ・ストリーム・Optional）は、セットで「モダン Java」を形づくる、重要な機能です。

それでは、最初の節「Optional とは」から始めましょう。

---
title: 引数マッチャー
llm: true
co-author: ["Claude Opus 4.7"]
---

## 引数マッチャー

`when()` でも `verify()` でも、引数を**具体値**で書くのが基本でした。

```java
when(repository.findById(1L)).thenReturn(Optional.of(taro));
verify(mailSender).send("taro@example.com", "お知らせ", "ご注文ありがとうございます");
```

ですが、

- 「**どの ID でも**いいから、`findById` が呼ばれたら同じ値を返したい」
- 「`subject` だけ確認できれば、`body` は何でもいい」

といったときに、具体値ではなく**条件**で書く道具が、**引数マッチャー**（argument matcher）です。

すべて `org.mockito.ArgumentMatchers` に入っています。
`import static org.mockito.ArgumentMatchers.*;` で使うのが定番です。

---

## どんな値でもよい ― `any` 系

| マッチャー | 意味 |
|---|---|
| `any()` | 何でもよい（`null` も含む） |
| `anyString()` | 何らかの非 null `String` |
| `anyInt()` / `anyLong()` / `anyDouble()` | 何らかのプリミティブ |
| `anyBoolean()` | 何らかの `boolean` |
| `anyList()` / `anyMap()` / `anyCollection()` | 何らかのコレクション |
| `any(クラス.class)` | 何らかの**そのクラス**のインスタンス |

```java
when(repository.findById(anyLong()))
    .thenReturn(Optional.of(taro));    // どんな ID でも taro を返す

verify(mailSender).send(anyString(), eq("お知らせ"), anyString());
//                                    ↑ subject だけ厳しく検証
```

「これは何でもよい」とすることで、**意図しない値の比較で落ちる**ことを防げます。

---

## 値が等しい ― `eq()`

「**この値と等しい**ことを明示的に書く」のが `eq()` です。

```java
verify(mailSender).send(eq("taro@example.com"), eq("お知らせ"), anyString());
```

引数を具体値で書くと、Mockito は内部的に `equals` で比較してくれます。
ですが、**他にマッチャーを混ぜると、すべての引数をマッチャーで書く必要があります**。

```java
// △ コンパイルは通るが、動かない
verify(mailSender).send("taro@example.com", "お知らせ", anyString());

// ◯ すべてマッチャーで書く
verify(mailSender).send(eq("taro@example.com"), eq("お知らせ"), anyString());
```

これは Mockito の制約で、初心者がいちばんはまるところです。
**「マッチャーを混ぜたら、全部マッチャー」**と覚えておきましょう。

---

## 条件を自由に書く ― `argThat`

`argThat(ラムダ)` で、**好きな条件**を書けます。

```java
verify(mailSender).send(
    argThat(email -> email.endsWith("@example.com")),
    anyString(),
    anyString()
);
```

「`email` は `@example.com` で終わるはず」と断定しています。
条件をいくらでも複雑にできるので、定型のマッチャーで足りないときの**最終兵器**です。

---

## 「null かもしれない」を許す ― `any()` vs `nullable`

Mockito の `anyString()` は、**`null` を許しません**。
`null` の可能性があるなら、`nullable(String.class)` を使います。

```java
verify(mailSender).send(nullable(String.class), anyString(), anyString());
```

`null` をテストで明示的に通したいときに使う、ちょっとマニアックなマッチャーです。

---

## 全マッチャーの俯瞰

入門段階で覚えるのは、結局この 4 つで十分です。

| 状況 | 使うもの |
|---|---|
| どんな値でも | `any()` / `anyString()` / `anyInt()` |
| この値と等しい（マッチャーを混ぜている） | `eq("...")` |
| 条件を自由に書きたい | `argThat(...)` |
| null も含めて何でも | `nullable(クラス.class)` |

その他にも `startsWith`・`endsWith`・`contains`・`matches`（正規表現）などがありますが、
覚えるよりも、**必要になったときに `ArgumentMatchers` の Javadoc を眺める**くらいで十分です。

---

## マッチャー混在のルール（おさらい）

もう一度、いちばんよく踏む地雷を強調しておきます。

> **マッチャーと具体値は混ぜられない。混ぜたら、すべてマッチャー**

たとえば、

```java
verify(mailSender).send("taro@example.com", anyString(), anyString());  // △ InvalidUseOfMatchersException
```

実行すると、こんなエラーが出ます。

```text
org.mockito.exceptions.misusing.InvalidUseOfMatchersException:
Invalid use of argument matchers!
3 matchers expected, 1 recorded.
```

メッセージは「マッチャーが期待された数と違う」というものですが、原因はだいたい**混ぜている**です。
解決策は、

```java
verify(mailSender).send(eq("taro@example.com"), anyString(), anyString());
```

と、**具体値を `eq(...)` で包む**ことです。

---

## まとめ

- 引数マッチャーは、`org.mockito.ArgumentMatchers` の `static` メソッド
- 「どんな値でもよい」は **`any()` / `anyString()` / `anyInt()` / `any(クラス.class)`**
- 「この値と等しい」は **`eq(...)`**
- 「条件を自由に書きたい」は **`argThat(ラムダ)`**
- **マッチャーと具体値は混ぜられない**（混ぜたら全部マッチャー）

次の節では、ここまで学んだモック技術が活きる、**テストしやすい設計**を考えます。

---
title: よくあるつまずき
llm: true
co-author: ["Claude Opus 4.7"]
---

## よくあるつまずき

日付・時刻（`java.time`）で、初心者がつまずきやすいポイントを、まとめて確認します。

---

## 1. 計算結果を、使い忘れる（不変を忘れる）

`java.time` のクラスは**不変**です。`plusDays` などは、元を変えず、**新しい日付を返します**。
この性質を忘れて、「計算したのに、変わっていない」と戸惑うことがあります。

```java
LocalDate date = LocalDate.of(2026, 6, 9);
date.plusDays(3);          // ✕ 戻り値を使っていない
IO.println(date);          // → 2026-06-09（変わっていない！）
```

```text
2026-06-09
```

`date.plusDays(3)` は、新しい日付を**返す**だけで、`date` 自体は変えません。
戻り値を、ちゃんと受け取る必要があります。

```java
LocalDate date = LocalDate.of(2026, 6, 9);
date = date.plusDays(3);   // ◯ 戻り値を受け取る
IO.println(date);
```

```text
2026-06-12
```

第10章の `String`（不変）や、第23章のストリームと、まったく同じ注意点です。
「**`java.time` のメソッドは、結果を返すだけ。受け取らないと意味がない**」と覚えておきましょう。

---

## 2. ありえない日付を作る

`2月30日` のような、存在しない日付を作ろうとすると、**実行時にエラー**になります。

```java
LocalDate date = LocalDate.of(2026, 2, 30);   // 2月30日は存在しない
```

```text
Exception in thread "main" java.time.DateTimeException: Invalid date 'FEBRUARY 30'
```

`DateTimeException` で、「`FEBRUARY 30`（2月30日）は無効な日付だ」と教えてくれます。
これは、むしろ**ありがたい**機能です。古い API では、こうした不正な日付が、勝手に「3月2日」などに繰り上がってしまい、バグの温床でした。
`java.time` は、おかしな日付を、はっきりエラーにしてくれます。

---

## 3. 月（MM）と分（mm）を取り違える

`DateTimeFormatter` の形式で、もっともよくある間違いが、**月と分の取り違え**です。

```java
// ✕ 月のつもりが、分（mm）になっている
DateTimeFormatter wrong = DateTimeFormatter.ofPattern("yyyy-mm-dd");
```

| 記号 | 意味 |
|---|---|
| `MM`（大文字） | **月** |
| `mm`（小文字） | **分** |
| `HH`（大文字） | 時（24時間） |

同じアルファベットでも、大文字と小文字では意味がまったく違います。「**月は大文字 `MM`**」と、しっかり区別しましょう。
小文字 `mm` を月に使うと、分の値が表示されて、まったく違う結果になります。

---

## 4. 古い Date・Calendar を使ってしまう

ネットで古い記事を参考にすると、`java.util.Date` や `Calendar`、`SimpleDateFormat` を使ったコードに出会うことがあります。
これらは**古い API** で、第1節で見たような問題を抱えています。

```java
import java.util.Date;
Date d = new Date();   // △ 古い API。新しいコードでは避ける
```

**新しく書くコードでは、`java.time`（`LocalDate` など）を使いましょう。**
`import` するパッケージが `java.time` か `java.util.Date` かで、新しいか古いかを見分けられます。
（古いコードを読む必要がある場合に備えて、「`Date`・`Calendar` は古いもの」と知っておくのは大切です。）

---

## 5. LocalDateTime に「タイムゾーン」を期待する

`LocalDateTime` は、名前のとおり `Local`（タイムゾーンを持たない）です。
「世界のどこの時刻か」を区別しないので、時差をまたぐ処理には向きません。

```java
LocalDateTime dt = LocalDateTime.of(2026, 6, 9, 14, 30);
// この 14:30 が「東京」なのか「ロンドン」なのかは、区別されない
```

国内だけで使うなら、これで十分です。
ですが、「海外のユーザーと時刻をやりとりする」「正確な記録を残す」場合は、第5節の **`ZonedDateTime`**（タイムゾーン付き）や **`Instant`**（世界共通）を使います。
「`Local〜` は時差を持たない」ことを、意識しておきましょう。

---

## まとめ

- `java.time` は**不変**。`plusDays` などは**戻り値を受け取らないと意味がない**
- ありえない日付（2月30日など）は **`DateTimeException`**（むしろ安全）
- 形式の **月は `MM`（大文字）、分は `mm`（小文字）** ―― 取り違えに注意
- 新しいコードでは、古い **`Date`・`Calendar` を避け**、`java.time` を使う
- **`Local〜` はタイムゾーンを持たない**。時差が必要なら `ZonedDateTime`・`Instant`

次は、この章で学んだ言葉を、用語集としてまとめます。

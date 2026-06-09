---
title: 日付と時刻の基本クラス
llm: true
---

## 日付と時刻の基本クラス

`java.time` の主役は、**`LocalDate`**（日付）・**`LocalTime`**（時刻）・**`LocalDateTime`**（日付＋時刻）の3つです。
この節では、それぞれの作り方と、値の取り出し方を学びます。

---

## LocalDate ― 日付だけ

**`LocalDate`** は、「2026年6月9日」のような、**日付だけ**を表します。

指定した日付を作るには、**`LocalDate.of(年, 月, 日)`** を使います。

```java
LocalDate date = LocalDate.of(2026, 6, 9);
IO.println(date);
```

```text
2026-06-09
```

前の節のとおり、月は**1から**なので、`6` がちゃんと「6月」です。

**今日の日付**がほしいときは、**`LocalDate.now()`** を使います。

```java
LocalDate today = LocalDate.now();   // 実行した日の日付になる
IO.println(today);
```

```text
2026-06-09
```

（`now()` の結果は、もちろん実行した日によって変わります。ここでは、この本を書いている日を例にしています。）

---

## 日付から、年・月・日・曜日を取り出す

`LocalDate` から、年・月・日や、曜日を取り出せます。

```java
LocalDate date = LocalDate.of(2026, 6, 9);

IO.println(date.getYear());        // 年
IO.println(date.getMonthValue());  // 月（数値）
IO.println(date.getDayOfMonth());  // 日
IO.println(date.getDayOfWeek());   // 曜日
```

```text
2026
6
9
TUESDAY
```

`getDayOfWeek()` は、曜日を返します（`TUESDAY` ＝ 火曜日）。
「2026年6月9日は火曜日」と、計算しなくても分かります。うるう年や月の日数も、`java.time` がすべて正しく扱ってくれます。

---

## LocalTime ― 時刻だけ

**`LocalTime`** は、「14時30分」のような、**時刻だけ**を表します。
**`LocalTime.of(時, 分)`** で作ります（秒まで指定することもできます）。

```java
LocalTime time = LocalTime.of(14, 30);
IO.println(time);
```

```text
14:30
```

「開店時刻」「アラームの時刻」のように、**日付は関係なく、時刻だけ**を扱いたいときに使います。
現在時刻は `LocalTime.now()` で取れます。

---

## LocalDateTime ― 日付＋時刻

**`LocalDateTime`** は、`LocalDate` と `LocalTime` を合わせた、「**日付と時刻の両方**」を表します。
**`LocalDateTime.of(年, 月, 日, 時, 分)`** で作ります。

```java
LocalDateTime dateTime = LocalDateTime.of(2026, 6, 9, 14, 30);
IO.println(dateTime);
```

```text
2026-06-09T14:30
```

表示の真ん中にある **`T`** は、「ここから時刻」を表す区切りです（日付と時刻の境目）。
「予約日時」「投稿日時」のように、日付と時刻の両方が必要なときに使います。

`LocalDate` と `LocalTime` から、組み立てることもできます。

```java
LocalDate date = LocalDate.of(2026, 6, 9);
LocalTime time = LocalTime.of(14, 30);
LocalDateTime dateTime = date.atTime(time);   // 日付に時刻を合わせる
IO.println(dateTime);
```

```text
2026-06-09T14:30
```

---

## 3つのクラスの使い分け

| クラス | 表すもの | 作り方 | 例 |
|---|---|---|---|
| `LocalDate` | 日付だけ | `LocalDate.of(年, 月, 日)` | 誕生日、締切日 |
| `LocalTime` | 時刻だけ | `LocalTime.of(時, 分)` | 開店時刻、アラーム |
| `LocalDateTime` | 日付＋時刻 | `LocalDateTime.of(年,月,日,時,分)` | 予約日時、投稿日時 |

扱いたいものに合わせて、ぴったりのクラスを選びましょう。
「日付だけでよいのに `LocalDateTime` を使う」と、不要な時刻がついて回るので、**必要なものだけを表すクラス**を選ぶのが、よい習慣です。

> **補足: Local は「タイムゾーンを持たない」という意味**
>
> クラス名の頭の **`Local`** は、「タイムゾーン（時差）の情報を持たない」という意味です。
> 「日本の6月9日」「ニューヨークの6月9日」を区別しない、シンプルな日付・時刻です。
> たいていの用途では、この `Local〜` で十分です。世界の時差を厳密に扱いたいときは、第5節の `ZonedDateTime` を使います。

---

## まとめ

- **`LocalDate`** … 日付だけ（`LocalDate.of(2026, 6, 9)`、月は1から）
- **`LocalTime`** … 時刻だけ（`LocalTime.of(14, 30)`）
- **`LocalDateTime`** … 日付＋時刻（表示の `T` は日付と時刻の区切り）
- 今日・現在は **`now()`** で取得（`LocalDate.now()` など）
- `getYear()`・`getDayOfWeek()` などで、年・月・日・曜日を取り出せる
- 扱いたいものに合わせて、3つのクラスを使い分ける

次の節では、「3日後」「2つの日付の差」などの、日付の**計算**を学びます。

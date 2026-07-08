---
title: 日付の計算 ― plus・minus・差を求める
llm: true
co-author: ["Claude Opus 4.7"]
---

## 日付の計算 ― plus・minus・差を求める

日付・時刻を扱うと、「3日後」「1か月前」「2つの日付の間は何日か」といった**計算**が、必ず必要になります。
`java.time` は、こうした計算を、安全でかんたんに書けるようにしてくれます。
この節では、その方法を学びます。

---

## plus / minus ― 足す・引く

「○日後」「○か月前」は、**`plusDays`・`minusMonths`** のようなメソッドで求めます。

```java
LocalDate date = LocalDate.of(2026, 6, 9);

IO.println(date.plusDays(3));      // 3日後
IO.println(date.plusWeeks(1));     // 1週間後
IO.println(date.minusMonths(1));   // 1か月前
```

```text line-numbers=false
2026-06-12
2026-06-16
2026-05-09
```

`plusDays`・`plusWeeks`・`plusMonths`・`plusYears` で足し、`minus〜` で引きます。
月をまたいだり、うるう年だったりしても、`java.time` が正しく計算してくれます（自分で日数を数える必要はありません）。

### 大事な性質 ― 元は変わらない（不変）

ここで、第13章で学んだ**不変オブジェクト**の性質が効いてきます。
`plusDays(3)` は、**元の `date` を変えず、新しい日付を返します**。

```java
LocalDate date = LocalDate.of(2026, 6, 9);
LocalDate future = date.plusDays(3);

IO.println(date);     // 元は変わらない
IO.println(future);   // 計算結果は新しい日付
```

```text line-numbers=false
2026-06-09
2026-06-12
```

`plusDays(3)` を呼んでも、元の `date` は `2026-06-09` のままです。
これは、第13章の不変オブジェクトや、第23章のストリームと、まったく同じ考え方です。
「**元を変えず、結果を新しく返す**」ので、知らないうちに日付が変わる事故が起きません。

### つなげて書ける

`plus`・`minus` は、新しい日付を返すので、**つなげて**書けます。

```java
LocalDate date = LocalDate.of(2026, 6, 9);
LocalDate result = date.plusMonths(1).minusDays(2);   // 1か月後の、2日前
IO.println(result);
```

```text line-numbers=false
2026-07-07
```

「1か月後（7月9日）の、2日前（7月7日）」が、すらすらと書けました。

---

## 日付を比べる ― isBefore / isAfter

2つの日付の前後を比べるには、**`isBefore`・`isAfter`・`isEqual`** を使います。結果は `boolean` です。

```java
LocalDate d1 = LocalDate.of(2026, 6, 9);
LocalDate d2 = LocalDate.of(2026, 12, 25);

IO.println(d1.isBefore(d2));   // d1 は d2 より前か
IO.println(d1.isAfter(d2));    // d1 は d2 より後か
```

```text line-numbers=false
true
false
```

「締切を過ぎているか」「予約日が今日より後か」などの判定に使います。
（数値の `<`・`>` は日付には使えないので、これらのメソッドを使います。）

---

## 2つの日付の差 ― Period

「2つの日付の間は、何年何か月何日か」を求めるには、**`Period.between(開始, 終了)`** を使います。

```java
LocalDate start = LocalDate.of(2026, 1, 1);
LocalDate end = LocalDate.of(2026, 6, 9);

Period p = Period.between(start, end);
IO.println(p.getMonths() + "か月 " + p.getDays() + "日");
```

```text line-numbers=false
5か月 8日
```

`Period` は、「年・月・日」での差を表します。`getYears()`・`getMonths()`・`getDays()` で取り出せます。
「1月1日から6月9日まで」は「5か月8日」と、求まりました。

「ちょうど何日あるか」（総日数）を知りたいときは、**`ChronoUnit.DAYS.between(...)`** を使います。

```java
import java.time.temporal.ChronoUnit;

long days = ChronoUnit.DAYS.between(start, end);
IO.println(days + "日");
```

```text line-numbers=false
159日
```

`ChronoUnit.DAYS.between(...)` は、「総日数」を返します（`Period` の「○か月○日」とは別物です）。
`ChronoUnit.MONTHS`・`ChronoUnit.YEARS` で、総月数・総年数も求められます。

---

## 時刻の差 ― Duration

「時刻と時刻の差（何時間何分か）」を求めるには、**`Duration.between(...)`** を使います。

```java
LocalTime startWork = LocalTime.of(9, 0);
LocalTime endWork = LocalTime.of(17, 30);

Duration work = Duration.between(startWork, endWork);
IO.println(work.toHours() + "時間" + (work.toMinutes() % 60) + "分");
```

```text line-numbers=false
8時間30分
```

`Duration` は「時間ベースの長さ」を表します。`toHours()`・`toMinutes()` などで取り出せます。
「9:00 から 17:30 まで」は「8時間30分」と求まりました。

- **`Period`** … 日付の差（年・月・日）
- **`Duration`** … 時刻の差（時・分・秒）

「日付の差なら `Period`、時刻の差なら `Duration`」と覚えておきましょう。

---

## まとめ

- 「○日後」「○か月前」は **`plusDays`・`minusMonths`** など（月またぎ・うるう年も正しく計算）
- これらは**元を変えず、新しい日付を返す**（不変。つなげて書ける）
- 前後の比較は **`isBefore`・`isAfter`**（`<`・`>` は使えない）
- 日付の差（年・月・日）は **`Period.between(...)`**、総日数は **`ChronoUnit.DAYS.between(...)`**
- 時刻の差（時・分）は **`Duration.between(...)`**

次の節では、日付を好きな形式で表示・読み取りする **`DateTimeFormatter`** を学びます。

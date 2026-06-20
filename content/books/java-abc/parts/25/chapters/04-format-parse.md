---
title: 整形と解析 ― DateTimeFormatter
llm: true
---

## 整形と解析 ― DateTimeFormatter

日付を、`2026年06月09日` のような**好きな形式で表示**したい。
逆に、`"2026/06/09"` のような**文字列を、日付として読み取り**たい。
そんなときに使うのが、**`DateTimeFormatter`**（デイトタイム・フォーマッター）です。
この節では、その使い方を学びます。

（`DateTimeFormatter` は `java.time.format` パッケージにあります。`.java` ファイルでは `import java.time.format.DateTimeFormatter;` が必要です。）

---

## 整形 ― 日付を好きな形式の文字列に

日付を、指定した形式の文字列にするのが、**整形**（フォーマット）です。
まず、**`DateTimeFormatter.ofPattern("形式")`** で、形式を表すフォーマッターを作り、`日付.format(フォーマッター)` で変換します。

```java
import java.time.format.DateTimeFormatter;

LocalDate date = LocalDate.of(2026, 6, 9);
DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy年MM月dd日");

IO.println(date.format(formatter));
```

```text
2026年06月09日
```

`"yyyy年MM月dd日"` という形式で、`2026年06月09日` という文字列が得られました。
`yyyy`・`MM`・`dd` の部分が、それぞれ年・月・日の数字に置きかわっています。

---

## 形式を表す記号（パターン）

`ofPattern(...)` に渡す形式は、決まった**記号**の組み合わせで指定します。
よく使う記号は、次のとおりです。

| 記号 | 意味 | 例（2026年6月9日 14:30） |
|---|---|---|
| `yyyy` | 年（4桁） | `2026` |
| `MM` | 月（2桁） | `06` |
| `dd` | 日（2桁） | `09` |
| `HH` | 時（24時間、2桁） | `14` |
| `mm` | 分（2桁） | `30` |
| `ss` | 秒（2桁） | `00` |

これらを組み合わせて、好きな形式を作れます。

```java
LocalDateTime dt = LocalDateTime.of(2026, 6, 9, 14, 30, 0);

IO.println(dt.format(DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm")));
IO.println(dt.format(DateTimeFormatter.ofPattern("MM月dd日 HH時mm分")));
```

```text
2026/06/09 14:30
06月09日 14時30分
```

記号以外の文字（`/`・`年`・`時` など）は、そのまま表示されます。
「`yyyy/MM/dd`」ならスラッシュ区切り、「`MM月dd日`」なら日本語、と自由に組み立てられます。

> **注意: 月は `MM`、分は `mm`（大文字・小文字に注意）**
>
> よくある間違いが、**月**（`MM`、大文字）と**分**（`mm`、小文字）の取り違えです。
> 大文字 `MM` が「月」、小文字 `mm` が「分」です。
> `HH`（時）も大文字です。間違えると、まったく違う値が表示されるので、注意しましょう。

---

## 解析 ― 文字列を日付に読み取る

逆に、文字列を日付として読み取ることを、**解析**（パース）と呼びます。
**`LocalDate.parse(文字列)`** を使います。

```java
LocalDate date = LocalDate.parse("2026-06-09");
IO.println(date.plusDays(1));   // 読み取った日付で計算できる
```

```text
2026-06-10
```

`parse(...)` で文字列を日付に変換すれば、あとは `plusDays` などの計算も自由にできます。

引数なしの `parse(...)` は、`2026-06-09` という**標準の形式**（`yyyy-MM-dd`）を読み取ります。
それ以外の形式（`2026/06/09` など）を読み取りたいときは、**フォーマッターを一緒に渡します**。

```java
DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy/MM/dd");
LocalDate date = LocalDate.parse("2026/06/09", formatter);
IO.println(date);
```

```text
2026-06-09
```

「読み取りたい文字列の形式」を、`ofPattern(...)` で教えてあげるわけです。
これで、`/` 区切りの文字列も、正しく日付として読み取れました。

---

## 整形と解析は、ちょうど逆向き

整形と解析は、向きが逆なだけで、対になっています。

```text
整形（format）:  日付       →  "2026年06月09日"（文字列）
解析（parse） :  "2026..."  →  日付
```

- **整形**（`format`） … 日付を、表示用の文字列にする（画面やファイルに出すとき）
- **解析**（`parse`） … 文字列を、計算できる日付にする（入力やファイルから読むとき）

「外に出すときは整形、中に取り込むときは解析」と覚えておきましょう。

---

## まとめ

- **`DateTimeFormatter.ofPattern("形式")`** で、表示・読み取りの形式を指定する
- **整形**（`日付.format(フォーマッター)`）… 日付を好きな形式の文字列にする
- 形式の記号：`yyyy`（年）・`MM`（月）・`dd`（日）・`HH`（時）・`mm`（分）・`ss`（秒）
- **月は `MM`（大文字）、分は `mm`（小文字）** ―― 取り違えに注意
- **解析**（`LocalDate.parse(文字列)`）… 文字列を日付に読み取る（形式が違えばフォーマッターを渡す）

次の節では、世界の時刻を扱う **タイムゾーンと Instant** を学びます。

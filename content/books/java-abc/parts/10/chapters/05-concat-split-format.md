---
title: 連結・分割・整形
llm: true
co-author: ["Claude Opus 4.7"]
---

## 連結・分割・整形

文字列を**つなぐ**・**区切る**・**体裁を整える**方法を学びます。
複数のデータを1つの文字列にまとめたり、逆に1つの文字列を分解したりする、実用的な操作です。

---

## つなぐ ― + と repeat

文字列をつなぐ（連結する）には、第4章・第5章でも使った **`+`** が基本です。

```java
String name = "佐藤";
String message = "こんにちは、" + name + "さん";
```

```text line-numbers=false
jshell> message
message ==> "こんにちは、佐藤さん"
```

同じ文字列を**繰り返してつなぎたい**ときは、**`repeat(回数)`** が便利です（Java 11 で追加）。

```text line-numbers=false
jshell> "ab".repeat(3)
$1 ==> "ababab"

jshell> "=".repeat(10)
$2 ==> "=========="
```

`"ab"` を3回繰り返して `"ababab"`、区切り線をひくのに `"="` を10個、といった使い方ができます。

---

## 区切る ― split

**`split`** は、文字列を指定した**区切り文字**でバラバラにし、**配列**として返します。
CSV（カンマ区切り）のようなデータを分解するときに使います。

```java
String csv = "りんご,みかん,ぶどう";
String[] fruits = csv.split(",");
```

```text line-numbers=false
jshell> fruits
fruits ==> String[3] { "りんご", "みかん", "ぶどう" }

jshell> fruits.length
$4 ==> 3
```

`","` で区切られて、3つの要素を持つ `String` の配列になりました。
返ってくるのは**配列**なので、第8章で学んだように for や for-each でたどれます。

```java
for (String fruit : fruits) {
    IO.println(fruit);
}
```

```text line-numbers=false
りんご
みかん
ぶどう
```

---

## まとめてつなぐ ― String.join

`split` の逆で、**複数の文字列を、区切り文字をはさんで1つにまとめる**のが **`String.join`** です。

```text line-numbers=false
jshell> String.join("-", "2025", "06", "06")
$1 ==> "2025-06-06"
```

第1引数が区切り文字、そのあとにつなぎたい文字列を並べます。
`"-"` をはさんで、`"2025-06-06"` という日付らしい文字列ができました。
（`String.join` は、`String` のうしろにドットを付けて呼びます。`Arrays.sort` と同じく、特定の文字列ではなく `String` という「種類」に対して呼ぶメソッドです。くわしくは第11章以降で学びます。）

---

## 体裁を整える ― formatted

「`佐藤さんは25歳`」のように、**文字列の中に値を埋め込んで整形**したいことがあります。
`+` でつなぐこともできますが、数が多いと読みにくくなります。そこで便利なのが **`formatted`** です。

```text line-numbers=false
jshell> "%sさんは%d歳".formatted("佐藤", 25)
$1 ==> "佐藤さんは25歳"
```

文字列の中の `%s` や `%d` が**プレースホルダー**（値を入れる場所）で、`formatted(...)` に渡した値が、順に埋め込まれます。

| 記号 | 入る値 | 例 |
|---|---|---|
| `%s` | 文字列（string） | `"佐藤"` |
| `%d` | 整数（decimal） | `25` |
| `%f` | 小数（float） | `3.14` |

小数は、桁数を指定できます。`%.2f` は「小数点以下2桁」という意味です。

```text line-numbers=false
jshell> String.format("%.2f", 3.14159)
$1 ==> "3.14"
```

> `"...".formatted(...)` と `String.format("...", ...)` は、引数の渡し方が少し違うだけで、結果は同じです。
> `formatted` は文字列のうしろに付けて書け、新しめの書き方です。どちらを使っても構いません。

---

## まとめ

| やりたいこと | 方法 | 例 |
|---|---|---|
| つなぐ | `+` | `"a" + "b"` → `"ab"` |
| 繰り返してつなぐ | `repeat(回数)` | `"ab".repeat(3)` → `"ababab"` |
| 区切ってバラす | `split(区切り)` | `"a,b".split(",")` → `["a", "b"]` |
| 区切りでまとめる | `String.join(区切り, ...)` | `String.join("-", "a", "b")` → `"a-b"` |
| 値を埋めて整形 | `formatted(...)` | `"%d点".formatted(80)` → `"80点"` |

次の節では、この章で最も重要な **文字列の比較**（`==` と `equals` の違い）を学びます。

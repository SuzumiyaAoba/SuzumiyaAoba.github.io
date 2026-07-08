---
title: 文字列を組み立てる ― String.join・StringBuilder
llm: true
co-author: ["Claude Opus 4.7"]
---

## 文字列を組み立てる ― String.join・StringBuilder

複数の文字列を、つなぎ合わせて1つにする ―― この「組み立て」も、よくある作業です。
この節では、便利な **`String.join`** と、効率よく組み立てる **`StringBuilder`** を学びます。

---

## String.join ― 区切り文字でつなぐ

**`String.join(区切り, 値, 値, ...)`** は、複数の文字列を、指定した**区切り文字**でつなぎます。

```java
String date = String.join("-", "2026", "06", "09");
IO.println(date);
```

```text line-numbers=false
2026-06-09
```

`String.join("-", ...)` で、`2026`・`06`・`09` を `-` でつないで、`2026-06-09` ができました。
リスト（第21章）を渡すこともできます。

```java
List<String> names = List.of("佐藤", "鈴木", "高橋");
String joined = String.join(", ", names);
IO.println(joined);
```

```text line-numbers=false
佐藤, 鈴木, 高橋
```

「リストを、カンマ区切りの1行にしたい」ときに、とても手軽です。
（第23章のストリームで学んだ `Collectors.joining(...)` と、同じ用途です。単純にリストや複数の文字列をつなぐだけなら、`String.join` が手軽です。）

---

## ループの中での + 連結は、要注意

文字列を、ループの中で `+` で少しずつつなぐ書き方は、**たくさんの回数になると、効率が悪い**という問題があります。

```java
String result = "";
for (int i = 0; i < 5; i++) {
    result = result + i;   // 毎回、新しい文字列を作っている
}
IO.println(result);
```

```text line-numbers=false
01234
```

このコードは正しく動きます。ですが、注意点があります。
第10章で学んだとおり、**文字列は不変**（変更できない）でした。
そのため、`result + i` のたびに、**まったく新しい文字列が作られています**。
回数が少なければ問題ありませんが、何千回・何万回とループすると、そのたびに新しい文字列を作るので、**だんだん遅くなって**しまいます。

---

## StringBuilder ― 効率よく組み立てる

大量の文字列を組み立てるときは、**`StringBuilder`**（ストリングビルダー）を使います。
これは、「**書き換えられる、文字列の組み立て用の入れ物**」です。

```java
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 5; i++) {
    sb.append(i);          // 入れ物に、追記していく
}
String result = sb.toString();   // 最後に文字列にする
IO.println(result);
```

```text line-numbers=false
01234
```

- `new StringBuilder()` … 組み立て用の、空の入れ物を作る
- `append(...)` … 入れ物に、文字や数値を**追記**する（新しい文字列は作られない）
- `toString()` … 最後に、できあがった文字列を取り出す

`StringBuilder` は、毎回新しい文字列を作るのではなく、**1つの入れ物に追記していく**ので、何回追記しても効率が落ちません。
「ループの中で、たくさんの文字列をつなぐ」場合は、`+` ではなく `StringBuilder` を使いましょう。

`append` は、自分自身を返すので、**つなげて**書くこともできます。

```java
StringBuilder sb = new StringBuilder();
sb.append("名前: ").append("佐藤").append(" / 年齢: ").append(25);
IO.println(sb.toString());
```

```text line-numbers=false
名前: 佐藤 / 年齢: 25
```

---

## 使い分けのまとめ

文字列を組み立てる方法を、整理しておきましょう。

| 方法 | 向いている場面 |
|---|---|
| `+` 連結 | **少数**の文字列をつなぐ（2〜3個など） |
| `formatted` / `String.format` | 決まった**書式**に値を埋め込む（前節） |
| `String.join` | 複数の文字列を、**区切り文字**でつなぐ |
| `StringBuilder` | **ループで大量**につなぐ（効率重視） |

ふだんの「2〜3個つなぐ」程度なら、`+` で十分です（読みやすさ優先）。
「決まった形式に整形」なら `formatted`、「区切りでつなぐ」なら `String.join`、「ループで大量に」なら `StringBuilder` ―― と、場面で使い分けましょう。

---

## まとめ

- **`String.join(区切り, ...)`** … 複数の文字列を、区切り文字でつなぐ（リストもOK）
- 文字列は**不変**なので、**ループ内の `+` 連結**は、回数が多いと効率が悪い
- **`StringBuilder`** は、書き換えられる組み立て用の入れ物（`append` で追記 → `toString`）
- ループで大量につなぐなら、`+` ではなく **`StringBuilder`**
- 少数なら `+`、書式なら `formatted`、区切りなら `join`、大量なら `StringBuilder`

次の節では、テキストブロック・文字列フォーマットでつまずきやすいポイントを確認します。

---
title: switch 文と switch 式
llm: true
---

## switch 文と switch 式

`else if` をいくつも続けると、コードが長くなりがちです。
特に「1つの値が、どの値に当てはまるか」で分けたいときは、**switch**（スイッチ）を使うと、すっきり書けます。

たとえば「曜日の番号（1〜7）から、曜日の名前を求める」ような場面です。

---

## switch 式（Java の新しい書き方）

Java 14 以降では、**switch 式**という、わかりやすい書き方が使えます。本書では、こちらをおすすめします。

```java
int day = 3;
String dow = switch (day) {
    case 1 -> "月";
    case 2 -> "火";
    case 3 -> "水";
    default -> "その他";
};
```

`switch (day)` で、`day` の値を調べます。
`case 3 ->` のように、値と、その値だったときに選ぶものを、矢印 `->` で結びます。
`default` は、どの `case` にも当てはまらないときに選ばれます。

jshell で確かめてみましょう。

```text
jshell> int day = 3;
day ==> 3
jshell> String dow = switch (day) {
   ...>     case 1 -> "月";
   ...>     case 2 -> "火";
   ...>     case 3 -> "水";
   ...>     default -> "その他";
   ...> };
dow ==> "水"
```

`day` が 3 なので、`case 3` が選ばれ、`dow` に `"水"` が入りました。
（jshell では、途中の行に `...>` という継続の印が出ます。`{ }` が閉じるまで、入力を待ってくれているしるしです。）

このように、switch 式は**全体で1つの値**になり、その結果を変数に入れられます。

---

## 1つの case に複数の値

カンマで区切れば、1つの `case` に複数の値をまとめられます。

```java
int month = 4;
String season = switch (month) {
    case 12, 1, 2 -> "冬";
    case 3, 4, 5  -> "春";
    case 6, 7, 8  -> "夏";
    default       -> "秋";
};
```

`month` が 4 なら `case 3, 4, 5` に当てはまり、`season` は `"春"` になります。

---

## 従来の switch 文と break

switch には、古くからある**switch 文**という書き方もあります。こちらは矢印ではなく、コロン `:` と `break` を使います。

```java
switch (day) {
    case 1:
        IO.println("月");
        break;
    case 2:
        IO.println("火");
        break;
    default:
        IO.println("その他");
}
```

この書き方には、**`break` を書き忘れると、次の `case` の処理にそのまま流れ込んでしまう**という、有名な落とし穴があります。

新しい **switch 式（`->`）では、この `break` が不要**で、当てはまった case だけが実行されます。
そのぶん安全で読みやすいので、本書では switch 式を中心に使います。

---

## まとめ

- **switch** は、1つの値が「どの値に当てはまるか」で分けるのに向いている
- **switch 式（`->`）** は全体で1つの値になり、変数に入れられる。本書のおすすめ
- カンマ区切りで、1つの `case` に複数の値をまとめられる（`case 3, 4, 5`）
- 従来の **switch 文（`:` と `break`）** は `break` 忘れの落とし穴がある。switch 式なら不要

次の節では、条件分岐でつまずきやすいポイントを、まとめて確認します。

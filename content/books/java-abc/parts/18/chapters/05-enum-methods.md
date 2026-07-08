---
title: enum の便利なメソッド
llm: true
co-author: ["Claude Opus 4.7"]
---

## enum の便利なメソッド

列挙型には、定義しなくても最初から使える、便利なメソッドがいくつか備わっています。
この節では、よく使う `values()`・`valueOf()`・`name()`・`ordinal()` を学びます。

以下では、次の列挙型を例に使います。

```java
enum Signal {
    RED, YELLOW, GREEN
}
```

---

## values() ― すべての定数を取り出す

**`values()`** は、その列挙型の**すべての定数を、配列で**返します。
列挙型名に付けて、`Signal.values()` のように呼びます。

```java
for (Signal s : Signal.values()) {
    IO.println(s);
}
```

```text line-numbers=false
RED
YELLOW
GREEN
```

`Signal.values()` が `{RED, YELLOW, GREEN}` という配列を返すので、第8章で学んだ for-each で、すべての定数を順に処理できます。
「すべての選択肢に対して、何かをしたい」ときに、とても便利です（メニューの一覧表示など）。

---

## valueOf() ― 文字列から定数を得る

**`valueOf("名前")`** は、**文字列を、対応する列挙定数に変換**します。

```java
Signal s = Signal.valueOf("RED");
IO.println(s == Signal.RED);
```

```text line-numbers=false
true
```

`Signal.valueOf("RED")` は、`Signal.RED` を返します。
たとえば、ファイルや画面から読み込んだ文字列（`"RED"`）を、列挙型に変換したいときに使います。

ただし、注意が必要です。
**存在しない名前を渡すと、実行時にエラー（例外）になります。**

```java
Signal s = Signal.valueOf("PURPLE");   // 存在しない名前
```

```text line-numbers=false
Exception in thread "main" java.lang.IllegalArgumentException: No enum constant Signal.PURPLE
```

「`Signal.PURPLE` という列挙定数はない」というエラーです。
外部から受け取った文字列を `valueOf` に渡すときは、正しい名前である保証がないので、注意しましょう（エラーへの対処は、第20章「例外処理」で学びます）。

---

## name() と ordinal()

各列挙定数には、次の2つのメソッドもあります。

- **`name()`** … その定数の**名前（文字列）**を返す（`RED` なら `"RED"`）
- **`ordinal()`** … その定数の**並び順（0 から始まる番号）**を返す

```java
Signal s = Signal.GREEN;
IO.println(s.name());      // 名前
IO.println(s.ordinal());   // 並び順（0 始まり）
```

```text line-numbers=false
GREEN
2
```

`GREEN` は、`RED`(0)・`YELLOW`(1)・`GREEN`(2) の3番目なので、`ordinal()` は `2` です。

> **注意: ordinal() に頼りすぎない**
>
> `ordinal()` は「定義した順番の番号」を返しますが、これに**重要な処理を頼るのは危険**です。
> なぜなら、あとで定数の順番を入れ替えたり、間に新しい定数を追加したりすると、番号が変わってしまうからです。
> 「`ordinal()` が `0` なら赤」のような処理を書いていると、順番を変えただけでバグになります。
> 番号に意味を持たせたいなら、前の節のように、**フィールドとして明示的に持たせる**ほうが安全です。
> `ordinal()` は、あくまで補助的に使う、と覚えておきましょう。

---

## まとめ

- **`values()`** … すべての定数を**配列**で返す（for-each で全定数を処理できる）
- **`valueOf("名前")`** … 文字列を列挙定数に変換する（存在しない名前だと例外）
- **`name()`** … 定数の名前を文字列で返す
- **`ordinal()`** … 定数の並び順（0 始まり）を返す。ただし**頼りすぎない**
- 番号に意味を持たせたいときは、`ordinal()` ではなく**フィールド**で持つ

次の節では、列挙型でつまずきやすいポイントを、まとめて確認します。

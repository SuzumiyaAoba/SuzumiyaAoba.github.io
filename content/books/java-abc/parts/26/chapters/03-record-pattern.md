---
title: レコードパターン ― 中身を分解する
llm: true
---

## レコードパターン ― 中身を分解する

パターンマッチングは、第17章で学んだ**レコード**と組み合わせると、さらに強力になります。
**レコードパターン**を使うと、レコードの**中身（コンポーネント）を、その場で取り出せる**のです。
この節では、その書き方を学びます。

---

## レコードを、型と中身でマッチする

第17章で学んだ、座標を表すレコードを使いましょう。

```java
record Point(int x, int y) {}
```

このレコードを `switch` でマッチするとき、`case Point p ->` と書けば、第2節のとおり、`p` にレコードが入ります。
そこから中身を取り出すには、`p.x()`・`p.y()` を呼びます。

```java
static String describe(Object obj) {
    return switch (obj) {
        case Point p -> "点(" + p.x() + ", " + p.y() + ")";
        default      -> "その他";
    };
}
```

これでも動きますが、**レコードパターン**を使うと、`x` と `y` を、`case` で**直接**取り出せます。

```java
static String describe(Object obj) {
    return switch (obj) {
        case Point(int x, int y) -> "点(" + x + ", " + y + ")";
        default                  -> "その他";
    };
}

IO.println(describe(new Point(3, 4)));
```

```text
点(3, 4)
```

`case Point(int x, int y) ->` が、レコードパターンです。
「`obj` が `Point` なら、その中身を `x` と `y` に**分解して**取り出す」という意味です。
`p.x()`・`p.y()` と呼ばなくても、`x`・`y` として、いきなり使えます。

「型を確認する」「中身を取り出す」を、`case` の1行に**まとめて書ける** ―― これがレコードパターンの便利さです。

---

## ネストしたレコードも分解できる

レコードの中に、別のレコードが入っている場合も、**まとめて分解**できます。

```java
record Point(int x, int y) {}
record Line(Point start, Point end) {}

static String describe(Object obj) {
    return switch (obj) {
        // Line の中の、2つの Point を、さらに分解する
        case Line(Point(int x1, int y1), Point(int x2, int y2)) ->
            "線分: (" + x1 + "," + y1 + ") → (" + x2 + "," + y2 + ")";
        default -> "その他";
    };
}

IO.println(describe(new Line(new Point(0, 0), new Point(3, 4))));
```

```text
線分: (0,0) → (3,4)
```

`case Line(Point(int x1, int y1), Point(int x2, int y2))` で、`Line` の中の2つの `Point` を、さらに `x1, y1, x2, y2` まで**一気に分解**しています。
入れ子になったデータの中身を、`get` を何度も呼ばずに、その場で取り出せるのです。

---

## var で型を省く

レコードパターンの中の型は、第4章の **`var`** で省略できます。

```java
case Point(var x, var y) -> "点(" + x + ", " + y + ")";
```

`Point(int x, int y)` と書くかわりに、`Point(var x, var y)` とすれば、`x`・`y` の型（`int`）は、レコードの定義から推論されます。
コンポーネントが多いときや、型が長いときに、すっきり書けます。

---

## なぜレコードパターンが便利なのか

レコードパターンは、第27章で学ぶ**シールドクラス**と組み合わさると、真価を発揮します。
「いくつかの種類のデータ（図形・イベントなど）を、`switch` で見分けて、それぞれの中身に応じて処理する」――
そんな処理を、**型の判定・中身の取り出し・分岐**を、すべて1つの `switch` にまとめて、安全に書けるようになります。

```java
double area = switch (shape) {
    case Circle(double r)              -> r * r * 3.14;
    case Rectangle(double w, double h) -> w * h;
    case Triangle(double b, double h)  -> b * h / 2;
};
```

「円なら半径を、長方形なら幅と高さを取り出して、面積を計算する」が、流れるように書けています。
これが、モダン Java が目指す、「**データと、それに対する処理を、簡潔かつ安全に書く**」スタイルです。
（このコードが `default` なしで書ける理由は、次の第27章「シールドクラス」で明らかになります。）

---

## まとめ

- **レコードパターン**は、レコードの**中身を分解して取り出す**パターン
- `case Point(int x, int y) ->` で、`x`・`y` を直接使える（`p.x()` 不要）
- **ネストしたレコード**も、`case Line(Point(...), Point(...))` のように、まとめて分解できる
- 中の型は **`var`** で省略できる（`Point(var x, var y)`）
- シールドクラス（第27章）と組み合わせると、型による安全な分岐が完成する

次の節では、条件つきのパターン（`when` ガード）と、網羅性のチェックを学びます。

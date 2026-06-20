---
title: シールドクラスとパターンマッチング
llm: true
---

## シールドクラスとパターンマッチング

この節は、第27章のハイライトです。
シールドクラス（種類を限定する）と、第26章のパターンマッチング（型で分岐する）を組み合わせると、「**決まった種類のデータを、もれなく安全に処理する**」という、強力な設計が完成します。

---

## 題材 ― シールドな図形

第2節で作った、シールドな図形を使います。

```java
sealed interface Shape permits Circle, Rectangle, Triangle {}

record Circle(double radius) implements Shape {}
record Rectangle(double width, double height) implements Shape {}
record Triangle(double base, double height) implements Shape {}
```

`Shape` は、円・長方形・三角形の**3種類だけ**。
これを、`switch` のパターンマッチング（第26章）で処理してみましょう。

---

## default なしで、網羅できる

「図形に応じて、面積を計算する」処理を、`switch` で書きます。

```java
static double area(Shape shape) {
    return switch (shape) {
        case Circle(double r)              -> r * r * 3.14;
        case Rectangle(double w, double h) -> w * h;
        case Triangle(double b, double h)  -> b * h / 2;
        // default が、いらない！
    };
}

IO.println(area(new Circle(10)));
IO.println(area(new Rectangle(4, 5)));
IO.println(area(new Triangle(6, 8)));
```

```text
314.0
20.0
24.0
```

注目してほしいのは、**`default` がない**ことです。それでもコンパイルが通ります。

なぜでしょうか。
`Shape` が `sealed` で「円・長方形・三角形の3つだけ」と限定されているので、コンパイラは「**この3つを処理すれば、すべてのケースをカバーできる**」と分かります。
だから、`default`（それ以外）が不要なのです。

第18章の「enum の switch は、全定数を網羅すれば `default` 不要」と、まったく同じ理屈です。
シールドクラスは、型の世界に、その「網羅できる」性質をもたらすのです。

---

## 種類を追加すると、もれを教えてくれる

`default` がないことの、本当のうれしさは、ここからです。

いま、4つ目の図形 `Hexagon`（六角形）を追加したとします。

```java
sealed interface Shape permits Circle, Rectangle, Triangle, Hexagon {}  // 追加
record Hexagon(double side) implements Shape {}                          // 追加
```

すると、さきほどの `area` メソッドの `switch` は、**コンパイルエラー**になります。

```text
エラー: switch式がすべての可能な入力値をカバーしていません
```

「`Hexagon` の場合が、処理されていませんよ」と、コンパイラが教えてくれるのです。
「新しい種類を追加したのに、対応するコードを書き忘れた」という、もっとも起きやすいバグを、**動かす前に、確実に防げます**。

もし `default` を書いていたら、`Hexagon` は `default` に吸収され、このエラーは出ません。
「もれを見つけてほしい」からこそ、`default` を書かずに、すべての `case` を並べるのです。
（このありがたさは、第18章の enum の switch でも学んだとおりです。）

---

## レコード・パターン・シールドの三位一体

ここで、第3部の3つの機能が、きれいに組み合わさっていることに気づきます。

| 機能 | 役割 | この例では |
|---|---|---|
| **レコード**（第17章） | データを束ねる | `Circle(double radius)` など |
| **シールドクラス**（第27章） | 種類を限定する | `sealed ... permits Circle, ...` |
| **パターンマッチング**（第26章） | 型で分岐し、中身を取り出す | `case Circle(double r) ->` |

- **レコード**で、各図形の「データ」を簡潔に定義し、
- **シールドクラス**で、図形の「種類」を限定し、
- **パターンマッチング**で、種類ごとに「処理」を分ける。

この3つが組み合わさることで、「**決まった種類のデータを、もれなく、安全に、簡潔に処理する**」という設計が完成します。
これは「**データ指向プログラミング**（Data-Oriented Programming）」と呼ばれる、モダン Java の重要なスタイルです。
継承とオーバーライド（第14〜15章）とはまた違う、データを中心にした、新しい設計の選択肢です。

---

## まとめ

- シールドクラスを `switch` でマッチすると、**全種類を挙げれば `default` 不要**（網羅できる）
- 種類を追加して `case` を書き忘れると、**コンパイルエラー**で教えてくれる（もれ防止）
- だからこそ、もれを見つけるために、`default` を書かず全 `case` を並べる
- **レコード（データ）＋ シールドクラス（種類）＋ パターンマッチング（分岐）** の組み合わせが強力
- この設計を「**データ指向プログラミング**」と呼ぶ

次の節では、シールドクラスでつまずきやすいポイントを、まとめて確認します。

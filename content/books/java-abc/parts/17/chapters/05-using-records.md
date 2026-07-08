---
title: レコードの使いどころ
llm: true
co-author: ["Claude Opus 4.7"]
---

## レコードの使いどころ

レコードは便利ですが、何にでも使えるわけではありません。
この節では、「レコードが向く場面・向かない場面」と、いくつかの性質を整理します。

---

## レコードはインターフェースを実装できる

レコードは、クラスを**継承することはできません**（くわしくは次の節）。
しかし、**インターフェースを実装することはできます**。

第16章で学んだ `Shape` インターフェースを、レコードで実装してみましょう。

```java
interface Shape {
    double area();
}

record Circle(double radius) implements Shape {
    @Override
    public double area() {
        return radius * radius * 3.14;
    }
}

record Rectangle(double width, double height) implements Shape {
    @Override
    public double area() {
        return width * height;
    }
}

public class Main {
    public static void main(String[] args) {
        Shape[] shapes = { new Circle(10), new Rectangle(4, 5) };
        for (Shape s : shapes) {
            IO.println("面積: " + s.area());
        }
    }
}
```

```text line-numbers=false
$ java Main.java
面積: 314.0
面積: 20.0
```

`record Circle(double radius) implements Shape` のように、`implements` を付けられます。
第16章では、`Circle` を `class` で書き、コンストラクタやフィールドを自分で用意しました。
レコードなら、それらが自動で用意されるので、`area()` の実装だけに集中できます。
「データを束ね、かつ、ある約束（インターフェース）を果たす」型を、すっきり書けるのです。

---

## レコードが向く場面

レコードは、次のような場面に向いています。

- **値そのものを表すデータ**（座標、金額、色、期間など） … 「中身が同じなら等しい」と扱いたいもの
- **データの受け渡し** … 処理から処理へ、複数の値をまとめて運ぶ
- **複数の値をまとめて返す** … メソッドが、2つ以上の結果を返したいとき

最後の「複数の値を返す」は、地味ですが便利です。
メソッドは値を1つしか返せませんが、レコードに包めば、実質的に複数の値を返せます。

```java
record MinMax(int min, int max) {}

static MinMax findMinMax(int[] nums) {
    int min = nums[0];
    int max = nums[0];
    for (int n : nums) {
        if (n < min) min = n;
        if (n > max) max = n;
    }
    return new MinMax(min, max);   // 最小値と最大値を、まとめて返す
}

public class Main {
    public static void main(String[] args) {
        MinMax result = findMinMax(new int[]{3, 1, 4, 1, 5, 9, 2});
        IO.println("最小: " + result.min() + " / 最大: " + result.max());
    }
}
```

```text line-numbers=false
$ java Main.java
最小: 1 / 最大: 9
```

「最小値と最大値」を、`MinMax` レコードに包んで、1つの戻り値として返せました。
わざわざ専用のクラスを作るほどでもない、こうした「ちょっとしたデータのまとまり」に、レコードは最適です。

---

## レコードが向かない場面

逆に、次のような場面では、レコードではなく、ふつうのクラスを使います。

- **途中で状態が変わるオブジェクト** … レコードは不変なので、変化する状態（ゲームのキャラクターの体力など）には向かない
- **複雑なふるまいが中心のクラス** … データより処理が主役のもの
- **クラスを継承して作りたいもの** … レコードはクラスを継承できない

ひとことで言えば、「**変化せず、中身（値）が主役のデータ**」にはレコード、「**変化する状態や、ふるまいが主役のもの**」にはクラス、と使い分けます。

---

## まとめ

- レコードは、クラスを継承できないが、**インターフェースは実装できる**
- 向く場面: **値を表すデータ**（座標・金額など）、**データの受け渡し**、**複数の値をまとめて返す**
- 向かない場面: **状態が変化するもの**、**ふるまいが主役のもの**、**継承したいもの**
- 「**変化せず、値が主役のデータ**」にレコード、「**変化や、ふるまいが主役**」にクラス

次の節では、レコードでつまずきやすいポイントを、まとめて確認します。

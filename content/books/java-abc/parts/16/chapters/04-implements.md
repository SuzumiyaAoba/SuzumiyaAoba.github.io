---
title: implements で実装する
llm: true
---

## implements で実装する

インターフェースは「約束」でした。
この節では、その約束を、具体的なクラスが**果たす**（実装する）方法を学びます。
キーワードは **`implements`**（インプリメンツ、実装する）です。

---

## implements で約束を果たす

クラス宣言に **`implements インターフェース名`** を付けると、「このクラスは、その約束を実装します」という宣言になります。
そして、約束されたメソッド（`area()`）を、**実際に中身を書いて**実装します。

`Shape` を実装した `Circle`（円）と `Rectangle`（長方形）を作ってみましょう。

```java
interface Shape {
    double area();
}

class Circle implements Shape {     // Shape を実装する
    double radius;
    Circle(double radius) { this.radius = radius; }

    @Override
    public double area() {           // 約束を果たす（円の面積）
        return radius * radius * 3.14;
    }
}

class Rectangle implements Shape {  // Shape を実装する
    double width;
    double height;
    Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }

    @Override
    public double area() {           // 約束を果たす（長方形の面積）
        return width * height;
    }
}
```

`Circle` も `Rectangle` も、`implements Shape` と宣言し、それぞれの `area()` を実装しています。
円は「半径 × 半径 × 円周率」、長方形は「幅 × 高さ」と、計算方法は違いますが、どちらも「`area()` で面積を返す」という約束は守っています。

![インターフェースの実装。Shape インターフェースは area() という約束だけを定め、Circle と Rectangle が implements でそれを実装する。Circle は半径×半径×3.14、Rectangle は幅×高さで面積を計算する。両者は継承関係になくても、同じ Shape として扱える。](./images/interface-implements.svg)

> **補足: 実装するメソッドは `public` にする**
>
> インターフェースのメソッドは `public` の約束なので、実装する側のメソッドも **`public`** にする必要があります。
> `public` を付け忘れると、「公開範囲を狭めている」とみなされ、エラーになります。
> オーバーライドと同じく、`@Override` を付けておくと、実装し忘れやミスを防げます。

---

## まとめて扱う ―― 継承がなくても

実装したクラスは、**インターフェースの型でまとめて扱えます**。
第15章のポリモーフィズムが、インターフェースでも働くのです。

```java
public class Main {
    public static void main(String[] args) {
        Shape[] shapes = {
            new Circle(10),
            new Rectangle(4, 5)
        };

        for (Shape s : shapes) {
            IO.println("面積: " + s.area());
        }
    }
}
```

```text
$ java Main.java
面積: 314.0
面積: 20.0
```

`Shape[]` という配列に、`Circle` と `Rectangle` をまとめて入れ、`s.area()` を呼ぶだけで、それぞれの面積が計算されました。
ここで大切なのは、`Circle` と `Rectangle` は、**継承関係にない**（共通の親クラスを持たない）ことです。
それでも、同じ `Shape` を実装しているので、`Shape` として一緒に扱えました。
インターフェースは、「親子関係がなくても、共通の約束でまとめる」ことを可能にするのです。

---

## 1つのクラスが、複数のインターフェースを実装できる

クラスの継承（`extends`）は、**1つの親クラス**しか持てません（単一継承）。
一方、インターフェースの実装（`implements`）は、**いくつでも**できます。
これは、インターフェースの大きな利点です。

```java
interface Drawable {   // 描画できる、という約束
    void draw();
}

interface Savable {    // 保存できる、という約束
    void save();
}

// Document は、2つの約束を両方とも実装する
class Document implements Drawable, Savable {
    @Override
    public void draw() { IO.println("画面に表示する"); }

    @Override
    public void save() { IO.println("ファイルに保存する"); }
}

public class Main {
    public static void main(String[] args) {
        Document doc = new Document();
        doc.draw();
        doc.save();
    }
}
```

```text
$ java Main.java
画面に表示する
ファイルに保存する
```

`Document` は、`Drawable`（描画できる）と `Savable`（保存できる）の、**2つの約束を同時に**実装しています。
`implements` のうしろに、カンマ区切りでインターフェースを並べるだけです。

これにより、「描画もできて、保存もできるもの」のように、**複数の能力を組み合わせた**クラスを作れます。
クラスは「何であるか」を1つ（`extends`）、インターフェースは「何ができるか」をいくつでも（`implements`） ―― この組み合わせが、柔軟な設計を可能にします。

---

## まとめ

- **`implements インターフェース名`** で、約束を実装すると宣言する
- 約束されたメソッドを、`public` で実装する（`@Override` を付けるとよい）
- 実装したクラスは、**インターフェースの型でまとめて扱える**（継承関係がなくても）
- クラスの継承（`extends`）は1つだけだが、インターフェースの実装（`implements`）は**複数**できる
- 「何であるか」は `extends` で1つ、「何ができるか」は `implements` でいくつでも

次の節では、インターフェースに共通の実装を持たせる**デフォルトメソッド**を学びます。

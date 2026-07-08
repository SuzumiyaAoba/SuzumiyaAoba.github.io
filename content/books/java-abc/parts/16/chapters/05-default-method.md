---
title: デフォルトメソッド ― インターフェースに実装を持たせる
llm: true
co-author: ["Claude Opus 4.7"]
---

## デフォルトメソッド ― インターフェースに実装を持たせる

これまで、インターフェースのメソッドは「中身のない約束」だけでした。
ですが、Java 8 以降、インターフェースにも**中身のあるメソッド**を持たせられるようになりました。
それが **デフォルトメソッド**（Default Method）です[^jep126-default-methods]。

---

## default で、共通の実装を用意する

メソッドに **`default`** を付けると、インターフェースの中に**中身（実装）**を書けます。

例として、`Shape` に「図形の説明を表示する `describe()`」を、デフォルトメソッドとして加えてみましょう。

```java
interface Shape {
    double area();                   // 約束（中身なし）

    default void describe() {        // デフォルトメソッド（中身あり）
        IO.println("この図形の面積は " + area() + " です");
    }
}
```

`describe()` には中身があります。
そして、その中で `area()`（中身のない約束のメソッド）を呼んでいます。
「`area()` がどう実装されるかは知らないが、実装される以上、それを使って `describe()` は書ける」というわけです。

---

## デフォルトメソッドは、実装しなくてよい

デフォルトメソッドは、すでに中身があるので、実装する側のクラスで**書かなくてもそのまま使えます**。

```java
interface Shape {
    double area();
    default void describe() {
        IO.println("この図形の面積は " + area() + " です");
    }
}

class Circle implements Shape {
    double radius;
    Circle(double radius) { this.radius = radius; }
    @Override
    public double area() { return radius * radius * 3.14; }
    // describe() は実装していない（デフォルトをそのまま使う）
}

public class Main {
    public static void main(String[] args) {
        Circle c = new Circle(10);
        c.describe();          // インターフェースのデフォルトメソッドが使われる
    }
}
```

```text line-numbers=false
$ java Main.java
この図形の面積は 314.0 です
```

`Circle` は `area()` だけを実装し、`describe()` は書いていません。
それでも `c.describe()` が呼べて、インターフェースに用意されたデフォルトの中身が動きました。
このように、「**約束（abstract）は実装を強制し、デフォルト（default）は共通の実装を提供する**」と、使い分けられます。

---

## 必要なら、オーバーライドもできる

デフォルトメソッドは、あくまで「標準の実装」です。
実装するクラスで、必要に応じて**オーバーライド**して、独自のふるまいに変えることもできます。

```java
class Rectangle implements Shape {
    double width, height;
    Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }
    @Override
    public double area() { return width * height; }

    @Override
    public void describe() {           // デフォルトを上書きする
        IO.println("長方形（" + width + "×" + height + "）の面積は " + area() + " です");
    }
}
```

`Rectangle` は `describe()` をオーバーライドしたので、`Rectangle` では独自のメッセージが表示されます。
`describe()` を書かなかった `Circle` は、デフォルトのメッセージのまま ―― このように、「標準は用意するが、必要なら変えられる」という柔軟さが得られます。

---

## デフォルトメソッドは、なぜ生まれたのか

デフォルトメソッドが導入された大きな理由は、「**既存のインターフェースに、後からメソッドを追加できるようにする**」ためです。

もし、中身のない約束しか書けないと、インターフェースにメソッドを1つ追加するたびに、それを実装している**すべてのクラス**を直さなければなりません。
利用者が多いインターフェースでは、これは大問題です。

デフォルトメソッドなら、中身つきで追加できるので、既存の実装クラスを**1つも壊さずに**、新しいメソッドを足せます。
実際、Java の標準ライブラリでも、この目的でデフォルトメソッドが活用されています（第3部のコレクションやストリームで、その恩恵を受けることになります）。

> **補足: インターフェースが「実装」を持つ意味**
>
> デフォルトメソッドの登場で、インターフェースは「純粋な約束」だけでなく、「共通の実装」も持てるようになりました。
> このため、「抽象クラスとインターフェースの違いは何か」が、以前より曖昧になっています。
> とはいえ、大きな違い ―― **インターフェースは状態（フィールド）を基本的に持てず、複数実装できる** ―― は変わりません。
> 使い分けの考え方は、次の節で整理します。

---

## まとめ

- **デフォルトメソッド**は、`default` を付けて、インターフェースに**中身のあるメソッド**を書くしくみ（Java 8+）
- デフォルトメソッドは、実装クラスで**書かなくてもそのまま使える**
- 必要なら、実装クラスで**オーバーライド**して独自のふるまいにできる
- 目的は、「**既存の実装を壊さずに、インターフェースにメソッドを追加する**」こと

次の節では、抽象クラスとインターフェースを、どう使い分けるかを整理します。

[^jep126-default-methods]: JEP 126: Lambda Expressions & Virtual Extension Methods, [https://openjdk.org/jeps/126](<https://openjdk.org/jeps/126>)。Java 8（2014年3月）でラムダ式と共に導入された機能で、インターフェースの後方互換的な拡張を可能にする。詳細は *JLS §9.4*（[https://docs.oracle.com/javase/specs/jls/se25/html/jls-9.html#jls-9.4](<https://docs.oracle.com/javase/specs/jls/se25/html/jls-9.html#jls-9.4>)）参照。

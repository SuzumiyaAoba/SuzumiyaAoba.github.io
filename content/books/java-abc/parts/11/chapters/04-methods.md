---
title: メソッドを定義する ― オブジェクトのふるまい
llm: true
co-author: ["Claude Opus 4.7"]
---

## メソッドを定義する ― オブジェクトのふるまい

ここまでの `Car` クラスは、「名前」「速度」というデータ（フィールド）を持つだけでした。
この節では、車に**ふるまい（操作）**を持たせます。たとえば「加速する」「状態を表示する」といった動作です。

オブジェクトのふるまいは、クラスの中に**メソッド**を書いて表します。

---

## メソッドをクラスの中に書く

メソッドの書き方そのものは、第9章で学んだとおりです。
違うのは、**クラスの中（フィールドと並べて）に書く**という点です。

`Car` クラスに、加速する `accelerate` メソッドと、状態を表示する `show` メソッドを加えてみましょう。

```java
class Car {
    String name;
    int speed;

    void accelerate(int delta) {
        speed = speed + delta;   // 自分の speed を増やす
    }

    void show() {
        IO.println(name + " の速度: " + speed + " km/h");
    }
}
```

注目してほしいのは、メソッドの中で **`speed` や `name` を、そのまま使えている**ことです。
`accelerate` の中の `speed` は、**そのオブジェクト自身のフィールド `speed`** を指します。
メソッドは、自分が属するオブジェクトのフィールドに、自由にアクセスできるのです。

これが、「データ（フィールド）と、そのデータを扱う処理（メソッド）を、1つにまとめる」ということの正体です。
`accelerate` は、わざわざ速度を引数で受け取らなくても、自分の `speed` を直接増やせます。

---

## メソッドを呼び出す

オブジェクトのメソッドも、フィールドと同じく **`.`（ドット）** で呼び出します。
`オブジェクト.メソッド名(引数)` という形です。

完全なプログラムで動かしてみましょう。

```java
class Car {
    String name;
    int speed;

    void accelerate(int delta) {
        speed = speed + delta;
    }

    void show() {
        IO.println(name + " の速度: " + speed + " km/h");
    }
}

void main() {
    Car myCar = new Car();
    myCar.name = "プリウス";

    myCar.accelerate(50);   // 50 加速する
    myCar.accelerate(30);   // さらに 30 加速する
    myCar.show();           // 状態を表示する
}
```

```text line-numbers=false
$ java CarApp.java
プリウス の速度: 80 km/h
```

`accelerate(50)` で `speed` が `0` → `50`、`accelerate(30)` で `50` → `80` と増え、最後に `show()` で表示されました。
`myCar.accelerate(...)` は「`myCar` に加速してもらう」、`myCar.show()` は「`myCar` に状態を表示してもらう」と読めます。

---

## 「もの」に動詞で語りかける

オブジェクト指向のコードは、「**もの（オブジェクト）に、お願いする**」ように読めます。

```java
myCar.accelerate(50);   // myCar に「50 加速して」とお願いする
myCar.show();           // myCar に「状態を見せて」とお願いする
```

第1部までは、「`System.out.println(...)` を実行する」のように、処理を**手続き**として並べてきました。
オブジェクト指向では、「`myCar` に `accelerate` してもらう」のように、**もの中心**で考えます。

この「もの中心」の考え方は、プログラムが大きくなったときに効いてきます。
「車のことは `Car` クラスに」「注文のことは `Order` クラスに」と、**関係するデータと処理を1か所にまとめておける**ので、どこに何があるかが分かりやすくなるのです。

---

## 戻り値のあるメソッド

メソッドは、第9章で学んだとおり、**値を返す**こともできます。
たとえば「速度が制限速度を超えているか」を判定する `isOverLimit` メソッドを加えてみましょう。

```java
class Car {
    String name;
    int speed;

    void accelerate(int delta) {
        speed = speed + delta;
    }

    boolean isOverLimit(int limit) {
        return speed > limit;
    }
}

void main() {
    Car myCar = new Car();
    myCar.accelerate(120);

    if (myCar.isOverLimit(100)) {
        IO.println("速度超過です");
    } else {
        IO.println("制限内です");
    }
}
```

```text line-numbers=false
$ java CarApp.java
速度超過です
```

`isOverLimit` は `boolean` を返すので、`if` の条件にそのまま書けます。
このように、オブジェクトのメソッドも、第9章で学んだメソッドの性質（引数・戻り値）を、すべてそのまま持っています。
違うのは「クラスの中にあり、自分のフィールドを直接使える」ことだけです。

---

## まとめ

- オブジェクトの**ふるまい**は、クラスの中に**メソッド**を書いて表す
- メソッドの中からは、**そのオブジェクト自身のフィールド**を、名前だけで直接使える
- メソッドの呼び出しは **`オブジェクト.メソッド名(引数)`**
- オブジェクト指向のコードは「**ものに、お願いする**」ように読める（もの中心の考え方）
- メソッドは、第9章どおり引数や戻り値を持てる（`boolean` を返して `if` に使う、など）

次の節では、メソッドの中で「自分自身」を明示する **`this`** を学びます。

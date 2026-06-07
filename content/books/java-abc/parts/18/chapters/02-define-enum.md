---
title: enum を定義する
llm: true
---

## enum を定義する

それでは、列挙型を実際に定義して、使ってみましょう。

---

## 基本の書き方

列挙型は、**`enum`** というキーワードで定義し、`{ }` の中に、取りうる値を**カンマ区切り**で並べます。

```java
enum Signal {
    RED, YELLOW, GREEN
}
```

これで、`Signal` という列挙型ができました。
`RED`・`YELLOW`・`GREEN` を、**列挙定数**（または列挙子）と呼びます。

> **慣習: 列挙定数は、すべて大文字**
>
> 列挙定数は、第4章で学んだ定数と同じく、**すべて大文字**で書くのが慣習です（`RED`、`YELLOW`）。
> 単語が複数あるときは、`OUT_OF_STOCK` のように `_` でつなぎます。
> これは「定数（変わらない、決まった値）」であることを表す、お決まりの書き方です。

---

## 列挙型の値を使う

列挙定数は、**`列挙型名.定数名`** の形で使います（`Signal.RED` など）。

```java
enum Signal {
    RED, YELLOW, GREEN
}

public class Main {
    public static void main(String[] args) {
        Signal signal = Signal.RED;   // RED を代入
        IO.println(signal);
    }
}
```

```text
$ java Main.java
RED
```

`IO.println(signal)` で、`RED` と表示されました。
列挙定数は、`toString` が自動的に「定数の名前」を返してくれるので、そのまま表示すると、定義した名前が出ます。

---

## 列挙型は == で比較できる

第10章で、「文字列の比較は `==` ではなく `equals`」と、強く注意しました。
ですが、**列挙型は `==` で比較してかまいません**。むしろ、`==` が推奨されます。

```java
Signal signal = Signal.RED;

if (signal == Signal.RED) {       // == で比較してOK
    IO.println("止まれ");
}
```

```text
止まれ
```

なぜ列挙型は `==` でよいのでしょうか。
それは、列挙定数は、それぞれ**世界に1つだけ**しか存在しないからです。
`Signal.RED` は、プログラムのどこで使っても、つねに**同じ1つのオブジェクト**を指します。
そのため、「同じものか」を見る `==` で比べても、正しく判定できるのです（しかも、`null` でも安全に比較できます）。

「文字列は `equals`、列挙型は `==`」と、対にして覚えておきましょう。

---

## 状態を表すのに使う

列挙型は、「いまの状態」を表すのによく使われます。
たとえば、注文の状態を表す `OrderStatus` を考えてみましょう。

```java
enum OrderStatus {
    RECEIVED,   // 受付
    SHIPPED,    // 発送
    DELIVERED   // 配達完了
}

public class Main {
    public static void main(String[] args) {
        OrderStatus status = OrderStatus.SHIPPED;

        if (status == OrderStatus.SHIPPED) {
            IO.println("商品は発送済みです");
        }
    }
}
```

```text
$ java Main.java
商品は発送済みです
```

`status` には、`RECEIVED`・`SHIPPED`・`DELIVERED` の3つしか入りません。
「`SHIPED`（打ち間違い）」や「`CANCELLED`（未定義）」のような値は、コンパイルエラーになるので、安心して状態を扱えます。

---

## まとめ

- 列挙型は **`enum 名前 { 定数, 定数, ... }`** で定義する
- `{ }` の中の値を**列挙定数**と呼ぶ。慣習として**すべて大文字**で書く
- 列挙定数は **`列挙型名.定数名`**（`Signal.RED`）の形で使う
- 列挙型は、**`==` で比較してよい**（各定数は世界に1つだけなので。`null` でも安全）
- 「いまの状態」を表すのに、よく使われる

次の節では、列挙型と相性のよい **switch** を学びます。

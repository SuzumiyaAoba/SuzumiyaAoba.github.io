---
title: extends でクラスを継承する
llm: true
co-author: ["Claude Opus 4.7"]
---

## extends でクラスを継承する

前の節で、継承の考え方をつかみました。
この節では、`extends`（エクステンズ）を使って、実際に継承するクラスを書き、動かしてみます。

---

## extends の書き方

子クラスを定義するときに、クラス名のうしろに **`extends 親クラス名`** を付けます。

```java
class 子クラス名 extends 親クラス名 {
    // 子クラス独自のフィールドやメソッド
}
```

`extends` は「拡張する」という意味です。
「親クラスを土台にして、それを拡張（=機能を追加）した子クラスを作る」というイメージです。

`Animal` を継承する `Dog` を書いてみましょう。

```java
class Animal {
    String name;
    void eat() {
        IO.println(name + " はごはんを食べる");
    }
}

class Dog extends Animal {     // Animal を継承
    void cry() {               // Dog 独自のメソッドを追加
        IO.println(name + ": ワン");
    }
}
```

`Dog` には、`name` フィールドも `eat()` メソッドも書いていません。
それでも、`Animal` を継承しているので、`Dog` は `name` と `eat()` を**受け継いで持っています**。
そのうえで、`Dog` 独自の `cry()` を追加しています。

---

## 受け継いだものを使う

`Dog` のオブジェクトを作って、継承したものと独自のものの両方を使ってみましょう。

```java
class Animal {
    String name;
    void eat() { IO.println(name + " はごはんを食べる"); }
}

class Dog extends Animal {
    void cry() { IO.println(name + ": ワン"); }
}

public class Main {
    public static void main(String[] args) {
        Dog dog = new Dog();
        dog.name = "ポチ";    // Animal から継承した name
        dog.eat();            // Animal から継承した eat()
        dog.cry();            // Dog 独自の cry()
    }
}
```

```text
$ java Main.java
ポチ はごはんを食べる
ポチ: ワン
```

`dog.name` も `dog.eat()` も、`Dog` には書いていないのに使えました。
これらは `Animal` から受け継いだものだからです。
`Dog` のオブジェクトは、「`Animal` から受け継いだもの」＋「`Dog` 自身のもの」を、**あわせて持っている**のです。

---

## 子クラスは「親＋α」

継承のイメージは、「**親の機能をすべて持ったうえで、さらに自分の機能を足したもの**」です。

```text
Animal（親）         が持つもの:  name, eat()
Dog（子）が持つもの:  name, eat()（継承）  +  cry()（独自）
```

`Dog` は `Animal` の機能を**すべて**持っているので、`Animal` にできることは、`Dog` にもすべてできます。
そのうえで、`Dog` だけの機能（`cry()`）が加わっています。
だから `Dog` は「`Animal` の一種であり、かつ、それ以上のもの」と言えるのです。これが、前の節の「is-a」の関係です。

`Cat` も、同じように `Animal` を継承して作れます。

```java
class Cat extends Animal {
    void cry() { IO.println(name + ": ニャー"); }
}
```

`Dog` と `Cat` は、`name` と `eat()` という共通部分を `Animal` から受け継ぎ、それぞれの `cry()` だけが違う ―― 共通部分を1か所にまとめる、という継承の目的が実現できました。

---

## private なものは継承されない（アクセスの注意）

1つ、注意点があります。
親クラスの `private` なフィールド・メソッドは、子クラスから**直接はアクセスできません**。
`private` は「同じクラスの中だけ」でしたね（第12章）。子クラスは別のクラスなので、親の `private` には手が届かないのです。

```java
class Animal {
    private int age;          // private

    void birthday() {
        age++;                // 同じ Animal の中なので OK
    }
}

class Dog extends Animal {
    void show() {
        IO.println(age);      // ✕ 親の private には直接アクセスできない（エラー）
    }
}
```

子クラスから親のデータを扱いたいときは、親に `public`（または後述の `protected`）なメソッド（ゲッターなど）を用意し、それを通してアクセスします。
「継承しても、`private` の壁は越えられない」と覚えておきましょう。

> **補足: protected ― 子クラスには見せる**
>
> 第12章で少し触れた `protected` は、まさにこの場面のための修飾子です。
> フィールドやメソッドを `protected` にすると、「外からは隠すが、**子クラスからはアクセスできる**」ようになります。
> 「子クラスには使わせたいが、無関係な外部には見せたくない」ものに使います。
> ただし、安易に `protected` を多用すると、カプセル化が弱まります。まずは `private` を基本にし、必要なときだけ `protected` を検討しましょう。

---

## まとめ

- **`extends 親クラス名`** で、親クラスを継承した子クラスを作る
- 子クラスは、親の（`private` でない）フィールド・メソッドを**受け継いで持つ**
- 子クラスは「**親の機能すべて ＋ 自分独自の機能**」を持つ
- 親の **`private`** なメンバには、子クラスから直接アクセスできない
- 子クラスにだけ見せたいものは **`protected`** にする（多用は避ける）

次の節では、受け継いだメソッドを、子クラスで作り直す**オーバーライド**を学びます。

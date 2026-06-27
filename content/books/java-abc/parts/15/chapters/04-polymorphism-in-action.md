---
title: まとめて扱う ― 配列とメソッド引数
llm: true
co-author: ["Claude Opus 4.7"]
---

## まとめて扱う ― 配列とメソッド引数

ポリモーフィズムの本当のうれしさは、**たくさんの種類のオブジェクトを、まとめて扱える**ことです。
この節では、配列とメソッドの引数を使って、それを体験します。

---

## 配列で、いろいろな動物をまとめる

第8章で学んだ配列に、`Animal` 型の配列を作ってみましょう。
`Animal` 型の配列には、`Dog` でも `Cat` でも入れられます（アップキャスト）。

```java
class Animal {
    String name;
    void cry() { IO.println(name + ": （動物の鳴き声）"); }
}
class Dog extends Animal {
    @Override void cry() { IO.println(name + ": ワン"); }
}
class Cat extends Animal {
    @Override void cry() { IO.println(name + ": ニャー"); }
}

public class Main {
    public static void main(String[] args) {
        Animal[] animals = new Animal[3];   // Animal の配列
        animals[0] = new Dog();
        animals[1] = new Cat();
        animals[2] = new Dog();
        animals[0].name = "ポチ";
        animals[1].name = "タマ";
        animals[2].name = "シロ";

        // 全員に「鳴いて」とお願いする
        for (Animal a : animals) {
            a.cry();
        }
    }
}
```

```text
$ java Main.java
ポチ: ワン
タマ: ニャー
シロ: ワン
```

ここが、ポリモーフィズムの真骨頂です。
`for` ループの中は、`a.cry()` の**1行だけ**。
「`a` が `Dog` か `Cat` か」を、まったく気にしていません。
それでも、動的束縛のおかげで、中身に応じて「ワン」「ニャー」と、正しく鳴き分けてくれました。

もし、ポリモーフィズムがなかったら、ループの中で「もし犬なら…、もし猫なら…」と、種類ごとに分岐する必要がありました。
ポリモーフィズムは、その分岐を**まるごと不要に**してくれるのです。

---

## メソッドの引数でも、まとめて扱える

メソッドの引数を `Animal` 型にすると、`Dog` でも `Cat` でも受け取れます。

```java
// Animal を受け取るので、Dog でも Cat でも渡せる
static void makeItCry(Animal a) {
    a.cry();
}

public class Main {
    public static void main(String[] args) {
        Dog dog = new Dog(); dog.name = "ポチ";
        Cat cat = new Cat(); cat.name = "タマ";

        makeItCry(dog);   // Dog を渡す
        makeItCry(cat);   // Cat を渡す
    }
}
```

```text
$ java Main.java
ポチ: ワン
タマ: ニャー
```

`makeItCry` は、引数を `Animal` 型で受けるので、「動物なら何でも」渡せます。
`Dog` を渡せば「ワン」、`Cat` を渡せば「ニャー」。`makeItCry` 自身は、相手の種類をまったく知らなくてよいのです。

---

## 変更に強い ― 新しい動物を追加してみる

ポリモーフィズムの最大の利点は、「**新しい種類を追加しても、使う側を変えなくてよい**」ことです。

新しく `Bird`（鳥）を追加してみましょう。

```java
class Bird extends Animal {
    @Override void cry() { IO.println(name + ": ピヨ"); }
}
```

`Bird` を、先ほどの配列に追加すると…

```java
Animal[] animals = { new Dog(), new Cat(), new Bird() };
animals[0].name = "ポチ";
animals[1].name = "タマ";
animals[2].name = "ピー";

for (Animal a : animals) {
    a.cry();
}
```

```text
ポチ: ワン
タマ: ニャー
ピー: ピヨ
```

注目してほしいのは、**ループの部分（`for ... a.cry()`）は1行も変えていない**ことです。
`Bird` クラスを新しく作っただけで、「全員に鳴いてもらう」処理は、そのまま `Bird` にも対応できました。

これが、「**種類が増えても、変更に強い**」ということです。
もし種類ごとに `if` で分岐していたら、`Bird` を追加するたびに、その分岐も増やさなければなりませんでした。
ポリモーフィズムを使えば、**新しい種類を「足す」だけで済み、既存のコードはさわらずにすむ**のです。これは、大きなプログラムを安全に育てるうえで、非常に重要な性質です。

---

## まとめ

- `Animal` 型の配列には、`Dog` でも `Cat` でも入れられる（アップキャスト）
- 配列をループして `a.cry()` を呼ぶだけで、**中身に応じた鳴き声**が出る（動的束縛）。種類ごとの分岐が不要
- メソッドの引数を `Animal` 型にすると、`Dog` でも `Cat` でも受け取れる
- **新しい種類（`Bird`）を追加しても、まとめて扱う側のコードは変えなくてよい**（変更に強い）
- これが、ポリモーフィズムが「大きなプログラムをすっきり保つ」と言われる理由

次の節では、まとめて扱ったオブジェクトを、必要に応じて**元の型に戻す** `instanceof` とダウンキャストを学びます。

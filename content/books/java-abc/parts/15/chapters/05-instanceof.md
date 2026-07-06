---
title: instanceof とダウンキャスト ― 型を調べ、元に戻す
llm: true
co-author: ["Claude Opus 4.7"]
---

## instanceof とダウンキャスト ― 型を調べ、元に戻す

ポリモーフィズムで親の型にまとめると、子だけのメソッド（`Dog` の `fetch()` など）は呼べなくなりました。
ですが、ときには「これが `Dog` なら、`Dog` として扱いたい」こともあります。
この節では、そのための **`instanceof`** と**ダウンキャスト**を学びます。

---

## instanceof ― 型を調べる

**`instanceof`**（インスタンス・オブ）は、「**そのオブジェクトが、ある型かどうか**」を調べる演算子です。
結果は `boolean`（`true` / `false`）です。

```java
Animal a = new Dog();

IO.println(a instanceof Dog);   // a の中身は Dog か？
IO.println(a instanceof Cat);   // a の中身は Cat か？
```

```text
true
false
```

`a` の**中身**は `Dog` なので、`a instanceof Dog` は `true`、`a instanceof Cat` は `false` です。
`instanceof` は、変数の型（`Animal`）ではなく、**中身の型**を調べてくれます。

---

## ダウンキャスト ― 親の型から、子の型に戻す

`instanceof` で「中身が `Dog`」と分かったら、その `Animal` を、`Dog` として扱いたくなります。
親の型のオブジェクトを、子の型として扱い直すことを、**ダウンキャスト**（Downcast）と呼びます。
クラス階層で、親（上）から子（下）へ向かうので「ダウン」です。

ダウンキャストは、`(Dog)` のように、変換したい型をかっこで囲んで書きます（第4章で学んだキャストと同じ書き方です）。

```java
Animal a = new Dog();

Dog dog = (Dog) a;   // Animal を Dog として扱い直す（ダウンキャスト）
dog.fetch();         // これで Dog 独自の fetch() が呼べる
```

ダウンキャストして `Dog` 型の変数に入れれば、`Dog` 独自の `fetch()` を呼べるようになります。

---

## ダウンキャストは危険 ― まず instanceof で確認

ただし、ダウンキャストには**危険**があります。
中身が実際には `Dog` でないのに、無理に `Dog` へダウンキャストすると、**実行時にエラー**になります。

```java
Animal a = new Cat();   // 中身は Cat
Dog dog = (Dog) a;      // Cat を Dog へ無理にキャスト
```

```text
Exception in thread "main" java.lang.ClassCastException: class Cat cannot be cast to class Dog
```

`ClassCastException`（クラスキャスト例外）は、「`Cat` を `Dog` には変換できない」という意味です。
猫を犬として扱おうとして、失敗したわけです。

このエラーを防ぐため、ダウンキャストの前には、**必ず `instanceof` で中身を確認**します。

```java
Animal a = ...;
if (a instanceof Dog) {     // 中身が Dog のときだけ
    Dog dog = (Dog) a;      // 安全にダウンキャストできる
    dog.fetch();
}
```

「確認してから変換する」 ―― これが、ダウンキャストの鉄則です。

---

## パターンマッチング ― instanceof をもっと簡潔に

「`instanceof` で確認 → ダウンキャスト → 変数に入れる」という流れは、よく使うわりに、少し冗長です。

```java
if (a instanceof Dog) {
    Dog dog = (Dog) a;      // 確認したのに、もう一度 Dog と書いている
    dog.fetch();
}
```

そこで、新しい Java では、これを**1つにまとめて**書けます。
`instanceof` の直後に変数名を書くと、**確認とダウンキャストを同時に**行えるのです。
これを **instanceof のパターンマッチング**（Pattern Matching for instanceof）と呼びます（Java 16 で正式に導入されました）[^jep394-instanceof]。

```java
if (a instanceof Dog dog) {   // 中身が Dog なら、dog という変数に入れてくれる
    dog.fetch();              // すぐ Dog として使える（キャスト不要）
}
```

`a instanceof Dog dog` は、「`a` が `Dog` なら `true`。しかも、そのとき `a` を `Dog` 型にした結果を、変数 `dog` に入れておく」という意味です。
これにより、`(Dog) a` のキャストを自分で書かなくてよくなり、コードがすっきりします。
本書では、こちらの新しい書き方をおすすめします。

動かして確かめましょう。

```java
class Animal { String name; void cry() { IO.println(name + ": ..."); } }
class Dog extends Animal { void fetch() { IO.println(name + " がボールを取ってくる"); } }
class Cat extends Animal { }

public class Main {
    public static void main(String[] args) {
        Animal[] animals = { new Dog(), new Cat() };
        animals[0].name = "ポチ";
        animals[1].name = "タマ";

        for (Animal a : animals) {
            if (a instanceof Dog dog) {     // Dog のときだけ
                dog.fetch();                // Dog 独自の処理
            } else {
                IO.println(a.name + " は犬ではありません");
            }
        }
    }
}
```

```text
$ java Main.java
ポチ がボールを取ってくる
タマ は犬ではありません
```

`Dog` のときだけ `fetch()` が呼ばれ、`Cat` のときは別の処理になりました。

> **補足: instanceof に頼りすぎない**
>
> `instanceof` で型を細かく分けるのは、便利ですが、使いすぎると「ポリモーフィズムらしさ」が失われます。
> 「もし `Dog` なら…、もし `Cat` なら…」と `instanceof` で分岐するくらいなら、その処理を**メソッドにして、各クラスでオーバーライド**するほうが、すっきりすることが多いのです（前節の `cry()` のように）。
> `instanceof` は「どうしても型ごとに違う処理が必要なとき」の最後の手段、と考えるとよいでしょう。
> （なお、`switch` でも型による分岐ができます。これは第26章「パターンマッチング」でくわしく学びます。）

---

## まとめ

- **`instanceof`** は、オブジェクトの**中身の型**を調べる演算子（結果は `boolean`）
- **ダウンキャスト** `(Dog) a` は、親の型を子の型として扱い直す
- 中身が違う型だと、ダウンキャストは **`ClassCastException`** になる。**必ず `instanceof` で確認してから**
- **パターンマッチング** `if (a instanceof Dog dog)` なら、確認とダウンキャストを一度にできる（Java 16+。おすすめ）
- `instanceof` の使いすぎは避け、まずは**オーバーライド**で解決できないか考える

次の節では、ポリモーフィズムでつまずきやすいポイントを、まとめて確認します。

[^jep394-instanceof]: JEP 394: Pattern Matching for instanceof, [https://openjdk.org/jeps/394](<https://openjdk.org/jeps/394>)。Java 16（2021年3月）で正式機能（permanent feature）となった。`if (obj instanceof String s) { ... }` のように、型チェックとバインディング変数の宣言を一度に行える。プレビュー段階は JEP 305（JDK 14）、JEP 375（JDK 15）。

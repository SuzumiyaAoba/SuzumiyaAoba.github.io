---
title: Object クラス ― すべてのクラスの先祖
llm: true
co-author: ["Claude Opus 4.7"]
---

## Object クラス ― すべてのクラスの先祖

Java には、**すべてのクラスが、必ず継承している**、特別なクラスがあります。
それが **`Object`**（オブジェクト）クラスです[^java-object-class]。
この節では、`Object` の役割と、よく使う `toString` のオーバーライドを学びます。

---

## すべてのクラスは Object を継承している

`extends` を書かずにクラスを定義すると、そのクラスは**自動的に `Object` を継承**します。

```java
class Animal {        // 実は、暗黙のうちに...
}

// 上は、次と同じ意味
class Animal extends Object {
}
```

つまり、私たちがこれまで作ってきた `Car`・`Person`・`Animal` も、すべて `Object` を継承していたのです。
そして `Dog extends Animal` のように継承した場合も、`Animal` が `Object` を継承しているので、`Dog` も先祖をたどれば `Object` にたどり着きます。

**Java のすべてのクラスは、先祖をたどると必ず `Object` に行き着く** ―― これは、Java の重要な特徴です。

```text
Object（すべての先祖）
  └─ Animal
       └─ Dog
```

`Object` には、すべてのオブジェクトに共通して必要な、基本的なメソッドが用意されています。
だから、どんなオブジェクトでも、`Object` から受け継いだ共通のメソッドを使えるのです。

---

## toString() ― オブジェクトを文字列で表す

`Object` から受け継ぐメソッドの代表が、**`toString()`** です。
これは「**そのオブジェクトを、文字列で表したもの**」を返すメソッドです。

実は、第11章でオブジェクトをそのまま表示したとき、`Car@1db9742` のような表示になったのを覚えているでしょうか。
あれは、`Object` の `toString()` が返す、標準の文字列だったのです。

```java
class Animal {
    String name;
}

public class Main {
    public static void main(String[] args) {
        Animal a = new Animal();
        a.name = "ポチ";
        IO.println(a);          // オブジェクトをそのまま表示
    }
}
```

```text
$ java Main.java
Animal@2f92e0f4
```

`Animal@2f92e0f4` の `Animal` はクラス名、`@` のあとは内部的な識別番号で、人間にはほとんど意味がありません。
`IO.println(a)` のように、オブジェクトをそのまま表示すると、この `toString()` の結果が使われます。

---

## toString() をオーバーライドする

この標準の `toString()` を、**オーバーライド**すれば、自分の好きな文字列で表せるようになります。
第3節で学んだオーバーライドの出番です。

```java
class Animal {
    String name;
    int age;

    @Override
    public String toString() {
        return "Animal{name=" + name + ", age=" + age + "}";
    }
}

public class Main {
    public static void main(String[] args) {
        Animal a = new Animal();
        a.name = "ポチ";
        a.age = 3;
        IO.println(a);          // toString() の結果が表示される
    }
}
```

```text
$ java Main.java
Animal{name=ポチ, age=3}
```

`toString()` をオーバーライドしたことで、`IO.println(a)` が、中身のわかる文字列を表示してくれるようになりました。
`Object` から受け継いだメソッドを、自分のクラス用に作り直したわけです。

`toString()` をオーバーライドしておくと、

- `IO.println(オブジェクト)` で、中身が読める形で表示される
- 文字列に `+` でつなげたときも、中身が表示される
- デバッグ（動作確認）のときに、オブジェクトの状態をひと目で確認できる

といった利点があります。実際の開発では、自分で作るクラスに `toString()` を用意しておくのが、よい習慣です。

> **補足: equals() と hashCode()**
>
> `Object` には、`toString()` のほかに、`equals()`（2つのオブジェクトが「等しい」か判定する）や `hashCode()` といったメソッドもあります。
> 第10章で「文字列の比較は `==` ではなく `equals`」と学びましたが、あの `equals` も、もとは `Object` のメソッドです。
> 自分のクラスで「中身が同じなら等しい」と判定させたいときは、`equals()` をオーバーライドします。
> ただし、`equals()` と `hashCode()` を正しくオーバーライドするには、いくつかの決まりごとがあり、少し奥が深いテーマです。
> 幸い、これらを**自動で正しく用意してくれる**しくみが Java にはあります。それが、第17章で学ぶ**レコード（record）**です。

---

## まとめ

- Java の**すべてのクラスは、`Object` を継承**している（`extends` を書かなくても自動的に）
- `Object` には、すべてのオブジェクトに共通の基本メソッドが用意されている
- **`toString()`** は、オブジェクトを文字列で表すメソッド。標準では `クラス名@識別番号`
- `toString()` を**オーバーライド**すると、中身のわかる表示にできる（`IO.println(オブジェクト)` で使われる）
- `Object` には `equals()`・`hashCode()` もある（中身での比較に使う。第17章のレコードが自動で用意してくれる）

次の節では、継承でつまずきやすいポイントを、まとめて確認します。

[^java-object-class]: Java SE 25 API Specification, `java.lang.Object`, <https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Object.html>。"Class `Object` is the root of the class hierarchy. Every class has `Object` as a superclass." `equals(Object)`／`hashCode()`／`toString()`／`getClass()`／`wait`／`notify` などの基本メソッドを提供する（*JLS §4.3.2*）。

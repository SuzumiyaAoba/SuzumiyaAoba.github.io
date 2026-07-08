---
title: ジェネリクスとは ― 型を後から決める
llm: true
co-author: ["Claude Opus 4.7"]
---

## ジェネリクスとは ― 型を後から決める

**ジェネリクス**（Generics）は、ひとことで言えば、

> クラスやメソッドを定義するときに、**扱う型を「後から決められる」ようにするしくみ**

です[^jls-generics]。
この節では、ジェネリクスがない場合の問題と、ジェネリクスがどう解決するかを学びます。

---

## ジェネリクスがないと ― Object の箱

「何でも1つ入れられる箱」`Box` を作りたい、とします。
ジェネリクスを使わずに「何でも入る」ようにするには、すべての型の親である `Object`（第14章）を使うしかありません。

```java
class Box {
    private Object content;          // 何でも入る（Object）
    public void set(Object content) { this.content = content; }
    public Object get() { return content; }
}
```

これで、確かに何でも入ります。ですが、使うときに問題が起きます。

```java
Box box = new Box();
box.set("こんにちは");           // String を入れる
String s = box.get();            // 取り出す
```

このコードは、コンパイルエラーになります。
`get()` の戻り値は `Object` 型なので、`String` の変数には、そのままでは入れられないのです。
取り出すたびに、**キャスト**（第15章）が必要になります。

```java
String s = (String) box.get();   // 毎回キャストが必要
```

さらに困るのは、**間違った型を入れても、気づけない**ことです。

```java
Box box = new Box();
box.set(123);                    // うっかり数値を入れた
String s = (String) box.get();   // String として取り出す → 実行時にエラー
```

```text line-numbers=false
Exception in thread "main" java.lang.ClassCastException: ...
```

数値を入れた箱から、無理に `String` として取り出そうとして、実行時に `ClassCastException`（第15章）になりました。
コンパイル時には気づけず、動かして初めて発覚する ―― これは、第18章の文字列・数値の問題と同じ、危険な状態です。

---

## ジェネリクスで ― 型を指定した箱

そこで、ジェネリクスの出番です。
`Box` を「**入れる型を、後から指定できる**」ように定義します（書き方は次の節）。
すると、こう使えます。

```java
Box<String> box = new Box<>();   // String 専用の箱
box.set("こんにちは");
String s = box.get();            // キャスト不要！
```

`Box<String>` と書くことで、「この箱には `String` を入れる」と指定しています。
すると、

- `get()` は `String` を返すので、**キャストが不要**
- `String` 以外を入れようとすると、**コンパイルエラー**で防げる

```java
Box<String> box = new Box<>();
box.set(123);   // ✕ String の箱に数値 → コンパイルエラー
```

数値を入れようとした時点で、Java が「`String` の箱だから、数値は入れられない」と、**動かす前に**止めてくれます。
「何でも入る柔軟さ」を保ちつつ、「型の安全性」を取り戻せたのです。

---

## 型を「パラメータ」として渡す

ジェネリクスの考え方は、「**型そのものを、パラメータ（引数）のように渡す**」ことです。

第9章で、メソッドに**値**を渡す「引数」を学びました。`add(3, 5)` の `3` や `5` です。
ジェネリクスでは、それと似た感覚で、`Box<String>` の `<String>` という形で、**型**を渡します。

```text line-numbers=false
add(3, 5)           … メソッドに「値」を渡す
Box<String>         … クラスに「型」を渡す
```

この `< >` で渡す型を、**型引数**（Type Argument）と呼びます。
`Box<String>` は「`String` という型引数を渡した `Box`」、`Box<Integer>` は「`Integer` を渡した `Box`」です。
1つの `Box` の定義から、`String` 用・`Integer` 用…と、型ごとの安全な箱を作れるのです。

![ジェネリクスのしくみ。Box&lt;T&gt; という1つの定義から、型引数に String を当てれば String 専用の箱、Integer を当てれば Integer 専用の箱ができる。それぞれ型が決まっているのでキャスト不要で安全。](./images/generics-box.svg)

---

## まとめ

- **ジェネリクス**は、扱う型を「**後から決められる**」ようにするしくみ
- `Object` で「何でも入る」ようにすると、**キャストが必要**で、**間違った型に気づけない**（実行時エラー）
- ジェネリクスなら、`Box<String>` のように型を指定でき、**キャスト不要**＋**間違った型はコンパイルエラー**
- `< >` の中に渡す型を**型引数**と呼ぶ（`Box<String>` の `String`）
- 「柔軟さ」と「型の安全性」を両立できる

次の節では、`Box<T>` のような、ジェネリッククラスの**定義のしかた**を学びます。

[^jls-generics]: *The Java® Language Specification, Java SE 25 Edition*, §4.4 "Type Variables," §4.5 "Parameterized Types," [https://docs.oracle.com/javase/specs/jls/se25/html/jls-4.html#jls-4.4](<https://docs.oracle.com/javase/specs/jls/se25/html/jls-4.html#jls-4.4>)。ジェネリクスは Java 5（JSR 14, 2004年）で導入された。型消去（type erasure, *JLS §4.6*）により実行時には型引数情報が失われる点に注意。

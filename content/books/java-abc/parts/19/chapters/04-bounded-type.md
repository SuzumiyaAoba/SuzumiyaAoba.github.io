---
title: 型引数の境界 ― 型を制限する
llm: true
---

## 型引数の境界 ― 型を制限する

これまでの型パラメータ `T` は、「どんな型でもよい」ものでした。
ですが、ときには「**ある種類の型だけ**を受け付けたい」ことがあります。
たとえば、「数値の仲間（`Integer`・`Double` など）だけを扱いたい」場合です。
この節では、型パラメータに**条件を付ける**しくみ ―― 型引数の境界を学びます。

---

## 制限がないと、何もできない

「配列の合計を求める」ジェネリックメソッドを書きたい、とします。
素直に `<T>` で書くと、こうなります。

```java
static <T> double sumAll(T[] array) {
    double sum = 0;
    for (T value : array) {
        sum += value;            // ✕ T の中身が何か分からないので、足せない
    }
    return sum;
}
```

これは、コンパイルエラーになります。
`T` は「どんな型でもよい」ので、Java から見れば、`T` は `Object`（第14章）と同じ、「何でもありの型」です。
`Object` には「足し算する」機能はないので、`sum += value` ができないのです。
「どんな型でもよい」という自由さが、逆に「何もできない」につながってしまいました。

---

## extends で「〜の仲間だけ」に制限する

そこで、型パラメータに「**この型（か、その子）でなければならない**」という条件を付けます。
**`<T extends 型>`** と書くと、`T` は「その型か、その型を継承（実装）したもの」に制限されます。

数値の親である `Number` を使って、`<T extends Number>` としてみましょう。

```java
static <T extends Number> double sumAll(T[] array) {
    double sum = 0;
    for (T value : array) {
        sum += value.doubleValue();   // Number の機能が使える
    }
    return sum;
}
```

`<T extends Number>` は、「`T` は `Number` の仲間（`Integer`・`Double` など）に限る」という意味です。
こう制限すると、`T` が `Number` の一種だと保証されるので、`Number` が持つメソッド（`doubleValue()` ―― 値を `double` で返す）を、`value` に対して呼べるようになります。
「`T` が何であれ、少なくとも `Number` ではある」と分かるから、`Number` の機能を使えるのです。

> **補足: ここでの `extends` は「継承・実装」の両方を指す**
>
> 型引数の境界では、相手がクラスでもインターフェースでも、`extends` を使います（`implements` は使いません）。
> `<T extends Number>`（クラス）も `<T extends Comparable>`（インターフェース）も、同じ `extends` で書きます。
> 「`extends` のうしろの型の、仲間に限る」と読めば、どちらの場合も同じです。

---

## 使ってみる

`Integer` の配列と `Double` の配列で、`sumAll` を使ってみましょう。

```java
public class Main {
    static <T extends Number> double sumAll(T[] array) {
        double sum = 0;
        for (T value : array) {
            sum += value.doubleValue();
        }
        return sum;
    }

    public static void main(String[] args) {
        Integer[] ints = { 1, 2, 3 };
        Double[] doubles = { 1.5, 2.5 };

        IO.println(sumAll(ints));      // Integer は Number の仲間
        IO.println(sumAll(doubles));   // Double も Number の仲間
    }
}
```

```text
$ java Main.java
6.0
4.0
```

`Integer` も `Double` も `Number` の仲間なので、どちらも `sumAll` に渡せました。
一方、`String` の配列を渡そうとすると…

```java
String[] strings = { "a", "b" };
sumAll(strings);   // String は Number の仲間ではない
```

```text
エラー: クラス Mainのメソッド sumAllは指定された型に適用できません。
  理由: 推論変数Tには、不適合な境界があります
    上限: Number
    下限: String
```

メッセージは少し難しく見えますが、要するに「`T` は `Number` の仲間（上限が `Number`）であるべきなのに、`String` を渡そうとしている」という意味です。
`String` は `Number` の仲間ではないので、コンパイルエラーで止められます。
「数値の合計を求める」メソッドに、うっかり文字列を渡すミスを、型のレベルで防げるのです。
このように、型引数の境界は、「**柔軟さを残しつつ、適切な範囲に制限する**」ための道具です。

---

## まとめ

- 型パラメータが「どんな型でもよい」と、`Object` 同然になり、その型の機能を使えない
- **`<T extends 型>`** で、`T` を「その型か、その子」に制限できる
- 制限すると、その型が持つメソッド（`Number` の `doubleValue()` など）を呼べるようになる
- 境界の `extends` は、クラスでもインターフェースでも使う（`implements` ではない）
- 不適切な型（数値メソッドに `String` など）は、コンパイルエラーで防げる

次の節では、ジェネリクスがもっとも活躍する場所 ―― コレクションを、先取りで見ていきます。

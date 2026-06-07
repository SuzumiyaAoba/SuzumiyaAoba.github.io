---
title: ジェネリッククラス ― 型をパラメータにする
llm: true
---

## ジェネリッククラス ― 型をパラメータにする

前の節で使った `Box<String>` のような、型を後から指定できるクラスを、**ジェネリッククラス**（Generic Class）と呼びます。
この節では、その定義のしかたを学びます。

---

## 型パラメータ T

ジェネリッククラスは、クラス名のうしろに **`<T>`** を付けて定義します。

```java
class Box<T> {           // T という「型の名前」を受け取る
    private T content;    // T 型のフィールド

    public void set(T content) {   // T 型の引数
        this.content = content;
    }

    public T get() {               // T 型を返す
        return content;
    }
}
```

`<T>` の **`T`** は、「**まだ決まっていない型の、仮の名前**」です。
クラスの中では、この `T` を、`String` や `int` などの具体的な型と同じように使えます。
`T content;`（T 型のフィールド）、`set(T content)`（T 型の引数）、`T get()`（T 型を返す）といった具合です。

この `T` を、**型パラメータ**（Type Parameter、型変数）と呼びます。
「型を、あとから当てはめるための、空欄（プレースホルダー）」だと考えてください。

> **補足: なぜ `T` なのか**
>
> `T` は **Type（型）** の頭文字で、型パラメータの名前としてもっともよく使われます。
> 名前は自由ですが、慣習として、1文字の大文字を使います。
> - `T` … Type（型）一般
> - `E` … Element（要素。`List` などで使われる）
> - `K`・`V` … Key・Value（`Map` で使われる）
>
> 複数の型パラメータが必要なら、`<K, V>` のように、カンマ区切りで並べます。

---

## 使うときに、型を当てはめる

`Box<T>` を使うときに、`T` に具体的な型を当てはめます。
`Box<String>` と書けば、`T` がすべて `String` に置きかわった箱になります。

```java
class Box<T> {
    private T content;
    public void set(T content) { this.content = content; }
    public T get() { return content; }
}

public class Main {
    public static void main(String[] args) {
        Box<String> strBox = new Box<>();   // T = String の箱
        strBox.set("こんにちは");
        String s = strBox.get();            // String が返る（キャスト不要）
        IO.println(s);

        Box<Integer> intBox = new Box<>();  // T = Integer の箱
        intBox.set(123);
        int n = intBox.get();               // Integer（→ int）が返る
        IO.println(n);
    }
}
```

```text
$ java Main.java
こんにちは
123
```

`Box<String>` は「`T` が `String` の箱」、`Box<Integer>` は「`T` が `Integer` の箱」です。
1つの `Box<T>` という定義から、`String` 用・`Integer` 用の、別々の安全な箱ができました。
`strBox.get()` は `String` を返すので、キャストなしで `String` 変数に入れられます。

> **補足: `new Box<>()` の `<>`（ダイヤモンド演算子）**
>
> オブジェクトを作るとき、`new Box<String>()` と書いてもよいのですが、左辺で `Box<String>` と型が分かっているので、右辺は **`new Box<>()`** と省略できます。
> この `<>` を、形から**ダイヤモンド演算子**と呼びます。
> 「左辺を見れば型は分かるので、右辺はダイヤだけ」と覚えておきましょう。

---

## 型引数には、参照型しか使えない

1つ注意点があります。
型引数（`< >` の中）には、**参照型しか使えません**。`int` や `double` のような基本型は、直接は指定できないのです。

```java
Box<int> box = new Box<>();   // ✕ 基本型は使えない
```

そのかわり、基本型に対応する**ラッパークラス**を使います。

| 基本型 | ラッパークラス |
|---|---|
| `int` | `Integer` |
| `double` | `Double` |
| `boolean` | `Boolean` |
| `char` | `Character` |

`int` のかわりに `Integer`、`double` のかわりに `Double` を使います。

```java
Box<Integer> box = new Box<>();   // ◯ Integer を使う
box.set(123);                     // int の 123 を入れられる
int n = box.get();                // int として取り出せる
```

`box.set(123)` のように、`int` の値をそのまま入れられ、`int` として取り出せるのは、Java が `int` と `Integer` を**自動で変換**してくれるからです（これを**オートボクシング**と呼びます）。
そのため、`Integer` を指定しておけば、`int` の値とほぼ同じ感覚で扱えます。

---

## まとめ

- **ジェネリッククラス**は、`class Box<T>` のように、**型パラメータ `T`** を付けて定義する
- `T` は「まだ決まっていない型の、仮の名前（空欄）」。クラスの中で型として使える
- 慣習で `T`（型）・`E`（要素）・`K`/`V`（キー/値）などを使う
- 使うときに `Box<String>` のように型を当てはめる。`new` は `new Box<>()`（**ダイヤモンド演算子**）
- 型引数には**参照型のみ**。基本型は**ラッパークラス**（`int`→`Integer` など）を使う

次の節では、メソッド単位で型をパラメータにする、ジェネリックメソッドを学びます。

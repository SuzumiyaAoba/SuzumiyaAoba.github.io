---
title: 標準の関数型インターフェース
llm: true
co-author: ["Claude Opus 4.7"]
---

## 標準の関数型インターフェース

ラムダ式を使うたびに、自分で関数型インターフェース（`Calculator` など）を定義するのは、面倒です。
そこで Java は、**よく使う形の関数型インターフェース**を、標準で用意しています。
`java.util.function` パッケージにある、これらの「**お決まりの型**」を覚えれば、自分で定義する手間が省けます。

---

## 4つの代表的な関数型インターフェース

まずは、もっともよく使う4つを押さえましょう。
「**引数があるか／戻り値があるか**」で、役割が分かれます。

| インターフェース | 形 | メソッド | ひとことで |
|---|---|---|---|
| `Supplier<T>` | `() -> T` | `get()` | 何も受け取らず、値を**供給する** |
| `Consumer<T>` | `T -> ()` | `accept(t)` | 値を受け取り、**消費する**（戻り値なし） |
| `Function<T, R>` | `T -> R` | `apply(t)` | 値を受け取り、**変換して返す** |
| `Predicate<T>` | `T -> boolean` | `test(t)` | 値を受け取り、**真偽を判定する** |

- **Supplier**（サプライヤー、供給者） … 引数なしで、値を作って返す
- **Consumer**（コンシューマー、消費者） … 値を受け取って、何かする（返さない）
- **Function**（ファンクション、関数） … 値を受け取って、別の値に変換して返す
- **Predicate**（プレディケート、述語） … 値を受け取って、`true`/`false` を返す

1つずつ、見ていきましょう。
（以下は jshell でそのまま試せます。ファイルに書くときは `import java.util.function.*;` が必要です。）

---

## Function ― 受け取って、変換して返す

**`Function<T, R>`** は、「`T` 型を受け取って、`R` 型に変換して返す」関数型インターフェースです。
メソッドは **`apply`** です。

```java
Function<String, Integer> length = s -> s.length();   // 文字列 → 文字数
IO.println(length.apply("hello"));
IO.println(length.apply("こんにちは"));
```

```text line-numbers=false
5
5
```

`Function<String, Integer>` は、「`String` を受け取って `Integer` を返す」型です。
「あるものを、別のものに変換する」処理に使います（文字列→長さ、商品→価格、など）。

---

## Predicate ― 条件を判定する

**`Predicate<T>`** は、「`T` 型を受け取って、`boolean`（条件を満たすか）を返す」関数型インターフェースです。
メソッドは **`test`** です。

```java
Predicate<Integer> isEven = n -> n % 2 == 0;   // 偶数か？
IO.println(isEven.test(4));
IO.println(isEven.test(7));
```

```text line-numbers=false
true
false
```

「条件を満たすか」を判定する処理に使います。
第21章の `removeIf` や、次章のストリームの `filter` で、この `Predicate` が大活躍します。

---

## Consumer ― 受け取って、消費する

**`Consumer<T>`** は、「`T` 型を受け取って、何かをする（戻り値なし）」関数型インターフェースです。
メソッドは **`accept`** です。

```java
Consumer<String> printer = s -> IO.println("受け取った: " + s);
printer.accept("やあ");
```

```text line-numbers=false
受け取った: やあ
```

「受け取って、表示する・保存する」のように、**結果を返さない**処理に使います。
コレクションの `forEach`（全要素に何かする）で、この `Consumer` が使われます。

```java
List<String> names = List.of("佐藤", "鈴木", "高橋");
names.forEach(name -> IO.println(name));   // 各要素を Consumer で処理
```

```text line-numbers=false
佐藤
鈴木
高橋
```

---

## Supplier ― 何も受け取らず、値を供給する

**`Supplier<T>`** は、「引数なしで、`T` 型の値を作って返す」関数型インターフェースです。
メソッドは **`get`** です。

```java
Supplier<String> greeting = () -> "こんにちは";
IO.println(greeting.get());
```

```text line-numbers=false
こんにちは
```

「呼ばれたら、値を用意して返す」処理に使います。
「必要になったときに、初めて値を作る」といった、少し進んだ場面で活躍します（第24章の Optional でも登場します）。

---

## 引数が2つの版もある

引数を2つ取りたいときは、頭に **`Bi`**（two の意味）が付いた版を使います。

```java
BiFunction<Integer, Integer, Integer> add = (a, b) -> a + b;   // 2つ受け取って返す
IO.println(add.apply(3, 5));
```

```text line-numbers=false
8
```

`BiFunction<T, U, R>` は「`T` と `U` を受け取って `R` を返す」、`BiConsumer<T, U>` は「2つ受け取って消費する」です。
基本の4つに、`Bi` 版がある、と知っておけば十分です。

---

## まとめ

- Java は、よく使う関数型インターフェースを **`java.util.function`** に標準で用意している
- **`Function<T,R>`**（`apply`） … 受け取って、**変換して返す**
- **`Predicate<T>`**（`test`） … 受け取って、**真偽を判定する**
- **`Consumer<T>`**（`accept`） … 受け取って、**消費する**（戻り値なし）
- **`Supplier<T>`**（`get`） … 引数なしで、**値を供給する**
- 引数が2つなら、`BiFunction`・`BiConsumer` など **`Bi`** 版を使う

次の節では、ラムダ式をさらに短く書く **メソッド参照**を学びます。

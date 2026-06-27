---
title: よくあるつまずき
llm: true
co-author: ["Claude Opus 4.7"]
---

## よくあるつまずき

クラスとオブジェクトで、初心者がつまずきやすいポイントを、まとめて確認します。

---

## 1. new を忘れて、null のまま使う

オブジェクトを使うには、まず `new` で作る必要があります。
変数を宣言しただけで `new` を忘れると、その変数は `null`（何も指していない状態）のままです。

```java
class Car { String name; int speed; }

void main() {
    Car c;              // 宣言しただけ（new していない）
    c.speed = 60;       // null に対して操作しようとする
}
```

ファイルに書いて実行する場合、Java は「`c` が初期化されていない可能性がある」とコンパイルエラーで止めてくれます。
では、`null` を明示的に入れてしまったらどうなるでしょうか。

```java
Car c = null;       // null を入れた
c.speed = 60;       // null のフィールドにアクセス
```

```text
Exception in thread "main" java.lang.NullPointerException: Cannot assign field "speed" because "c" is null
```

`NullPointerException`（ヌルポインタ例外）は、**`null` に対してフィールドやメソッドを使おうとした**ときに起きる、Java で最も有名なエラーです。
先頭の `Exception in thread "main"` は「`main` の実行中に、捕まえそこねたエラーが起きた」という意味で、続く行に原因が書かれます。
ここでは「`Cannot assign field "speed" because "c" is null`（`c` が null なので、フィールド `speed` に代入できない）」と、原因がはっきり示されています。
「オブジェクトを使う前に、`new` したか？」を、まず確認しましょう。

> **補足: 変数名の表示と、例外のくわしい扱い**
>
> このように「`because "c" is null`」と**変数名つき**で原因を教えてくれるのは、Java の親切な機能です（IDE で実行するときは、この形で表示されます）。
> なお、`java ファイル名.java` で直接実行した場合は、変数名の部分が `"<local1>"` のように表示されることがありますが、意味は同じです。
> また、`Exception in thread "main"` の下には、エラーが起きた場所をたどる「スタックトレース」（`at ...` の行）が続きます。例外そのもののくわしい扱いは、第20章「例外処理」で学びます。

---

## 2. String フィールドの初期値 null に注意

`new` でオブジェクトを作っても、`String` などの参照型のフィールドは、初期値が **`null`** です。
値を入れる前にメソッドを呼ぶと、やはり `NullPointerException` になります。

```java
class Car { String name; }

void main() {
    Car c = new Car();          // new はした
    IO.println(c.name.length()); // でも name は null のまま
}
```

```text
Exception in thread "main" java.lang.NullPointerException: Cannot invoke "String.length()" because "c.name" is null
```

「`c.name` が null なので、`String.length()` を呼べない」という意味です。
`new` したオブジェクトでも、**`String` のフィールドは別途、値を入れる**まで `null` です。
（このあと第13章で学ぶ**コンストラクタ**を使うと、`new` と同時に初期値を入れられるので、この問題を防げます。）

---

## 3. クラスとオブジェクトを混同する

クラスは設計図、オブジェクトは実体です。**設計図そのものを操作しようとする**のは、よくある勘違いです。

```java
Car.speed = 60;   // ✕ クラスに直接 speed を入れようとしている
```

`speed` はインスタンス変数（オブジェクトごとのデータ）なので、`Car`（クラス）に直接は入れられません。
まず `new Car()` でオブジェクトを作り、`そのオブジェクト.speed = 60;` とします。
「型から作った**実体**に対して操作する」 ―― これが基本です。
（`クラス名.名前` の形が使えるのは、前の節で学んだ `static` メンバだけです。）

---

## 4. 代入とコピーを取り違える

第6節で見たとおり、`Car b = a;` は**オブジェクトをコピーしません**。`a` と `b` は同じオブジェクトを指します。

```java
Car b = a;        // a と b は同じ車を指す（コピーではない）
b.speed = 100;    // → a.speed も 100 になる
```

「2台目がほしい」なら、`Car b = new Car();` と、`new` で新しく作ります。
**`new` は新しい実体を作る／代入は場所を教えるだけ**、と区別しましょう。

---

## 5. インスタンスの状態を static にしてしまう

`static` は「クラス全体で共有」です。オブジェクトごとに違うべき状態を `static` にすると、全オブジェクトで値が混ざってしまいます。

```java
class Car {
    static int speed;   // ✕ 速度を static にしてしまった
}
```

これだと、`car1.speed` を変えると `car2.speed` も変わってしまいます（同じ1つの `speed` を共有するため）。
速度は「車ごと」のデータなので、`static` を付けない**インスタンス変数**にします。
「オブジェクトごとに違うものは `static` にしない」と覚えておきましょう。

---

## まとめ

- オブジェクトは使う前に **`new`** する。`null` に操作すると **`NullPointerException`**
- `new` しても、`String` などのフィールドは初期値 `null`。使う前に値を入れる
- クラス（設計図）に直接 `speed = ...` はできない。`new` した**実体**に対して操作する
- `Car b = a;` はコピーではない。別の実体は `new` で作る
- オブジェクトごとに違う状態は **`static` にしない**

次は、この章で学んだ言葉を、用語集としてまとめます。

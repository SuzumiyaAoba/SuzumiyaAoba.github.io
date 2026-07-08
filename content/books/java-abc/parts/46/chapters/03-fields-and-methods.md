---
title: フィールドとメソッドにアクセスする
llm: true
---

## フィールドとメソッドにアクセスする

`Class<?>` を取得したら、その中の**フィールド**と**メソッド**を扱えるようになります。
この節では、**読む・書く・呼ぶ**の 3 つの操作を、サンプルとともに見ていきます。

---

## 全部入りサンプル

最初に、典型的なリフレクション操作を 1 つのプログラムにまとめたものを見せます。

```java
import java.lang.reflect.*;

public class RefDemo {
    static class Person {
        private String name;
        public Person(String name) { this.name = name; }
        public String greet(String who) { return "Hello, " + who + ", from " + name; }
    }
    public static void main(String[] args) throws Exception {
        Class<?> c = Person.class;

        // 1. インスタンス生成
        Object p = c.getConstructor(String.class).newInstance("Alice");

        // 2. メソッド呼び出し
        Method m = c.getMethod("greet", String.class);
        System.out.println(m.invoke(p, "Bob"));

        // 3. private フィールドの読み・書き
        Field f = c.getDeclaredField("name");
        f.setAccessible(true);
        System.out.println("name=" + f.get(p));
        f.set(p, "Carol");
        System.out.println(m.invoke(p, "Dave"));
    }
}
```

実行すると、

```text line-numbers=false
$ javac RefDemo.java && java RefDemo
Hello, Bob, from Alice
name=Alice
Hello, Dave, from Carol
```

この短いプログラムに、リフレクションの**基本動作のほぼ全て**が詰まっています。順に見ていきます。

---

## インスタンス生成

```java
Object p = c.getConstructor(String.class).newInstance("Alice");
```

ここでは、

1. `c.getConstructor(String.class)` で「**`String` を 1 つ取るコンストラクタ**」を取得
2. `newInstance("Alice")` で、それを呼んで実体を作る

引数なしのコンストラクタなら、`c.getDeclaredConstructor().newInstance()` で済みます。

> **`clazz.newInstance()` は非推奨**
>
> Java 9 以降、`Class.newInstance()`（コンストラクタ取得を省略した古い API）は**非推奨**です。
> 例外を握りつぶしてしまう問題があるためで、新しいコードでは `getConstructor(...).newInstance(...)` を使います。

複数あるコンストラクタから 1 つを選ぶには、**引数の型**で指定します。

```java
c.getConstructor(String.class, int.class)   // public(String, int)
c.getDeclaredConstructor(String.class)      // private 含む
```

`getConstructor` と `getDeclaredConstructor` の違いは、

| メソッド | 何が見えるか |
|---|---|
| `getConstructor(...)` | **public のみ** |
| `getDeclaredConstructor(...)` | **すべて**（private を含む） |

private のコンストラクタを呼ぶには、`getDeclaredConstructor` を使い、さらに `setAccessible(true)` が要ります。

---

## メソッド呼び出し

```java
Method m = c.getMethod("greet", String.class);
System.out.println(m.invoke(p, "Bob"));
```

3 ステップに分かれます。

1. **`Method` オブジェクトを取得**: メソッド名と**引数の型**を指定
2. **`invoke(レシーバ, 引数...)` で呼ぶ**
3. 戻り値は `Object` で返ってくる ―― 必要に応じてキャストする

複数引数のメソッドなら、

```java
Method m = c.getMethod("compute", int.class, double.class);
Object result = m.invoke(p, 42, 3.14);
```

のように、可変長引数で渡せます。

### `static` メソッドの呼び出し

`invoke(...)` の第 1 引数（レシーバ）は、static メソッドの場合は `null` を渡します。

```java
Method m = Math.class.getMethod("max", int.class, int.class);
int result = (int) m.invoke(null, 3, 7);   // 7
```

---

## フィールドの読み書き

```java
Field f = c.getDeclaredField("name");
f.setAccessible(true);
String name = (String) f.get(p);
f.set(p, "Carol");
```

- `getField("name")` ―― **public のみ**取得
- `getDeclaredField("name")` ―― すべて取得（private を含む）
- `field.get(obj)` ―― 読む
- `field.set(obj, value)` ―― 書く

private フィールドにアクセスするには、`setAccessible(true)` を呼ぶ必要があります。
ここで、第45章で見た JPMS の **`opens`** との関係が効いてきます。

### `setAccessible(true)` と JPMS

```java
f.setAccessible(true);   // ← opens されていないと、InaccessibleObjectException
```

クラスが属するパッケージが、`module-info.java` の **`opens`** または **`open module`** で開放されていなければ、ここで例外になります。
**`opens`** の必要性は、`setAccessible(true)` がどこから呼ばれるか、その境界条件の問題なのです。

ローカルクラスや同じモジュール内のクラスでは、`setAccessible(true)` は問題なく動きます。
**別モジュールから侵入**しようとすると、`opens` が必要になります。

---

## プリミティブ vs ラッパー

リフレクションで「**プリミティブの型**」を扱うときは、**`int.class`** と **`Integer.class`** を区別する必要があります。

```java
// (int) を取るメソッド
Method m = c.getMethod("setAge", int.class);

// Integer (boxed) を取るメソッドは別物
Method m2 = c.getMethod("setAge", Integer.class);
```

両者は**別のメソッド**として扱われます。
`getMethod(name, parameterTypes)` で取り違えると、`NoSuchMethodException` で弾かれます。

引数を渡すとき、ボクシングは透過的に効きます:

```java
Method m = c.getMethod("setAge", int.class);
m.invoke(p, 42);    // int に自動アンボクシング
m.invoke(p, Integer.valueOf(42));   // どちらでも OK
```

---

## 配列の扱い

配列はまた別の API（`java.lang.reflect.Array`）があります。

```java
import java.lang.reflect.Array;

Object arr = Array.newInstance(int.class, 5);   // new int[5]
Array.setInt(arr, 0, 10);
int v = Array.getInt(arr, 0);
```

ふつうの `new int[5]` でできることを、リフレクション経由で書けます。
`Class.forName("[I")` のように、配列の型自体を取り出すこともできます。

| 表記 | 意味 |
|---|---|
| `[I` | `int[]` |
| `[Ljava/lang/String;` | `String[]` |
| `[[I` | `int[][]` |

第41章で見た**フィールドディスクリプタ**の表記が、ここでも顔を出します。

---

## メソッド呼び出しでの**例外伝搬**

リフレクション越しに呼んだメソッドが**例外を投げる**と、`invoke` は **`InvocationTargetException`** でラップして投げます。

```java
try {
    method.invoke(obj);
} catch (InvocationTargetException e) {
    Throwable cause = e.getCause();   // ← ここが本当の原因
    // ...
}
```

これは、第29章の `Future.get()` の `ExecutionException` と似た構造です。
リフレクション越しに呼ぶ場合は、`InvocationTargetException` を catch して `getCause()` で**本当の例外**を取り出す、というお作法を覚えておきましょう。

`StructuredTaskScope`（第44章）では、こうしたラップが**不要**になっています。新しい API は、こういう古いお作法を解消する方向に向かっています。

---

## キャッシュ ―― 「**毎回 lookup しない**」

リフレクションは遅いです。
特に `getMethod`・`getField`・`getDeclaredXxx` のような**ルックアップ**は、毎回やると性能が落ちます。

```java
// アンチパターン: 呼ぶたびに lookup
for (int i = 0; i < 1_000_000; i++) {
    c.getMethod("compute").invoke(p);   // ← 遅い
}
```

ループの中で呼ぶなら、**`Method` を取り出してキャッシュ**します。

```java
Method m = c.getMethod("compute");   // 1 回だけ lookup
for (int i = 0; i < 1_000_000; i++) {
    m.invoke(p);   // 呼び出しだけを繰り返す
}
```

これだけで、性能は劇的に改善します。
さらに速くしたいときは、第5節の **`MethodHandle`** を使います。

---

## まとめると

- インスタンス生成: `clazz.getConstructor(types...).newInstance(args...)`
- メソッド呼び出し: `method.invoke(receiver, args...)`、static は receiver に `null`
- フィールド読み書き: `field.get(obj)` / `field.set(obj, value)`
- **private**には `setAccessible(true)` ―― JPMS では `opens` が必要
- **プリミティブとラッパーは別の型**: `int.class` ≠ `Integer.class`
- 例外は **`InvocationTargetException`** にラップされる ―― `getCause()` で本物を取る
- **`getMethod` / `getField` はキャッシュ**して、ループでは呼ばない

次の節では、リフレクションの主役のひとつ ―― **アノテーション**の読み取りを扱います。

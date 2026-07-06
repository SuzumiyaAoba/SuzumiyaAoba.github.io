---
title: MethodHandle ― 高速なリフレクションの代替
llm: true
---

## `MethodHandle` ― 高速なリフレクションの代替

リフレクション（`Method.invoke`）は遅い ―― この問題を解決するために、Java 7 で導入されたのが **`MethodHandle`**（`java.lang.invoke` パッケージ）です[^jsr292-invokedynamic]。
この節では、リフレクションとの違いと、使い方の基本を見ていきます。

---

## なぜ `Method.invoke` は遅いのか

`Method.invoke(receiver, args...)` の中身を概念的に書くと、こうなります。

1. アクセス制御のチェック（`setAccessible` の状態を確認）
2. 引数の**配列を作る**（`args` を `Object[]` にまとめる）
3. **ボクシング**（プリミティブを `Integer` などにラップ）
4. 仮想呼び出しで実体を呼ぶ
5. 戻り値の**アンボクシング**

特に「**引数を `Object[]` にまとめてボクシング**」が、毎回コストになります。
JIT が**インライン化**しようとしても、`Object[]` をまたぐと最適化が利かなくなります。

---

## `MethodHandle` の発想

`MethodHandle` は、これを次のように変えます。

> メソッドを「**関数ポインタ**」のように扱い、**型をリンク時に固定**してしまう。
> 以降の呼び出しでは、ボクシングも配列もなしで、**ふつうの仮想呼び出し並み**に速い。

つまり、

- 最初に「**このメソッドハンドル**」を**作る**ときに、引数の型・戻り値の型を確定
- 以降の `invokeExact(...)` は、**コンパイル時に**型が分かっているのと同じ速度

これが、`Method.invoke` と決定的に違う点です。

---

## 基本の使い方

最小限のサンプルです。

```java
import java.lang.invoke.*;

public class MhDemo {
    static int square(int x) { return x * x; }

    public static void main(String[] args) throws Throwable {
        MethodHandles.Lookup lookup = MethodHandles.lookup();
        MethodType mt = MethodType.methodType(int.class, int.class);   // (int) → int
        MethodHandle mh = lookup.findStatic(MhDemo.class, "square", mt);

        int r = (int) mh.invokeExact(7);
        System.out.println("square(7) = " + r);
    }
}
```

実行結果:

```text
$ javac MhDemo.java && java MhDemo
square(7) = 49
```

3 つの要素があります。

### 1. `Lookup` ―― 「**呼ぶ権利**」のチェッカー

```java
MethodHandles.Lookup lookup = MethodHandles.lookup();
```

`Lookup` は、「**今いる場所からアクセスできるメソッドだけを発見できる**」検索器です。
ふつうのコード（`MyClass.method` を呼ぶコード）の**位置から**呼べるメソッドだけ、`Lookup` も見つけられます。

これは、リフレクションの `setAccessible(true)` のような「**侵入**」ができないことを意味します。
private メソッドにアクセスしたいなら、

- そのクラス自身の中で `MethodHandles.lookup()` を呼んで取得した `Lookup` を渡してもらう
- または `MethodHandles.privateLookupIn(target, lookup)` で広げる（JPMS の `opens` が必要）

ことが必要です。
セキュリティ的に、リフレクションよりずっと**素直な**設計です。

### 2. `MethodType` ―― 「**型のシグネチャ**」

```java
MethodType mt = MethodType.methodType(int.class, int.class);   // (int) → int
```

`MethodType` は、メソッドの「**戻り値型と引数型**」を表す不変オブジェクトです。
**`methodType(戻り値型, 引数型...)`** で作ります。
バイトコードの**メソッドディスクリプタ**（第41章の `(I)I`）と、**情報的に同じ**ものです。

### 3. `MethodHandle` ―― 「**呼び出しのハンドル**」

```java
MethodHandle mh = lookup.findStatic(MhDemo.class, "square", mt);
```

`MethodHandle` 自体は、メソッドへの**ハンドル**です。
`findStatic`、`findVirtual`、`findConstructor`、`findGetter`、`findSetter` などで取得します。

| 取得メソッド | 何を見つけるか |
|---|---|
| `findStatic(class, name, type)` | static メソッド |
| `findVirtual(class, name, type)` | インスタンスメソッド |
| `findConstructor(class, type)` | コンストラクタ |
| `findGetter(class, name, fieldType)` | フィールドの getter |
| `findSetter(class, name, fieldType)` | フィールドの setter |

---

## `invokeExact` vs `invoke` vs `invokeWithArguments`

`MethodHandle` には、呼び出し方が **3 つ**あります。

### `invokeExact` ―― 最速、型は完全一致

```java
int r = (int) mh.invokeExact(7);
```

- 引数と戻り値の型が、**ハンドルの型と完全に一致**しなければならない
- `int` を期待しているのに `Integer` を渡したらエラー
- 戻り値も `(int)` でキャスト**しないと**エラー

最も厳しいが、最も速いです。**JIT が完全にインライン化できる**のはこれだけです。

### `invoke` ―― 引数を変換する

```java
int r = (int) mh.invoke(7);    // ボクシング・キャストは自動
Object r2 = mh.invoke(7);       // 戻り値も Object で受けられる
```

`invokeExact` ほど厳しくなく、**ボクシング・型変換**を自動でやります。
ただし、その分**遅く**なります。

### `invokeWithArguments` ―― リフレクション相当の柔軟さ

```java
Object r = mh.invokeWithArguments(7);
```

引数を **`Object[]` で渡す**形式。リフレクションの `Method.invoke` と同じ感覚で使えますが、**速度面ではメリットがなくなる**ので、ふつうは使いません。

---

## なぜ速いか ―― `invokedynamic` の世界

`MethodHandle` の本当の力は、**`invokedynamic`** バイトコード（第41章で軽く触れた）と組み合わせたときに発揮されます。

- `MethodHandle` を **`CallSite`** にバインドし、`invokedynamic` 命令に紐づける
- JVM は最初の呼び出しでハンドルを解決し、**以降は直接呼び出しと同じ速度**で動く
- JIT が**インライン化**することもできる

Java 8 以降の**ラムダ**は、すべて `invokedynamic` + `MethodHandle` の組み合わせで実装されています。
ラムダ呼び出しが速いのは、この仕組みのおかげです。

---

## ハンドルの**組み立て**

`MethodHandle` のもう一つの面白さは、**ハンドルを組み合わせて新しいハンドルを作れる**ことです。

```java
MethodHandle add = lookup.findStatic(Math.class, "addExact",
    MethodType.methodType(int.class, int.class, int.class));

// 第 1 引数を 10 に固定したハンドル: (y) -> 10 + y
MethodHandle add10 = MethodHandles.insertArguments(add, 0, 10);

int r = (int) add10.invokeExact(5);   // 15
```

`insertArguments`、`dropArguments`、`filterArguments`、`bindTo` ... ハンドルを**変形**するメソッドが揃っています。
これらを使えば、関数型プログラミングの「**部分適用**」「**関数合成**」のようなことが、リフレクションでもできます。

ただ、業務コードでここまでやる場面はほぼありません。
ライブラリ作者のための道具立て、と思っておいて十分です。

---

## ベンチマークではどのくらい違うか

実機での**だいたいの傾向**を示します（JMH で測ると、実機依存ですが大きな差は安定して出ます）。

| 呼び出し方 | 1 回あたりの目安 |
|---|---|
| 直接呼び出し | < 1 ns |
| **`MethodHandle.invokeExact`** | ~ 1〜3 ns |
| `Method.invoke`（リフレクション） | ~ 数十〜数百 ns |
| `MethodHandle.invokeWithArguments` | `Method.invoke` 相当 |

特にホットパスでの呼び出しでは、`MethodHandle.invokeExact` を選ぶことで**桁違い**の差が出ます。

---

## 「いつ使うか」

ふつうのアプリでは、`MethodHandle` を**直接書く**機会はあまりありません。
ですが、次のような場面では検討します。

- **ホットなリフレクション呼び出し**の置き換え
- **動的なディスパッチ**を、高速にやりたい
- **JIT 最適化**を効かせたい
- **`invokedynamic` を伴うライブラリ**を書く

たとえば、JSON ライブラリ、テンプレートエンジン、コード生成系のフレームワーク作者には、`MethodHandle` は強力な道具です。

---

## まとめると

- `MethodHandle` は、**リフレクションより 1〜2 桁速い**動的呼び出し
- 3 つの要素: **`Lookup`・`MethodType`・`MethodHandle`**
- **`invokeExact`** が最速、型が完全一致しないとエラー
- **`Lookup`** は「**呼ぶ権利のチェッカー**」 ―― リフレクションのような侵入はできない
- JIT に**インライン化**されることもある
- 業務コードで直接書く機会は少ないが、**ライブラリ作者には強力**

次の節では、ここまでのリフレクション全般の**落とし穴**を、改めて整理します。

[^jsr292-invokedynamic]: JSR 292: Supporting Dynamically Typed Languages on the Java Platform, [https://jcp.org/en/jsr/detail?id=292](<https://jcp.org/en/jsr/detail?id=292>)。Java SE 7（2011年）で導入された `invokedynamic` バイトコード命令と `java.lang.invoke` API（`MethodHandle`／`MethodType`／`CallSite`）を規定。Lambda 式（Java 8）の実装基盤としても利用されている。

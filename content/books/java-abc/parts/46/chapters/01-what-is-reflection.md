---
title: リフレクションとは ― 実行時に型を覗く
llm: true
---

## リフレクションとは ― 実行時に型を覗く

リフレクションは、**「コードが、コード自身の構造を覗き、操作する**」仕組みです。
この節では、リフレクションで**何が可能か**を、具体的に整理します。

---

## コンパイル時に分かること、分からないこと

ふつうの Java コードは、**コンパイル時にすべてが決まっています**。

```java
String s = "hello";
int len = s.length();
```

ここでは、

- `s` の型は **`String`**
- 呼び出すメソッドは **`String.length()`**

が、コンパイラに分かっています。
だから、javac はこれを **`invokevirtual String.length:()I`** というバイトコード（第41章）にコンパイルし、JIT は最適化できる、というわけです。

ですが、世の中には次のような状況があります。

- 設定ファイル `config.yml` に `class: com.example.User` と書かれている
- HTTP リクエストの JSON `{ "name": "Alice" }` をオブジェクトに変換したい
- プラグイン jar をディレクトリから読んで動かしたい

これらは、**実行時にならないと**何が来るか分かりません。
コンパイル時には `String s = "hello"` のようには書けないわけです。

---

## リフレクション API の地図

`java.lang.reflect` パッケージは、**実行時にクラスの情報を扱う**ための API を提供します。
中心になる型は、次の通りです。

| 型 | 何を表すか |
|---|---|
| `Class<?>` | クラスそのもの（型情報） |
| `Field` | フィールド |
| `Method` | メソッド |
| `Constructor<?>` | コンストラクタ |
| `Parameter` | メソッドの引数 |
| `Modifier` | `public`・`final` などの修飾子の判定 |

これらをひとつなぎにすると、

```text
Class<?>
  ├── getDeclaredFields()      → Field[]
  ├── getDeclaredMethods()     → Method[]
  ├── getDeclaredConstructors() → Constructor<?>[]
  ├── getAnnotations()          → Annotation[]
  └── getModifiers()            → int
```

このような階層構造で、クラスの**中身**にアクセスできます。

---

## まず最小のサンプル

`String.class` を覗いてみましょう。

```text
jshell> "hello".getClass()
$1 ==> class java.lang.String

jshell> "hello".getClass().getName()
$2 ==> "java.lang.String"

jshell> "hello".getClass().getDeclaredMethods()[0]
$3 ==> byte[] java.lang.String.value()
```

- `getClass()` で、そのインスタンスの**型**を表す `Class<?>` が手に入る
- `getName()` で、完全限定名（パッケージ込みの名前）が得られる
- `getDeclaredMethods()` で、**そのクラス自身が宣言する**メソッド一覧

`String` のような Bootstrap でロードされる基本クラスでも、リフレクションは効きます。

---

## リフレクションでできること

リフレクションで可能な主な操作を、表で整理します。

| カテゴリ | 例 |
|---|---|
| **型の検査** | `instanceof` 相当のことを動的に: `clazz.isInstance(obj)` |
| **インスタンス生成** | `clazz.getConstructor(...).newInstance(...)` |
| **フィールド読み書き** | `field.get(obj)` / `field.set(obj, value)` |
| **メソッド呼び出し** | `method.invoke(obj, args...)` |
| **アクセス制御の解除** | `setAccessible(true)`（private を触る） |
| **アノテーション読み取り** | `method.getAnnotation(MyAnno.class)` |
| **継承関係の解析** | `clazz.getSuperclass()`、`clazz.getInterfaces()` |

特に **インスタンス生成・フィールド書き込み・メソッド呼び出し**の 3 つが、フレームワークの中で頻繁に使われる動作です。

---

## ジェネリクスの「**消去**」と動的型

リフレクションで触れる型情報は、**コンパイル時の型**そのものではありません。
Java のジェネリクスには **型消去**（type erasure）があり、実行時には型引数が消えています。

```text
jshell> List<String> list = new ArrayList<>();
jshell> list.getClass().getName()
$1 ==> "java.util.ArrayList"
jshell> list.getClass().getTypeParameters().length
$2 ==> 1
jshell> list.getClass().getTypeParameters()[0].getName()
$3 ==> "E"
```

`getTypeParameters()` は「**`ArrayList<E>` の `E`**」のような**型変数**を返すだけで、「**この `list` は `String` 用だ**」とは教えてくれません。
実行時にはもう情報がないからです。

ジェネリクスの**実引数**を保持できるのは、

- フィールドやメソッドのシグネチャ（`List<String>` と宣言してある場所）
- **TypeReference** のような、サブクラスで型を埋め込む技法

の 2 つです。Jackson の `TypeReference<List<User>>` が、後者の典型例です。

---

## 「**`Class<?>`** とは何者か」

`Class<?>` という型は、ちょっと変わった存在です。
インスタンスは**クラスごとに 1 つ**しかなく、その JVM 上で**ユニーク**です。

```text
jshell> String.class == "x".getClass()
$1 ==> true

jshell> String.class == Class.forName("java.lang.String")
$2 ==> true
```

3 つの取得方法（次節で詳しく）すべてが**同じインスタンス**を返すのは、JVM がクラスごとに `Class<?>` を**1 つだけ**作って管理しているからです。

そして `Class<?>` 自身も**ヒープ上のオブジェクト**で、メソッド領域のクラス情報を指しています。
このおかげで、`String.class` を引数で渡したり、`Map<Class<?>, ...>` のキーに使ったりできます。

---

## リフレクションの「**コスト**」を忘れない

リフレクションは**動的**な分、**遅い**です。
通常のメソッド呼び出しが 1 ns 程度なのに対し、リフレクションでの `invoke` は、最初は **数百 ns** かかります。

ループの中で何百万回も呼ぶ用途には**向きません**。
1 回の `invoke` で十分な、**起動時・設定時・1 リクエストごと**といった用途に限るのが基本です。

頻繁に呼ぶなら、**`MethodHandle`**（第5節）や、コンパイル時にコード生成する **アノテーションプロセッサ**（第47章）を選びます。

---

## まとめると

- リフレクションは「**実行時に型情報を覗き・操作する**」仕組み
- 中心は **`Class<?>`** で、そこから `Field`・`Method`・`Constructor<?>` を取り出す
- インスタンス生成・フィールド読み書き・メソッド呼び出しが主な操作
- ジェネリクスは**型消去**で実行時に消える ―― 引数は素朴にしか取れない
- **コストが高い**ので、ループの中での多用は避ける

次の節では、`Class<?>` を取得する**3 つの方法**を、具体的に見ていきます。

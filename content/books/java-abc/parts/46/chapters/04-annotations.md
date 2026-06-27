---
title: アノテーションを読み取る
llm: true
---

## アノテーションを読み取る

`@Test`、`@Override`、`@Autowired` ... Java では、これらの **アノテーション**（注釈）を、コードのあちこちで見かけます。
リフレクションを使うと、それらを**実行時に**読み取り、独自のフレームワークが作れるようになります。

---

## アノテーションの 3 つの保持期間

第47章で本格的に扱いますが、ここで触る範囲だけ整理しておきます。
アノテーションには **保持期間**（retention）が 3 種類あります。

| `RetentionPolicy` | どこまで残るか | 例 |
|---|---|---|
| `SOURCE` | ソースだけ。コンパイル時に消える | `@Override` |
| `CLASS` | `.class` には残るが、実行時には読めない | （古い `@Nullable` の一部） |
| `RUNTIME` | **実行時にリフレクションで読める** | `@Test`、`@Autowired` |

リフレクションで読みたいなら、**`RUNTIME`** で宣言します。
**`@Test` などのフレームワークの典型的なアノテーションは、すべて `RUNTIME` です。**

---

## カスタムアノテーションを作る

最小限のカスタムアノテーションを作ってみます。「**テストメソッドであることを示す `@MyTest`**」。

```java
import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface MyTest {
    String name() default "";
}
```

要素を 1 つずつ解説します。

- **`@interface`** ―― アノテーションの宣言
- **`@Retention(RetentionPolicy.RUNTIME)`** ―― 実行時に読めるように
- **`@Target(ElementType.METHOD)`** ―― メソッドにだけ付けられる
- **`name()`** ―― 引数のようなもの。`default ""` で省略可能

これだけで、自前のアノテーションが 1 つ完成です。

---

## 簡易なテストランナーを作ってみる

カスタムアノテーションを使って、**「`@MyTest` の付いたメソッドを全部呼ぶ」** ミニ JUnit を作ってみます。

```java
public class AnnoDemo {
    @MyTest(name = "addition")
    public void testAdd() { System.out.println("1+1=2"); }

    @MyTest
    public void testSub() { System.out.println("2-1=1"); }

    public void notATest() { System.out.println("skip"); }

    public static void main(String[] args) throws Exception {
        Object instance = AnnoDemo.class.getConstructor().newInstance();
        for (Method m : AnnoDemo.class.getDeclaredMethods()) {
            MyTest a = m.getAnnotation(MyTest.class);
            if (a != null) {
                String label = a.name().isEmpty() ? m.getName() : a.name();
                System.out.println("[TEST] " + label);
                m.invoke(instance);
            }
        }
    }
}
```

実行すると、

```text
[TEST] addition
1+1=2
[TEST] testSub
2-1=1
```

`@MyTest` のないメソッド（`notATest`）は、ちゃんと呼ばれていません。
要素の `name` を指定したものはその名前で、省略したものはメソッド名で表示されています。

これが、JUnit 4 / 5 の**基本的な原理**です。
本物の JUnit は、もちろんもっと洗練されていますが、`@Test` を見つけて`invoke` する、という核心は同じです。

---

## アノテーションを読む API

`AnnotatedElement` インタフェースには、アノテーションを読むメソッドが揃っています。
`Class`・`Field`・`Method`・`Constructor` などは、すべてこのインタフェースを実装しています。

| メソッド | 何をするか |
|---|---|
| `getAnnotation(Class)` | 指定型のアノテーションを取得（なければ `null`） |
| `getAnnotations()` | **直接 + 継承**したアノテーション全部 |
| `getDeclaredAnnotations()` | **直接付与**したものだけ |
| `isAnnotationPresent(Class)` | あるか/ないか |
| `getAnnotationsByType(Class)` | 繰り返し可能アノテーション用 |

```java
if (method.isAnnotationPresent(MyTest.class)) {
    MyTest test = method.getAnnotation(MyTest.class);
    // ...
}
```

---

## `@Target` ―― どこに付けられるか

`@Target` は、そのアノテーションを**どこに付けられるか**を制限します。

| `ElementType` | 対象 |
|---|---|
| `TYPE` | クラス・インタフェース・enum・record |
| `FIELD` | フィールド |
| `METHOD` | メソッド |
| `PARAMETER` | メソッドの引数 |
| `CONSTRUCTOR` | コンストラクタ |
| `LOCAL_VARIABLE` | ローカル変数 |
| `ANNOTATION_TYPE` | アノテーション宣言 |
| `PACKAGE` | パッケージ |
| `TYPE_PARAMETER` | ジェネリクスの型引数 |
| `TYPE_USE` | 型が使われる場所すべて（Java 8+） |

複数指定するなら配列で:

```java
@Target({ElementType.METHOD, ElementType.FIELD})
@interface MyAnno { }
```

`@Target` を指定しないと、**どこにでも**付けられます（古いコードでよくある）。
セキュリティ的にも、設計の意図を表すうえでも、`@Target` は**ちゃんと指定する**のが推奨です。

---

## `@Inherited` ―― サブクラスも見えるように

`@Inherited` の付いたアノテーションは、**スーパークラスに付けたものが、サブクラスの**`getAnnotations()` でも見えるようになります。

```java
@Inherited
@Retention(RetentionPolicy.RUNTIME)
@interface Tagged { }

@Tagged
class Parent {}

class Child extends Parent {}

// 試す
Child.class.isAnnotationPresent(Tagged.class)   // → true（@Inherited のおかげ）
```

ただし、これが効くのは**クラスへのアノテーション**だけ。
フィールドやメソッドへの `@Inherited` は効きません。
そして、**インタフェース**には伝搬しません（インタフェースの `@Inherited` は無視される）。

---

## 繰り返し可能アノテーション（`@Repeatable`）

Java 8 から、同じアノテーションを**複数回**付けられるようになりました。

```java
@Repeatable(Roles.class)
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface Role {
    String value();
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface Roles {
    Role[] value();
}
```

これで、

```java
@Role("admin")
@Role("editor")
public void doSomething() { }
```

と書けます。
読むときは `getAnnotationsByType(Role.class)` で配列として取れます。

---

## 「フレームワークの裏側」を想像する

ここまでの仕組みが分かると、見慣れたフレームワークの**裏側**が想像できるようになります。

### Spring の `@Component` スキャン

```java
@Component
public class UserService { }
```

Spring の起動時:

1. クラスパス（モジュールパス）をスキャン
2. すべてのクラスを `Class.forName` で読み込み
3. `@Component` が付いているかチェック
4. 付いていれば、コンストラクタを呼んでインスタンス化、コンテナに登録

これは、**第41章のクラスローダ + 第46章のリフレクション**の合わせ技です。

### Jackson の JSON マッピング

```java
public record User(String name, int age) {}

User u = mapper.readValue("{\"name\":\"Alice\",\"age\":30}", User.class);
```

Jackson の処理:

1. `User.class` のフィールドとアノテーションを取得
2. JSON の各キーと、フィールド名（または `@JsonProperty` の値）を照合
3. リフレクションで、レコードのコンストラクタを呼ぶ

`User` がレコードでなくふつうのクラスなら、

1. 引数なしコンストラクタで `new User()`
2. 各フィールドに、リフレクションで `setAccessible(true)` してから値をセット

という流れです。
この `setAccessible(true)` のために、JPMS では `opens` 宣言が必要になる、というのも納得できるはずです。

---

## まとめると

- アノテーションを実行時に読むには **`RetentionPolicy.RUNTIME`**
- カスタムアノテーションは `@interface` で宣言、`@Retention` と `@Target` を指定
- `AnnotatedElement.getAnnotation(...)` で読み取り、`isAnnotationPresent(...)` で存在チェック
- `@Inherited` で、スーパークラスのアノテーションをサブクラスに伝搬（クラスのみ）
- `@Repeatable` で、同じアノテーションを複数回付けられる
- **フレームワーク（Spring・Jackson・JUnit）の裏では、すべてこれが動いている**

次の節では、リフレクションよりずっと**高速**な代替 ―― **MethodHandle** を見ていきます。

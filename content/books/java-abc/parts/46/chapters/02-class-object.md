---
title: Class オブジェクトを取得する
llm: true
---

## `Class<?>` オブジェクトを取得する

リフレクションは、すべて `Class<?>` から始まります。
この節では、`Class<?>` を取得する **3 つの方法**と、それぞれの使い分けを整理します。

---

## 方法1: クラスリテラル ―― `String.class`

最もシンプルな取得方法です。

```java
Class<String> stringClass = String.class;
Class<int[]> intArrayClass = int[].class;
Class<Integer> intClass = int.class;       // プリミティブの Class<?>（Integer ではない）
Class<Void> voidClass = void.class;        // void の Class<?>
```

- コンパイル時に型が**決まっている**ときに使う
- 型安全（`Class<String>` のように型パラメータが付く）
- **最速**（コンパイル時に解決される）

第41章で見たとおり、これは**初期化を走らせません**。`Class<?>` オブジェクトを取得するだけです。
ふつうの Java コードでは、これを使うことがほとんどです。

---

## 方法2: `getClass()` ―― インスタンスから取り出す

すでに**インスタンスがある**とき、その**実体の型**を取り出すには `getClass()` です。

```java
Object obj = "hello";
Class<?> clazz = obj.getClass();   // class java.lang.String
```

注意点が 2 つあります。

### 注意1: コンパイル時の型ではなく、**実行時の型**

```java
Number n = Integer.valueOf(42);
Class<?> c = n.getClass();   // class java.lang.Integer（Number ではない）
```

`Number` 型の変数でも、実体が `Integer` なら `Integer.class` が返ります。
これは、**動的束縛**（第15章）と同じ原理です。

### 注意2: 戻り値が **`Class<? extends T>`**

```java
String s = "x";
Class<? extends String> c = s.getClass();   // ワイルドカードあり
```

これは「**`String` か、その派生型**」を表しています。
`String` は `final` なので実態は `Class<String>` ですが、API のシグネチャ上はワイルドカードになっています。

---

## 方法3: `Class.forName(...)` ―― 名前から動的に取得

クラス名を**文字列**で持っているときの最強の道具です。

```java
Class<?> clazz = Class.forName("com.example.User");
```

これがリフレクションの**本領**です。
たとえば、

- 設定ファイルから `class: com.example.UserService` を読んで、それをインスタンス化する
- プラグイン jar の中のクラス名を、起動時に渡された引数から決める

といった、**コンパイル時には決まらない型**を扱えます。

### 第41章のおさらい: `Class.forName` は **初期化を走らせる**

```java
Class<?> c = Class.forName("com.example.Foo");
// ↑ ここで Foo の static 初期化が走る
```

第41章で触れたとおり、`Class.forName("Foo")` は**初期化まで走らせます**。
JDBC ドライバの登録などで、これが使われていたのは、`DriverManager.register` を `static` ブロックで呼ばせるためでした。

「**初期化を走らせたくない**」場合は、3 引数版を使います。

```java
ClassLoader cl = MyClass.class.getClassLoader();
Class<?> c = Class.forName("com.example.Foo", false, cl);   // false = 初期化しない
```

第 2 引数 `false` で、初期化をスキップできます。

### 失敗時の例外

`Class.forName("...")` は、**`ClassNotFoundException`** を投げます。
これは**チェック例外**なので、try-catch か `throws` が必要です。

```java
try {
    Class<?> c = Class.forName(name);
} catch (ClassNotFoundException e) {
    log.warn("class not found: " + name, e);
}
```

---

## どれを使うか ―― 早見表

3 つの方法を、ユースケースで整理します。

| ユースケース | 推奨 |
|---|---|
| **コンパイル時に型が分かる** | `String.class` |
| **インスタンスがあり、実行時の型が知りたい** | `obj.getClass()` |
| **クラス名が文字列で来る** | `Class.forName(name)` |
| 初期化を走らせたくない | `Class.forName(name, false, cl)` |

---

## クラス階層をたどる

`Class<?>` を取得したら、その**スーパークラス**や**インタフェース**もたどれます。

```text
jshell> ArrayList.class.getSuperclass()
$1 ==> class java.util.AbstractList

jshell> ArrayList.class.getInterfaces()
$2 ==> Class[5] { interface java.util.List, interface java.util.RandomAccess, ... }

jshell> Object.class.getSuperclass()
$3 ==> null
```

`getSuperclass()` は親クラスを返します（`Object` の親は `null`）。
`getInterfaces()` は**直接実装している**インタフェースの一覧で、親クラスが実装しているものは含まれません。
完全な「実装している全インタフェース」が欲しければ、再帰的に親をたどる必要があります。

---

## クラスの**種類**を判別する

`Class<?>` には、その**性質**を判定するメソッドが揃っています。

| メソッド | 何を判別するか |
|---|---|
| `isInterface()` | インタフェース? |
| `isAbstract()` を相当する `Modifier.isAbstract(clazz.getModifiers())` | 抽象クラス? |
| `isAnnotation()` | アノテーション? |
| `isEnum()` | enum? |
| `isRecord()` | record?（Java 16+） |
| `isPrimitive()` | プリミティブ? |
| `isArray()` | 配列? |
| `isSealed()` | sealed?（Java 17+） |
| `isAssignableFrom(other)` | `other` をこの型に代入できる? |
| `isInstance(obj)` | この型のインスタンスか?（`instanceof` の動的版） |

特に `isInstance(obj)` は、`instanceof` を**動的にやりたい**ときに便利です。

```java
if (clazz.isInstance(obj)) {
    Object cast = clazz.cast(obj);   // 型安全にキャスト
}
```

`clazz.cast(obj)` は、`(T) obj` の**チェックつき**版です（失敗時は `ClassCastException`）。

---

## 「**`Class<T>` の `T`**」を活用する

`Class<?>` を「**`Class<T>` として持ち回る**」ようにすると、**型安全な API** を作れます。

```java
public <T> T createInstance(Class<T> clazz) throws Exception {
    return clazz.getConstructor().newInstance();
}

// 使う側
String s = createInstance(String.class);   // 戻り値は String 型
User u = createInstance(User.class);
```

`Class<T>` を引数で受け取ることで、`newInstance()` の戻り値が `T` 型になり、**キャストが要らなく**なります。
これは、Jackson の `objectMapper.readValue(json, User.class)` と同じパターンで、リフレクションでよく使われる定石です。

---

## まとめると

- `Class<?>` の取得方法は 3 つ:
  - **クラスリテラル**: `String.class`（コンパイル時に決まる）
  - **`getClass()`**: インスタンスから（実行時の型）
  - **`Class.forName(...)`**: 文字列から（初期化が走る点に注意）
- `Class.forName(name, false, cl)` で**初期化なし**で取得できる
- スーパークラス・インタフェースは `getSuperclass()` / `getInterfaces()` でたどれる
- 型の判定は `isInterface()` / `isEnum()` / `isRecord()` / `isInstance(obj)` などで
- **`Class<T>`** を引数に持つ API は、型安全で使いやすい

次の節では、`Class<?>` から取り出した **`Field`** と **`Method`** を使って、フィールドの読み書きとメソッドの呼び出しを実際に書いてみます。

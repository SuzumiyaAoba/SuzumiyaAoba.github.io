---
title: よくあるつまずき
llm: true
---

## よくあるつまずき

第46章の総まとめとして、ここまでで個別に触れきれなかった**細かいつまずき**を 7 つ整理します。

---

## つまずき1: 「`getMethod` と `getDeclaredMethod` のどっち?」

- **`getMethod(name, types...)`** ―― **public** のみ。**継承**しているメソッドも含む
- **`getDeclaredMethod(name, types...)`** ―― **そのクラスが宣言した**メソッド。アクセス修飾子問わず

`@Test` の付いたメソッドを探す、のような用途では `getDeclaredMethods()` が定石です。
親クラスのメソッドまで含めたいなら、自分で `getSuperclass()` をたどって再帰する必要があります。

---

## つまずき2: 「**`newInstance()` でコンストラクタ例外が握りつぶされる**」

`Class.newInstance()`（旧 API）の欠点が、これでした。

```java
clazz.newInstance();   // ← 古い API
```

このメソッドは、コンストラクタが投げる**checked 例外**を、何もしないで再投げします。
そのため、`InstantiationException` で握りつぶされる、というバグが起きやすかったのです。

Java 9 以降は **非推奨**。新しいコードは:

```java
clazz.getConstructor().newInstance();
```

を使います。例外は `InvocationTargetException` でラップされるので、`getCause()` で原因が辿れます。

---

## つまずき3: 「**ジェネリクスが消える**」

第1節で触れたとおり、リフレクションでジェネリクスの実引数を取るのは、**ほとんどの場面で**できません。

```java
List<String> list = new ArrayList<>();
list.getClass();   // ArrayList.class（String の情報は消えている）
```

「**この List は String の List**」を実行時に知りたい場合、

- **フィールド**や**メソッドの引数**として `List<String>` と宣言されている場所では、`Field.getGenericType()` で `ParameterizedType` を取得して読み解ける
- 値（リストの実体）から知る方法は**ない**

Jackson の `TypeReference<List<User>>` は、サブクラスの型情報を**コンパイル時に**保持し、リフレクションで読み取る、というトリックを使っています。

---

## つまずき4: 「**`getFields()` で全部見える、と思い込む**」

- **`getFields()`** ―― **public** のみ。**継承**したものを含む
- **`getDeclaredFields()`** ―― そのクラス宣言の**すべて**（private を含む）。継承は含まない

`getFields()` で「全フィールド」と思い込むと、private フィールドや、親クラスのフィールドが取れなくて困ります。
Jackson や Hibernate がやっているように、`getDeclaredFields()` を呼んで、親クラスを再帰でたどるのが定石です。

---

## つまずき5: 「**`Object[]` をそのまま `invoke` に渡そうとする**」

```java
Object[] args = {1, 2};
method.invoke(obj, args);
```

`invoke(receiver, Object...)` は可変長引数。`Object[]` を 1 つ渡すと、それを**展開**して引数として渡そうとします。
これは多くの場面で意図と合うのですが、**`Object[]` を引数 1 つとして渡したい**メソッドの場合は、

```java
method.invoke(obj, (Object) args);   // ← Object にキャストして 1 つの引数として渡す
```

のように、明示的にキャストする必要があります。
似た問題は、`Arrays.asList(Object...)` でも有名です。

---

## つまずき6: 「**ラムダ式は普通のリフレクションでは見えない**」

ラムダ式（`x -> x + 1` のような形）の中身は、**`invokedynamic` + `LambdaMetafactory`** で実装されています。
ふつうのリフレクション API（`getDeclaredMethods` など）から見ると、ラムダの中身は

```text line-numbers=false
private static java.lang.Object lambda$0(java.lang.Object);
```

のような**シンセティックメソッド**（`ACC_SYNTHETIC` フラグ付き）として現れます。
これを通常のメソッドと混同しないこと。

ラムダを「**それと知って**」扱いたいなら、`MethodHandle` + `MethodHandles.Lookup.unreflect(...)` + `LambdaMetafactory` という、もう一段難しい API を使います。

---

## つまずき7: 「**プロキシ**を忘れる」

ここまで触れませんでしたが、リフレクションの仲間に **`Proxy`** という機能があります。

```java
import java.lang.reflect.*;

interface Hello {
    String greet(String name);
}

Hello h = (Hello) Proxy.newProxyInstance(
    Hello.class.getClassLoader(),
    new Class<?>[] { Hello.class },
    (proxy, method, args) -> "Hello, " + args[0] + "!"
);
System.out.println(h.greet("Alice"));   // "Hello, Alice!"
```

これは、「**インタフェースを実装した動的なクラス**」を、実行時に作る仕組みです。
Spring の AOP、Hibernate の遅延ロード、JDBC のドライバ、MockitoのモックUI ―― すべて `Proxy` を使っています。

`Proxy` は**インタフェースに対してしか作れない**制約があり、クラスの動的プロキシは Cglib・Byte Buddy などの外部ライブラリが必要です。

---

## まとめると ―― 5 つの心得

第46章全体から、リフレクションとの付き合い方の心得を 5 つに集約します。

1. **業務コードでは使わない** ―― フレームワーク経由で利用する
2. **遅さを甘く見ない** ―― ホットパスでは `MethodHandle` を検討
3. **例外は `ReflectiveOperationException` で一括 catch**
4. **JPMS の `opens` との関係**を理解する
5. **「設計をだらしなくする」誘惑**に気をつける

リフレクションは、Java の「**動的な顔**」です。
コンパイル時に決まる「静的な顔」とは違う、もう一つの世界を見たことで、Java の表現力の広さを感じてもらえたら成功です。

次の節「用語集」で本章の言葉を整理し、第47章では、コンパイル時にコードを生成する**アノテーション処理**を扱います。

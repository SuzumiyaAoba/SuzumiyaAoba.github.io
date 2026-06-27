---
title: クラスローダ ― 必要なクラスを連れてくる
llm: true
co-author: ["Claude Opus 4.7"]
---

## クラスローダ ― 必要なクラスを連れてくる

JVM は、`java Hello` と打った瞬間に、世界中のすべてのクラスを読み込むわけではありません。
**必要になったとき**に、**必要なクラスだけ**を `.class` から読み込みます。
その仕事を担うのが、**クラスローダ**（Class Loader）です。

---

## 「読み込む」って何をしているのか

クラスローダの仕事は、ふつうに「ファイルを読む」ことではありません。
JVM の中で、クラスは次の 3 段階を経て「**使える状態**」になります。

| 段階 | 何をするか |
|---|---|
| **ローディング**（Loading） | `.class` のバイトをメモリに読み込み、`Class<?>` オブジェクトを作る |
| **リンキング**（Linking） | 検証（Verify）・準備（Prepare、static 変数の領域確保）・解決（Resolve、シンボル参照を実体に） |
| **初期化**（Initialization） | `<clinit>`（static 初期化ブロックと static フィールドの代入）を実行する |

「**クラスローダ**」というと最初の段階だけのように聞こえますが、上の 3 つをまとめて担当する仕組みだと思っておくのがちょうどよいです。

特に最後の**初期化**は、「**初めて使われたとき**」に走ります。
`new MyClass()` した瞬間、`MyClass.staticMethod()` を呼んだ瞬間 ―― そのとき初めて static の初期化が動きます。
これが、「**static フィールドの初期化順が読みにくい**」というおなじみのつまずきの根っこです。

---

## 3 階層のクラスローダ

Java の標準クラスローダは、**3 階層**で構成されます。

```text
[Bootstrap Class Loader]        ← java.lang.* など、JDK の中核
        ↑（親）
[Platform Class Loader]         ← java.sql.* など、プラットフォームライブラリ
        ↑（親）
[Application Class Loader]      ← クラスパス（あなたのアプリ）
```

それぞれの担当範囲は次のとおりです。

| クラスローダ | 何を読むか | 実装 |
|---|---|---|
| **Bootstrap** | `java.lang.*`、`java.util.*` などの中核 | JVM 自身（C++）。Java から見ると `null` |
| **Platform** | `java.sql`、`java.xml` などの標準モジュール | `jdk.internal.loader.ClassLoaders$PlatformClassLoader` |
| **Application** | クラスパスや `-classpath` で指定したクラス | `jdk.internal.loader.ClassLoaders$AppClassLoader` |

> Java 8 までは「Bootstrap → Extension → System（=Application）」の3階層でした。
> Java 9 でモジュールシステム（第45章）が入ったタイミングで、Extension が **Platform** に置き換わっています。

---

## 実機で覗いてみる

それぞれのクラスが、どのクラスローダから読まれたかは、`getClassLoader()` で見えます。
jshell でそのまま試せます。

```text
jshell> String.class.getClassLoader()
$1 ==> null

jshell> Class.forName("javax.sql.DataSource").getClassLoader()
$2 ==> jdk.internal.loader.ClassLoaders$PlatformClassLoader@17f052a3

jshell> new Object().getClass().getClassLoader()
$3 ==> null
```

- `String` と `Object` は **Bootstrap** が読むので `null`
- `javax.sql.DataSource` は **Platform** が読むので `PlatformClassLoader`
- あなたが書いたクラス（jshell 上で定義したクラスを含む）は **Application** 系

`null` は「**読み込んでない**」ではなく、「**Bootstrap が読んだ**」という意味です。
Bootstrap は JVM 本体に組み込まれていて、Java の `ClassLoader` クラスでは表現できないため、`null` を返す仕様になっています。

---

## 「親に聞いてみる」 ―― 親委譲モデル

3 階層が大事なのは、ただ「3 つあるから」ではありません。
クラスローダには、**親委譲モデル**（Parent Delegation Model）という重要なルールがあります。

> あるクラスローダが「`Foo` を読んで」と頼まれたら、**まず親に聞く**。
> 親が読めるなら、親に任せる。
> 親が読めないと言ったら、**自分で**読みに行く。

たとえば「`java.lang.String` を読んで」と Application Class Loader に頼んでも、

```text
Application → Platform → Bootstrap
                        （Bootstrap が読める）
                ←──────────（Bootstrap が読んだ）
```

最終的には Bootstrap が読みます。
このルールがあるおかげで、

- **同じ名前のクラスは、常に同じものになる**（誰が頼んでも `String` は同じ `String`）
- 悪意あるユーザーが「**偽の `java.lang.String`**」を持ち込んでも、Bootstrap が先に本物を読むので置き換えできない

つまり、親委譲モデルは**型の同一性とセキュリティ**を支える根幹です。
親委譲モデルを意図的に破る `ClassLoader` を作ることもでき、これは Tomcat や OSGi のような**プラグイン基盤**でアプリ間を隔離するのに使われます（本書では扱いません）。

---

## クラスローダ階層を歩いてみる

「自分が動いている JVM の階層」を歩いてみるコードです。

```java
ClassLoader cl = ClassLoader.getSystemClassLoader();
while (cl != null) {
    System.out.println(cl);
    cl = cl.getParent();
}
System.out.println("(bootstrap = null)");
```

jshell に流すと、こう出ます。

```text
jdk.internal.loader.ClassLoaders$AppClassLoader@7a8c5397
jdk.internal.loader.ClassLoaders$PlatformClassLoader@439f5b3d
(bootstrap = null)
```

`System` クラスローダ（= Application）→ Platform → Bootstrap（`null`）と、ちゃんと 3 段になっているのが確認できます。

---

## いつ「読み込む」のか ―― 遅延の妙

クラスは、起動時にすべて読まれるわけではありません。
**初めて使われた瞬間**に、ローディング → リンキング → 初期化が走ります。
試してみましょう。

```java
public class LazyDemo {
    public static void main(String[] args) {
        System.out.println("main 開始");
        Trigger.hello();           // ここで Trigger が初期化される
        System.out.println("main 終了");
    }
}
class Trigger {
    static {
        System.out.println("Trigger 初期化");
    }
    static void hello() {
        System.out.println("Trigger.hello");
    }
}
```

実行すると、次の順で出ます。

```text
main 開始
Trigger 初期化
Trigger.hello
main 終了
```

`main` が始まってから、`Trigger.hello()` を呼ぶ直前に「**Trigger 初期化**」が出ました。
**使う寸前まで、初期化は走らない**のが Java の仕様です（JLS §12.4.1）。

> **`Class.forName("...")` と `MyClass.class` の違い**
>
> `Class.forName("Foo")` は、対象クラスを**初期化**まで走らせます。
> 一方、`Foo.class`（クラスリテラル）は、`Class<?>` オブジェクトを得るだけで、**初期化はしません**。
> JDBC ドライバの登録などで `Class.forName(...)` が使われていたのは、この**初期化を強制的に走らせる**ためでした。

---

## 「読み込めない」エラーの読み分け

クラスローディングに関わる例外は、初学者には紛らわしいです。
基本の 3 つだけ整理しておきます。

| エラー | いつ出るか |
|---|---|
| `ClassNotFoundException` | `Class.forName("...")` などで **明示的にロードを試みたとき**、`.class` が見つからない |
| `NoClassDefFoundError` | ロードはできたが、**リンキングや初期化中**に依存クラスが見つからない、または初期化に失敗した |
| `UnsupportedClassVersionError` | `.class` のクラスファイルバージョン（第6節）が、実行中の JVM より**新しすぎる** |

実務で多いのは `NoClassDefFoundError` です。
これは「**コンパイル時にはあったクラスが、実行時のクラスパスにない**」という、依存関係の問題でほぼ間違いありません。
ビルドツール（第31章）でクラスパスを通し直しましょう。

---

## まとめると

- クラスは「**ロード → リンク → 初期化**」の3段階で「使える状態」になる
- クラスローダは **3 階層**（Bootstrap・Platform・Application）
- **親委譲モデル**で、同じクラス名なら誰が読んでも同じ型になる
- クラスは「**使われた瞬間**」に初期化される（遅延ロード）
- エラーは `ClassNotFoundException` / `NoClassDefFoundError` / `UnsupportedClassVersionError` を区別する

次の節では、クラスローダが読み込む「**バイトコード**」そのものを `javap` で覗いていきます。

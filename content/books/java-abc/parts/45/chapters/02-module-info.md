---
title: module-info.java を書く
llm: true
---

## `module-info.java` を書く

モジュールシステムを使うには、`module-info.java` という**メタファイル**を 1 つ書くだけです。
この節では、最小限の `module-info.java` を作って、実際にコンパイル・実行までしてみます。

---

## ディレクトリ構造の慣例

JPMS のモジュールには、**慣例的な**ディレクトリ構造があります。

```text line-numbers=false
src/
  com.example.greet/                  ← モジュール名のディレクトリ
    module-info.java                  ← モジュール宣言
    com/
      example/
        greet/
          Greeter.java                ← パッケージ階層は今までと同じ
```

ポイントは:

- **モジュール名のディレクトリ**を作って、その下にソースを置く
- `module-info.java` は、**モジュールのルート**に置く
- パッケージのディレクトリ階層は、**従来どおり**

モジュール名は、**逆ドメイン記法**（`com.example.greet`）が一般的です。
パッケージ名と同じにすると分かりやすいですが、別物として考えます（モジュールは**複数パッケージを束ねる**単位）。

---

## 最小の `module-info.java`

最も単純なモジュールはこれだけです。

```java
// src/com.example.greet/module-info.java
module com.example.greet {
    exports com.example.greet;
}
```

ここで宣言しているのは、

- **モジュール名**: `com.example.greet`
- **公開するパッケージ**: `com.example.greet`

依存（`requires`）は何も書いていません。これは、**`java.base` だけ**に依存する状態です。
（`java.base` は、明示しなくても**自動的に**依存対象になります。`java.lang.*` や `java.util.*` が使えるのはそのためです。）

そして、コンパイル対象のクラスはこれ:

```java
// src/com.example.greet/com/example/greet/Greeter.java
package com.example.greet;

public class Greeter {
    public static String greet(String name) {
        return "Hello, " + name + "!";
    }
    public static void main(String[] args) {
        System.out.println(greet(args.length > 0 ? args[0] : "world"));
    }
}
```

---

## コンパイルと実行

モジュールをコンパイルするには、**`--module-source-path`** と **`--module`** を使います。

```text line-numbers=false
$ javac -d out --module-source-path src --module com.example.greet
```

これで `out/com.example.greet/com/example/greet/Greeter.class` ができます。
出力ディレクトリの中も、**モジュール名のサブディレクトリ**になります。

実行は、`-cp` ではなく **`--module-path`** と **`--module`** を使います。

```text line-numbers=false
$ java --module-path out --module com.example.greet/com.example.greet.Greeter Alice
Hello, Alice!
```

`--module com.example.greet/com.example.greet.Greeter` は、

- 起動モジュール: `com.example.greet`
- メインクラス: `com.example.greet.Greeter`

の意味です。

ちなみに、`module-info.java` に **`main` クラスを書いておく**こともできます:

```java
module com.example.greet {
    exports com.example.greet;
}
// jar にしたとき、`Main-Class` がついていれば省略可
```

実行時には、`--module com.example.greet`（クラス名なし）で起動できます。

---

## `module-info.java` で書ける宣言

`module-info.java` の中には、次の宣言が書けます。
全部を一度に覚える必要はありません。

| 宣言 | 何を意味するか |
|---|---|
| `module 名前 { ... }` | モジュールの宣言 |
| `exports パッケージ` | このパッケージを**全モジュール**に公開する |
| `exports パッケージ to モジュール` | このパッケージを**指定モジュール**にだけ公開（**Qualified Export**） |
| `requires モジュール` | このモジュールに依存する |
| `requires transitive モジュール` | **依存も含めて伝搬**させる |
| `requires static モジュール` | コンパイル時のみ依存（実行時は任意） |
| `opens パッケージ` | **リフレクション**用に開放 |
| `opens パッケージ to モジュール` | 指定モジュールにだけ開放 |
| `uses サービス` | このサービスを使う（後述の ServiceLoader） |
| `provides サービス with 実装` | このサービスの実装を提供する |
| `open module` | モジュール全体を**リフレクションに開放** |

特によく使うのは、`exports`、`requires`、`requires transitive`、`opens` の 4 つです。
これらを順に見ていきます。

---

## `requires` ―― 依存を宣言する

別のモジュールを使うときは、**`requires`** で宣言します。

```java
module com.example.app {
    requires com.example.lib;
}
```

これで、`com.example.app` の中から `com.example.lib` の**公開パッケージ**（`exports` されたもの）を import できます。
書いていないモジュールのクラスは、たとえクラスパスに jar があっても**コンパイルエラー**になります。

```java
// com.example.app の Main.java
package com.example.app;
import com.example.lib.Calc;   // ← com.example.lib が requires されているから OK

public class Main {
    public static void main(String[] args) {
        System.out.println("square(5) = " + Calc.square(5));
    }
}
```

複数モジュールをまとめてコンパイルするときも、`--module` にカンマ区切りで指定します。

```text line-numbers=false
$ javac -d out --module-source-path src --module com.example.app,com.example.lib
$ java --module-path out --module com.example.app/com.example.app.Main
square(5) = 25
```

依存の方向が**明示**されていることが、クラスパス世界との一番の違いです。

---

## `exports` ―― 公開パッケージを宣言する

`exports` を書かないパッケージは、**他のモジュールから一切見えません**。

```java
module com.example.lib {
    exports com.example.lib;
    // com.example.lib.internal は exports していない → 外から見えない
}
```

これで、

- `com.example.lib.Calc` ―― 外から使える
- `com.example.lib.internal.Helper` ―― 外からは見えない（`public` でも）

ということになります。
「**public でも外から見えない**」 ―― ここが、JPMS で増えた**新しい可視性**です。

| | クラスパス | モジュールパス |
|---|---|---|
| `public` クラス | どこからでも見える | **同じモジュール内**または **`exports` されたパッケージから**だけ見える |
| `protected`、package-private | 従来どおり | 従来どおり |

「**真に内部**」を表せるようになったことで、API 設計の余地が広がりました。

---

## `module-info.java` のテンプレート

実務で `module-info.java` を書くときの、典型的なテンプレートを置いておきます。

```java
/**
 * 顧客管理ライブラリ。
 * <p>
 * 公開 API は {@link com.example.customer} のみ。
 */
module com.example.customer {
    // 必要な依存
    requires com.example.common;
    requires java.sql;

    // ライブラリ利用者にも見せる依存
    requires transitive java.logging;

    // 公開 API
    exports com.example.customer;

    // テスト用にだけ公開（Qualified Export）
    exports com.example.customer.internal to com.example.customer.test;
}
```

このように、

- **必要な依存**（`requires`）
- **伝搬する依存**（`requires transitive`）
- **公開 API**（`exports`）
- **限定公開**（`exports ... to`）

を並べるのが、よくある形です。
コメントで「**公開 API はどこ**」を書いておくと、利用者にも親切です。

---

## まとめると

- モジュールは `module-info.java` で**宣言**する
- ディレクトリは **`src/モジュール名/`** にソースを置く慣例
- コンパイル: **`--module-source-path`** + **`--module`**
- 実行: **`--module-path`** + **`--module モジュール/クラス`**
- 最小限の宣言は **`exports`** と **`requires`** の 2 つだけ
- `exports` していないパッケージは、`public` でも**外から見えない**

次の節では、`exports` と `requires` の**より細かい使い方**（`transitive`、`static`、Qualified Export）を見ていきます。

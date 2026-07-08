---
title: Maven 入門
llm: true
co-author: ["Claude Opus 4.7"]
---

## Maven 入門

それでは、実際に **Maven** を動かして、プロジェクトを作り、コンパイル・テスト・パッケージングまでやってみましょう。
本書のサンプルは、**Maven 3.9 系・Java 25** で実機検証しています。

> **インストールについて**
>
> Maven のインストール方法は環境によって異なります。
> `mise`、`SDKMAN`、Homebrew（macOS）、`apt`（Linux）など、好みのパッケージ管理ツールで導入してください。
> インストールできたら、ターミナルで `mvn --version` を叩いて、バージョンが表示されることを確認します。

---

## プロジェクトの全体像

これから、こんなプロジェクトを作ります。

```text line-numbers=false
hello-maven/
├── pom.xml                                    ← Maven の設定ファイル
└── src/
    ├── main/java/com/example/
    │   └── Hello.java                         ← 本番コード
    └── test/java/com/example/
        └── HelloTest.java                     ← テストコード
```

ファイル 3 つだけです。手で作っても、すぐ終わります。

---

## ステップ1 ― 設定ファイル `pom.xml` を書く

プロジェクトのルートに、次の `pom.xml` を作ります。
POM は **Project Object Model** の略で、Maven プロジェクトの設計図にあたるファイルです。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>hello-maven</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <maven.compiler.release>25</maven.compiler.release>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>5.11.3</version>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.5.2</version>
            </plugin>
        </plugins>
    </build>
</project>
```

各要素を順番に見ていきます。

### プロジェクトを識別する部分

```xml
<groupId>com.example</groupId>
<artifactId>hello-maven</artifactId>
<version>1.0.0</version>
<packaging>jar</packaging>
```

| 要素 | 意味 |
|---|---|
| `groupId` | プロジェクトを提供する組織。逆ドメイン名で書くのが慣習 |
| `artifactId` | プロジェクト名。フォルダ名と合わせるのが普通 |
| `version` | プロジェクトのバージョン |
| `packaging` | 出力形式。`jar`・`war`・`pom` などがある |

これは、前節で学んだ **GAV 座標**そのものです。
自分のプロジェクト自身にも、ライブラリと同じ住所を与えるわけです。

### 設定の値をまとめる `<properties>`

```xml
<properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <maven.compiler.release>25</maven.compiler.release>
</properties>
```

- **`project.build.sourceEncoding`** … ソースコードの文字コード。日本語コメントを安全に扱うため、必ず `UTF-8` にします
- **`maven.compiler.release`** … コンパイル対象の Java バージョン。本書では `25` を指定します。`source` / `target` ではなく `release` を使うのが、Java 9 以降の標準です

### 依存ライブラリを書く `<dependencies>`

```xml
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>5.11.3</version>
    <scope>test</scope>
</dependency>
```

第32章で使う **JUnit 5**（Jupiter）を、テスト用の依存として追加しています。
`<scope>test</scope>` を付けると、「**テストのときだけ**使う」という意味になります。本番コードからは見えません。

### プラグインを設定する `<build>`

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>3.5.2</version>
</plugin>
```

**Surefire**（シュアファイア）は、Maven でテストを実行するプラグインです。
Maven 内蔵のバージョンが古いと JUnit 5 を実行できないことがあるので、新しめのバージョンを明示しておきます。

---

## ステップ2 ― ソースコードを書く

Maven のお約束に従って、ファイルを置きます。

**`src/main/java/com/example/Hello.java`**

```java
package com.example;

public class Hello {
    public static String greet(String name) {
        return "Hello, " + name + "!";
    }

    public static void main(String[] args) {
        System.out.println(greet("Maven"));
    }
}
```

**`src/test/java/com/example/HelloTest.java`**

```java
package com.example;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class HelloTest {
    @Test
    void greetReturnsHelloMessage() {
        assertEquals("Hello, Java!", Hello.greet("Java"));
    }
}
```

テストの中身は次の章で詳しく学ぶので、ここでは「`assertEquals(期待値, 実際の値)` で値を比べる」とだけ理解しておけば十分です。

---

## ステップ3 ― コンパイルする

プロジェクトのルートで、次のコマンドを実行します。

```text line-numbers=false
$ mvn compile
```

実機での出力（抜粋）はこうなります（初回は依存の自動ダウンロードがあるため、たくさんのログが流れます）。

```text line-numbers=false
[INFO] --- compiler:3.13.0:compile (default-compile) @ hello-maven ---
[INFO] Recompiling the module because of changed source code.
[INFO] Compiling 1 source file with javac [debug release 25] to target/classes
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

最後に **`BUILD SUCCESS`** と出れば成功です。
`target/classes/com/example/Hello.class` に、コンパイル結果が出力されています。

> **補足: `target/` ディレクトリは Maven の作業場所**
>
> `mvn` を実行すると、プロジェクトのルートに **`target/`** フォルダが作られます。
> ここに、コンパイル結果・テスト結果・最終 JAR など、すべての**生成物**が置かれます。
> Git で管理するときは、`target/` を `.gitignore` に追加するのが定番です。

---

## ステップ4 ― テストを実行する

```text line-numbers=false
$ mvn test
```

実機での出力（抜粋）。

```text line-numbers=false
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.example.HelloTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.018 s -- in com.example.HelloTest
[INFO]
[INFO] Results:
[INFO]
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO]
[INFO] BUILD SUCCESS
```

テスト 1 件が通り、`BUILD SUCCESS` です。
`Tests run: 1, Failures: 0` を確認するクセをつけておきましょう。**この行を見ずに通った気になるのは、よくある事故**です。

---

## ステップ5 ― JAR を作る

```text line-numbers=false
$ mvn package
```

実機での出力（抜粋）。

```text line-numbers=false
[INFO] Building jar: /path/to/hello-maven/target/hello-maven-1.0.0.jar
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
```

`target/hello-maven-1.0.0.jar` という、配布用の JAR ファイルが生成されました。
ファイル名は **`{artifactId}-{version}.jar`** という形式です。

実際に動かしてみましょう。

```text line-numbers=false
$ java -cp target/hello-maven-1.0.0.jar com.example.Hello
Hello, Maven!
```

`Hello, Maven!` が表示されれば成功です。

---

## ライフサイクル ― フェーズが順番に積み上がる

ここまでで、`compile` → `test` → `package` という 3 つのコマンドを使いました。
これらは、Maven の **ビルドライフサイクル**（build lifecycle）の中の**フェーズ**（phase）と呼ばれるものです。

Maven の標準ライフサイクル（`default`）には、いくつものフェーズがあり、**順番に並んでいます**。

| フェーズ | やること |
|---|---|
| `validate` | プロジェクト設定が正しいか確認 |
| `compile` | 本番ソースをコンパイル |
| `test-compile` | テストソースをコンパイル |
| `test` | テストを実行 |
| `package` | JAR / WAR を作る |
| `verify` | パッケージを検証 |
| `install` | ローカルリポジトリ（`~/.m2/repository`）に保存 |
| `deploy` | リモートリポジトリに公開 |

ここで大事なルールは、

> **あるフェーズを指定すると、それより前のフェーズもすべて自動で実行される**

ということです。
だから、`mvn package` を叩くと、内部では `validate` → `compile` → `test-compile` → `test` → `package` がぜんぶ走っているのです。
あなたが書くのは**いちばん奥のフェーズだけ**で十分、ということです。

> **よく使うコマンドのまとめ**
>
> | コマンド | 用途 |
> |---|---|
> | `mvn compile` | 本番コードだけコンパイル |
> | `mvn test` | テストまで実行 |
> | `mvn package` | JAR / WAR を作る |
> | `mvn install` | ローカルリポジトリに保存（他プロジェクトから依存できる） |
> | `mvn clean` | `target/` を削除（クリーンビルドしたいとき） |
> | `mvn clean package` | クリーン → コンパイル → テスト → パッケージング |

実務でいちばんよく見るのは、**`mvn clean package`** です。
「いったん全部消して、ゼロからもう一度作る」というおまじないと覚えておいてかまいません。

---

## まとめ

- Maven は **`pom.xml`** で設定し、`mvn` コマンドで動かします
- 標準ディレクトリ構造（`src/main/java` / `src/test/java`）を守れば、最小限の設定でビルドできます
- 依存は **GAV 座標**で書き、`scope` で利用範囲を制限できます
- フェーズは順番に積み上がるので、奥のフェーズを指定すれば手前も自動で走ります
- 実務では **`mvn clean package`** がよく使われます

次の節では、もう 1 つのビルドツール ―― **Gradle** をさわってみます。

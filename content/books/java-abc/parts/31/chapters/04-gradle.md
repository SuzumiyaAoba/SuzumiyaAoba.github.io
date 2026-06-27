---
title: Gradle 入門
llm: true
co-author: ["Claude Opus 4.7"]
---

## Gradle 入門

続いて、もう 1 つの主要ビルドツール **Gradle**（グレイドル）をさわってみます。
本書のサンプルは、**Gradle 9 系・Java 25** で実機検証しています。

> **インストールについて**
>
> Gradle のインストールは、Maven と同じく `mise`・`SDKMAN`・Homebrew などで導入できます。
> インストールできたら `gradle --version` で確認します。
> なお、後述の **Gradle Wrapper** を使う場合、グローバルな Gradle のインストールは**必須ではありません**。

---

## Gradle の特徴 ― Maven との違い

Maven と比較したときの Gradle の主な特徴を、3 つ挙げます。

1. **Kotlin / Groovy で書ける**
    XML ではなく、**Kotlin**（または Groovy）という本物のプログラミング言語で設定を書きます。
    本書では Kotlin DSL（`build.gradle.kts`）を採用します。
2. **タスクが柔軟**
    Maven は「ライフサイクルのフェーズ」中心ですが、Gradle は「**タスク**」を組み立てる発想です。
    既存タスクを上書きしたり、新しいタスクを書いたりするのが、`pom.xml` よりずっとラクです。
3. **ビルドが速い**
    変更されていない部分をスキップする**インクリメンタルビルド**、結果を再利用する**ビルドキャッシュ**などのおかげで、2 回目以降のビルドが速いです。

これらが、近年 Android や大規模プロジェクトで Gradle が好まれる理由です。

---

## プロジェクトの全体像

Maven と同じく、最小のプロジェクトを作ります。

```text
hello-gradle/
├── settings.gradle.kts                        ← プロジェクト全体の定義
├── build.gradle.kts                           ← ビルドの設定
└── src/
    ├── main/java/com/example/
    │   └── Hello.java
    └── test/java/com/example/
        └── HelloTest.java
```

`src/` 配下のお約束は **Maven とまったく同じ**です。
これが Gradle のうれしいところで、Maven のプロジェクトを Gradle に移行するときに、ソースコードを動かす必要がありません。

---

## ステップ1 ― `settings.gradle.kts` を書く

```kotlin
rootProject.name = "hello-gradle"
```

たった 1 行。
プロジェクトの名前を決めるだけのファイルです。
複数モジュールに分けるとき（マルチプロジェクト）に、ここで子プロジェクトを宣言しますが、入門段階では名前を書くだけで十分です。

---

## ステップ2 ― `build.gradle.kts` を書く

ここがメインです。

```kotlin
plugins {
    application
}

repositories {
    mavenCentral()
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

dependencies {
    testImplementation("org.junit.jupiter:junit-jupiter:5.11.3")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

application {
    mainClass = "com.example.Hello"
}

tasks.test {
    useJUnitPlatform()
}
```

順番に見ていきます。

### `plugins` ― プラグインを宣言する

```kotlin
plugins {
    application
}
```

Gradle の機能のほとんどは**プラグイン**として提供されます。
ここで使った `application` プラグインは、Java の実行可能アプリを作るためのものです。
これだけで、

- `java` プラグイン（コンパイル・テスト・JAR 作成）
- `run` タスク（`gradle run` でアプリを起動できる）

が、ぜんぶまとめて有効になります。

### `repositories` ― ライブラリの取得元

```kotlin
repositories {
    mavenCentral()
}
```

Maven Central を依存ライブラリの取得元として宣言します。
Maven と違って、Gradle では**取得元を明示的に書く必要がある**点に注意してください（書かないとどこにも取りにいきません）。

### `java { toolchain { ... } }` ― 使う JDK を指定する

```kotlin
java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}
```

「このプロジェクトは Java 25 を使う」と宣言しています。
Gradle は、必要なら**自動で JDK をダウンロード**してくれます。マシンに 21 しか入っていなくても、25 を指定すれば 25 を取ってきて使ってくれる、という賢いしくみです。

### `dependencies` ― 依存ライブラリ

```kotlin
dependencies {
    testImplementation("org.junit.jupiter:junit-jupiter:5.11.3")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}
```

Maven の `<scope>` に相当するのが、**設定（configuration）名**です。

| 設定名 | 意味 |
|---|---|
| `implementation` | 本番コードで使う |
| `testImplementation` | テストコードでだけ使う |
| `testRuntimeOnly` | テスト実行時にだけ必要（コンパイル時は不要） |

`groupId:artifactId:version` を 1 行で書けるのが、Gradle の手軽さです。
JUnit 5 は実行時に Platform Launcher が必要なので、`testRuntimeOnly` で追加しています。

### `application` ― メインクラス

```kotlin
application {
    mainClass = "com.example.Hello"
}
```

`gradle run` で起動するメインクラスを指定します。

### `tasks.test { useJUnitPlatform() }` ― JUnit 5 を有効化

```kotlin
tasks.test {
    useJUnitPlatform()
}
```

Gradle は、伝統的に古い JUnit 4 を前提にしているので、JUnit 5（Jupiter）を使うときはこの 1 行を書きます。
最近のテンプレートでは自動で書かれていますが、覚えておいて損はありません。

---

## ステップ3 ― ソースコードを書く

Maven の章と**完全に同じ**コードを置けます。

**`src/main/java/com/example/Hello.java`**

```java
package com.example;

public class Hello {
    public static String greet(String name) {
        return "Hello, " + name + "!";
    }

    public static void main(String[] args) {
        System.out.println(greet("Gradle"));
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

---

## ステップ4 ― ビルドする

プロジェクトのルートで、次のコマンドを実行します。

```text
$ gradle build
```

実機での出力（抜粋）。

```text
> Task :compileJava
> Task :processResources NO-SOURCE
> Task :classes
> Task :jar
> Task :compileTestJava
> Task :test
> Task :check
> Task :build

BUILD SUCCESSFUL in 13s
7 actionable tasks: 7 executed
```

`gradle build` 1 つで、

- コンパイル（`compileJava` / `compileTestJava`）
- テスト実行（`test`）
- JAR 作成（`jar`）

がぜんぶ走ります。

> **補足: `build/` ディレクトリは Gradle の作業場所**
>
> Maven の `target/` と同じ役割を、Gradle では **`build/`** が担います。
> こちらも `.gitignore` に入れるのが定番です。

生成された JAR は `build/libs/hello-gradle.jar` に置かれます。

---

## ステップ5 ― 実行する

`application` プラグインを入れたおかげで、`gradle run` で起動できます。

```text
$ gradle run

> Task :run
Hello, Gradle!

BUILD SUCCESSFUL in 378ms
```

`Hello, Gradle!` が表示されました。

---

## タスク ― Gradle の世界の「単位」

Maven のフェーズに相当するのが、Gradle の**タスク**（task）です。

```text
$ gradle tasks
```

を叩くと、使えるタスクの一覧が見られます。
よく使うタスクは次のとおりです。

| タスク | 用途 |
|---|---|
| `gradle build` | コンパイル → テスト → JAR 作成までやる |
| `gradle test` | テストを実行 |
| `gradle run` | アプリを実行（`application` プラグイン必要） |
| `gradle clean` | `build/` を削除 |
| `gradle tasks` | 使えるタスクの一覧 |
| `gradle dependencies` | 依存ツリーを表示 |

タスクは**依存関係でつながっている**ので、`gradle build` を叩けば、その手前の `compileJava`・`test`・`jar` も自動で走ります。
このしくみは、Maven のフェーズと考え方は同じです。

---

## Gradle Wrapper ― バージョン固定の必需品

Gradle には、**Gradle Wrapper**（グレイドル・ラッパー）という超重要な機能があります。
これは、「**プロジェクトに必要な Gradle 自体を、自動でダウンロードしてくれる**」しくみです。

プロジェクトのルートで一度だけ実行します。

```text
$ gradle wrapper
```

すると、次のファイル群が生成されます。

```text
hello-gradle/
├── gradlew                    ← UNIX / macOS 用の起動スクリプト
├── gradlew.bat                ← Windows 用
└── gradle/
    └── wrapper/
        ├── gradle-wrapper.jar
        └── gradle-wrapper.properties   ← 使う Gradle のバージョンが書かれる
```

これ以降、`gradle` の代わりに **`./gradlew`** を使います。

```text
$ ./gradlew build
$ ./gradlew test
$ ./gradlew run
```

なぜこんな手間をかけるのか。

- チーム全員が、**まったく同じバージョンの Gradle**を使うようになる
- 新しく入った人が、Gradle 自身をインストールする手間がいらない（`./gradlew` を叩けば自動で取得される）
- CI 環境（GitHub Actions など）でも、明示的にバージョンを管理しなくてよい

実務の Gradle プロジェクトでは、**ほぼ必ず Wrapper を使います**。
自分でプロジェクトを作るときも、最初に `gradle wrapper` を叩く習慣をつけましょう。

---

## まとめ

- Gradle は **`build.gradle.kts`** で設定し、`gradle` コマンドで動かします
- プロジェクト構造のお約束は Maven と同じです（`src/main/java` / `src/test/java`）
- 依存は `groupId:artifactId:version` の 1 行で書け、`implementation` / `testImplementation` などで利用範囲を指定します
- 標準で使うのは **`gradle build`**・**`gradle test`**・**`gradle run`** あたり
- **Gradle Wrapper（`./gradlew`）**でバージョンを固定するのが実務の鉄則です

次の節では、ここまで動かしてきた **Maven と Gradle の使い分け**を整理します。

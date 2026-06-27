---
title: Maven と Gradle の使い分け
llm: true
co-author: ["Claude Opus 4.7"]
---

## Maven と Gradle の使い分け

ここまでで、Maven と Gradle をそれぞれ動かしてきました。
最後に、両者を**ならべて比べ**、現場でどう選べばよいかを整理します。

---

## 同じ pom と build.gradle.kts を並べてみる

まず、第3節と第4節で書いた設定ファイルを、**並べて**見比べてみましょう。
やっていることは**まったく同じ**です。

### Maven (`pom.xml`)

```xml
<groupId>com.example</groupId>
<artifactId>hello</artifactId>
<version>1.0.0</version>

<properties>
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
```

### Gradle (`build.gradle.kts`)

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
}
```

行数は大差ありません。
ただし、見た目はだいぶ違います。

- Maven は **XML のタグ**で 1 階層ずつ書く
- Gradle は **Kotlin のブロック**で関数呼び出しのように書く

Gradle のほうが短く、関数呼び出しなので**IDE の補完が効く**のが利点です。
Maven は冗長ですが、**書き方の幅が狭い**ため、誰が書いても似た形になります。

---

## 主な違いを表で

| 観点 | Maven | Gradle |
|---|---|---|
| 設定ファイル | `pom.xml`（XML） | `build.gradle.kts`（Kotlin）／ `build.gradle`（Groovy） |
| 設計思想 | 規約に従い、ルートからフェーズを順番に流す | タスクを組み立てる |
| ビルド速度 | 標準。並列・差分実行は弱め | 高速。インクリメンタル・ビルドキャッシュ・並列実行が標準 |
| 学習コスト | 低め。情報源も多い | やや高め。Kotlin DSL の知識が要る |
| 柔軟性 | 低め。プラグインの組み合わせで補う | 高め。タスクを Kotlin で自由に書ける |
| 普及度（Java） | 業務システム・歴史のある現場で多い | 新規プロジェクト・Android で多い |
| ライブラリ取得 | Maven Central（標準） | Maven Central（`mavenCentral()` を明記） |
| バージョン固定 | 単一バージョンを `pom.xml` に書く | Wrapper（`./gradlew`） |
| IDE 連携 | IntelliJ IDEA・Eclipse・VS Code でほぼ完璧 | IntelliJ IDEA・Android Studio で強力 |

「速い・柔軟」を取るなら Gradle、「単純・予測しやすい」を取るなら Maven、というのが大まかなイメージです。

---

## どちらを選べばよいか

ここでも結論を急がず、現場の状況で考えるのが基本です。

### 既存プロジェクトに参加する場合

→ **すでに使っているほう**に従います。
個人の好みで変えるものではありません。`pom.xml` があれば Maven、`build.gradle.kts` / `build.gradle` があれば Gradle です。

### 新規プロジェクトを始める場合

選び方の指針は、こんな感じです。

| こんな状況 | おすすめ |
|---|---|
| 業務システム、Spring Boot で API を作る | **Maven**。Spring Boot の公式ドキュメント・サンプルが Maven 主体 |
| Android アプリ | **Gradle 一択**。Android 公式が Gradle |
| ライブラリを公開したい | どちらでも可。情報量で Maven が選ばれることが多い |
| マルチプロジェクト（複数モジュール） | **Gradle**。柔軟さとビルド速度が活きる |
| とりあえず触ってみたい・小さなツール | お好みで |

迷ったときは、**そのプロジェクトの近傍で多数派のほう**を選ぶ、というのが現実的です。

---

## 「両方読める」を最低ラインに

実務で大事なのは、**どちらか 1 つをマスター**することではなく、**両方を読める**状態にしておくことです。

理由はシンプルで、

- 入社した会社・参加するプロジェクトで、どちらを使っているかは選べない
- 外部ライブラリのドキュメントは、Maven と Gradle の両方の設定例を載せていることが多い
- 自分で組むときも、Stack Overflow の回答は両方混じる

ここまでの第3節・第4節で「同じ依存をどちらでも書ける」感覚はつかめたはずです。
細かい記法はそのつど検索すれば十分です。

---

## いずれにせよ大事な3つの作法

最後に、Maven と Gradle のどちらを使う場合でも、**必ず押さえてほしい3つの作法**を挙げておきます。

### 1. バージョンを固定する

依存ライブラリのバージョンは、必ず固定で書きます（`2.18.0` のように）。
**「最新版を取ってくる」設定は避ける**こと。第2節で見た理由 ―― 再現性のため、です。

### 2. ビルドツール自身のバージョンも固定する

Maven なら **`mvnw`**（Maven Wrapper）、Gradle なら **`./gradlew`**（Gradle Wrapper）を使い、プロジェクトごとにビルドツール本体のバージョンも固定します。
チームで「私のところでは動く」を起こさないための、最低限の作法です。

### 3. `clean` してから困ったらやり直す

ビルドがうまくいかないとき、まずは `mvn clean` / `gradle clean` で生成物を全部消してから、もう一度試します。
古いキャッシュや残骸が、意外と多くの不思議な不具合の原因になります。

---

## まとめ

- Maven と Gradle は、「やってくれること」はほぼ同じです
- 既存プロジェクトに参加するときは、**そのプロジェクトに従う**のが鉄則です
- 新規なら、Spring Boot 系は Maven、Android やマルチプロジェクトは Gradle が定番です
- 大事なのはどちらに**詳しい**かではなく、両方を**読める**ことです
- バージョン固定・Wrapper の利用・`clean` の習慣は、ツールを問わず必須の作法です

次の節では、Maven / Gradle でハマりやすい**よくあるつまずき**を整理します。

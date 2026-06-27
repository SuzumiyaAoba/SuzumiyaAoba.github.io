---
title: モジュールでプロジェクトを組む
llm: true
---

## モジュールでプロジェクトを組む

ここまでで、`module-info.java` の書き方と JPMS の仕組みは整いました。
最後に、**ビルドツールとの統合**、そしてカスタム JDK を作る **`jlink`** を見て、実務での活用イメージを掴みます。

---

## Maven との統合

Maven は、JPMS と相性がよいビルドツールです。
1 つの Maven モジュール = 1 つの JPMS モジュール、として組むのが自然な対応です。

ディレクトリ構成は、

```text
myapp/
├── pom.xml
├── src/main/java/
│   ├── module-info.java        ← ここ
│   └── com/example/myapp/
└── src/test/java/
    └── com/example/myapp/
```

`pom.xml` には特別な設定はほぼ要りません。`maven-compiler-plugin` が **`module-info.java` の存在を検知**して、自動的にモジュールパスでコンパイルしてくれます。

```xml
<plugin>
  <artifactId>maven-compiler-plugin</artifactId>
  <configuration>
    <release>25</release>
  </configuration>
</plugin>
```

複数の Maven モジュールから成るマルチモジュール構成でも、各モジュールに `module-info.java` を置けば、依存（`requires`）とビルドの依存（`<dependency>`）が**自然に対応**します。

---

## Gradle との統合

Gradle でも、特別なプラグインなしで `module-info.java` を扱えます（Gradle 6.4 以降）。
ただし、**マルチモジュール**プロジェクトでは、依存設定をきちんと書く必要があります。

```kotlin
plugins {
    java
}
java {
    modularity.inferModulePath.set(true)
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(25))
    }
}
dependencies {
    implementation("com.example:lib:1.0")
}
```

`modularity.inferModulePath.set(true)` で、Gradle に「**モジュールパス推論**」を任せます。
これで、`module-info` のあるプロジェクトはモジュールパスへ、ないものは自動モジュール、といった配置を自動でやってくれます。

---

## テストとモジュール

JPMS をやり始めたチームが、よく詰まるのが**テスト**です。
本番ソース（`src/main/java`）はモジュール化されていても、テストは別モジュールから対象クラスを**侵入的に**読む必要があり、しばしば JPMS と衝突します。

| 方針 | 内容 |
|---|---|
| **テストモジュール**を別に切る | `src/test/java` 用に別の `module-info.java`、`exports ... to test` で本番からテストに開放 |
| **テストは無名モジュール**として動かす | `-cp` でテストクラスを置き、ふつうの reflection でアクセス |
| Maven Surefire の **`--add-opens`** を使う | 起動オプションで個別に開放 |

Maven の場合は、**Surefire Plugin が自動で**テストを無名モジュールで動かしてくれるので、ふつうにテストが書けます。
Gradle も同様の挙動です。

---

## `jlink` ―― カスタム JDK を作る

JPMS のもう一つの大きな魅力が、**`jlink`** です。
これは「**自分のアプリが必要なモジュールだけ**」を含んだ、**最小限の JDK**（実体は実行イメージ）を作ります。

```text
$ jlink --module-path "$JAVA_HOME/jmods:out" \
        --add-modules com.example.greet \
        --launcher greeter=com.example.greet/com.example.greet.Greeter \
        --output dist
```

ここで:

- `--module-path` ―― 標準モジュール群と、自分のモジュール
- `--add-modules` ―― 起動モジュール
- `--launcher` ―― 実行スクリプトを作る
- `--output` ―― 出力ディレクトリ

これで `dist/bin/greeter` という実行スクリプトができます。
**JDK 全部**を持つ必要はなく、自分のアプリに必要な部分（多くは `java.base` を含む数モジュール）だけを取り出すので、

- イメージサイズ: **数十 MB** まで縮められる
- 起動: **モジュール解決が事前に済んでいる**ので速い
- 不要なクラスがないので、**攻撃対象表面**が小さい

特に、コンテナや小さい組み込みデバイスで動かすときの**配布物**として、JPMS + `jlink` は強力です。

---

## `jpackage` ―― ネイティブパッケージを作る

`jlink` の一段先には **`jpackage`** があります。これは、

- Windows: `.msi`、`.exe`
- macOS: `.dmg`、`.pkg`
- Linux: `.deb`、`.rpm`

といった**プラットフォーム固有のパッケージ**を、JDK の機能だけで作るツールです。
Java で書いた**デスクトップアプリ**を「インストーラ」として配るときに便利です。

第49章で扱う **GraalVM ネイティブイメージ**と比べると、`jpackage` は**JVM を埋め込む**形なので、サイズは大きめ（数十 MB〜100 MB）ですが、**互換性は高い**です。

---

## 「**JPMS を使わない**」現実

ここまで JPMS の機能を紹介してきましたが、実態として、Spring Boot などの**多くの Web アプリは、いまだに `module-info.java` を書いていません**。
理由は、

- フレームワークが**多数のクラスにリフレクション**するため、`opens` が大量に必要
- 依存ライブラリの **JPMS 化が完了していない**
- **`spring-boot-maven-plugin`** がモジュールパスを完全にサポートしていない

など、現実的な摩擦があるからです。

それでも、

- **Java の標準 API は完全モジュール化済み**
- **JDK 内部 API への直接アクセスは段階的に閉じられている**

ので、JPMS の**ふるまい**を知っておくことは、すべての Java エンジニアにとって必要です。
`--add-opens` や `--add-exports` を見かけたとき「これは何をしているのか」を読み解けるようになる ―― これが、本書の現実的なゴールです。

---

## まとめると

- Maven / Gradle は、いずれも `module-info.java` を**そのまま**扱える
- マルチモジュールでは、各サブモジュールに `module-info.java` を置く
- テストは、別の `module-info` か、無名モジュールで動かす（ビルドツール側がよく面倒を見る）
- **`jlink`** で、自分のアプリ専用の**カスタム JDK** が作れる ―― コンテナサイズの大幅削減
- **`jpackage`** で、OS ネイティブのインストーラも作れる
- 現実には JPMS を使わないアプリも多いが、**ふるまいの知識**は全員に必要

次の節では、ここまでの JPMS で**詰まりやすいポイント**を整理します。

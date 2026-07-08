---
title: Spring Boot のネイティブイメージ
llm: true
---

## Spring Boot のネイティブイメージ

Spring Boot 3 から、ネイティブイメージは**公式サポート**になりました。
この節では、Spring Boot プロジェクトをネイティブ化する**現実的な流れ**を整理します。

---

## Spring Boot 3 のネイティブ対応

Spring Boot 3 では、

- **`spring-boot-starter-native`** で、ネイティブ向けのスターターが揃う
- **`spring-aot`** で、AOT 処理がビルド時に走り、リフレクション情報を整える
- **`spring-boot-maven-plugin`** や **`spring-boot-gradle-plugin`** に、ネイティブビルドのゴール / タスクが入る

これらが組み合わさり、ふつうの Spring Boot プロジェクトを**コマンド 1 つでネイティブ化**できるようになりました。

---

## 始め方 ―― start.spring.io から

[start.spring.io](https://start.spring.io) で新規プロジェクトを作るとき、

- Spring Boot 3.x
- GraalVM Native Support （ターゲットに追加）

を選ぶだけで、ネイティブ対応の `pom.xml` または `build.gradle` が出来上がります。

`pom.xml` には、

```xml
<plugins>
  <plugin>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-maven-plugin</artifactId>
  </plugin>
  <plugin>
    <groupId>org.graalvm.buildtools</groupId>
    <artifactId>native-maven-plugin</artifactId>
  </plugin>
</plugins>
```

`native-maven-plugin` と Spring Boot のプラグインが、ネイティブビルドを担当します。

---

## ビルド ―― `-Pnative`

ネイティブビルドは、Maven なら:

```text line-numbers=false
$ mvn -Pnative native:compile
```

Gradle なら:

```text line-numbers=false
$ ./gradlew nativeCompile
```

これで、`target/` または `build/native/` の下に**ネイティブ実行ファイル**が出来上がります。

```text line-numbers=false
$ ls -la target/myapp
-rwxr-xr-x  1 user staff  120M  ...  target/myapp

$ ./target/myapp
2026-06-24T... INFO --- Started MyApp in 0.085 seconds
```

Spring Boot の起動が **85 ms** ―― JVM では数秒かかっていた起動が、ほぼ瞬時になりました。

---

## メモリ使用量

JVM で動かしたときと比べると:

| | JVM | Native Image |
|---|---|---|
| 起動時間 | 2〜5 秒 | **0.1 秒前後** |
| RSS（メモリ） | 200〜400 MB | **50〜100 MB** |
| 初回リクエスト | スロー（JIT 待ち） | **瞬時** |

サーバーレス（Lambda・Cloud Run）で「**コールドスタートが遅い**」と言われていた Java が、ネイティブイメージで **Go や Node 並み**の起動になります。

---

## 開発ワークフロー

ネイティブビルドは時間がかかります（**数分**）。
そのため、**開発中はふつうの JVM で動かし、本番ビルドだけネイティブ**にする、というのが現実的です。

```text line-numbers=false
# 開発時
$ mvn spring-boot:run

# テスト
$ mvn test

# ネイティブビルド（本番用）
$ mvn -Pnative native:compile
$ ./target/myapp

# Docker イメージ
$ mvn -Pnative spring-boot:build-image
```

`spring-boot:build-image` は、Buildpacks を使ってネイティブイメージを含む**極小の Docker イメージ**を作るゴールです。
Spring Boot 公式が用意する Buildpacks は、ネイティブビルドの面倒な設定をすべて引き受けてくれます。

---

## 「**動かない**」典型 ―― 何が躓きやすいか

ネイティブ化で躓きがちな箇所を、順に挙げます。

### 1. リフレクションを使う独自コード

Spring 標準の `@Autowired`・`@Component` は AOT 処理で**ビルド時にコード生成**されるので、問題なく動きます。
ですが、**自前でリフレクションを書いた**コード（プラグイン機構など）は、メタデータが必要です。

```java
@Bean
public Object dynamicBean() {
    return Class.forName("com.example.Dynamic").getConstructor().newInstance();
}
```

このようなコードは、`@Reflective` などの Spring AOT ヒントか、`reflect-config.json` の追加が必要です。

### 2. クラスパスから動的にロード

```java
Class<?> driver = Class.forName(System.getProperty("driver.class"));
```

実行時に決まる文字列でクラスをロードする ―― これは Closed-World に**根本的に**反します。
ビルド時にすべての可能なドライバを**事前に列挙**するか、設計を見直す必要があります。

### 3. 設定の動的解釈

`@ConfigurationProperties` で読む YAML/プロパティは、Spring AOT が処理してくれます。
ですが、`application.yaml` の中で**SpEL 式**で動的に評価される値などは、AOT で解決できないことがあります。

---

## 進め方の指針

「**Spring Boot アプリをネイティブ化したい**」と思ったら、進め方の指針:

1. **まず Spring Boot 3 にする**
2. ネイティブビルドを**早めに通す**（最初は失敗してもいい、後で直す）
3. **テストカバレッジ**を Tracing Agent ありで動かす
4. リフレクション関連のエラーは、`@Reflective` ヒント または手動メタデータで解決
5. **動的なクラスロードは設計を見直す**
6. Docker イメージ化までして、**起動時間とメモリを実測**

「いきなり完璧」を目指さず、段階的に対応するのが現実的です。

---

## Native でなく **CDS** という選択肢

ネイティブイメージほどの劇的な変化は不要だが、起動を速くしたい ―― そんなときの中間解として、**CDS**（Class Data Sharing）があります。

CDS は、

- 起動時に必要なクラス情報を**事前に共有メモリにダンプ**
- 次回起動時にそれを使うので、**クラスロードが速い**

という、Java 自身の機能です。Java 21 では `-XX:ArchiveClassesAtExit=...` で簡単に作れます。
Spring Boot もこれに対応していて、

```text line-numbers=false
$ java -XX:ArchiveClassesAtExit=app.jsa -jar app.jar
$ java -XX:SharedArchiveFile=app.jsa -jar app.jar
```

これだけで、Spring Boot の起動が**数十 % 速く**なるケースが多いです。
「ネイティブ化までは大変だが、起動を多少速くしたい」という用途には、CDS が手軽な選択肢です。

---

## まとめると

- **Spring Boot 3** で、ネイティブイメージが**公式サポート**
- `spring-aot` が AOT 処理を担当、リフレクション情報を事前準備
- ビルドは **`mvn -Pnative native:compile`** または `./gradlew nativeCompile`
- ふつうのアプリで、**起動 < 100 ms、メモリ 50 MB** が見える
- 開発は JVM、本番ビルドはネイティブ、という使い分けが現実的
- **CDS** も、起動高速化の中間的な選択肢

次の節では、ネイティブイメージの**トレードオフ**を改めて整理します。

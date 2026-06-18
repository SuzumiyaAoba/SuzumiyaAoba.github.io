---
title: よくあるつまずき
llm: true
---

## よくあるつまずき

ビルドツールで、初心者が（そして実は経験者も）はまりやすいポイントを、まとめて確認します。

---

## 1. 依存が解決できない ― GAV の typo

依存ライブラリのダウンロードがうまくいかないと、Maven なら次のようなエラーが出ます。

```text
[ERROR] Failed to execute goal on project hello-maven: Could not resolve dependencies for project com.example:hello-maven:jar:1.0.0
[ERROR] Failed to collect dependencies at org.junit.jupiter:junit-jupyter:jar:5.11.3
```

Gradle なら、

```text
> Could not resolve all files for configuration ':testRuntimeClasspath'.
   > Could not find org.junit.jupiter:junit-jupyter:5.11.3.
```

原因のほとんどは、**GAV の typo**（`jupiter` を `jupyter` と書いた、など）です。
他には、

- **バージョンが Maven Central に存在しない**（古すぎる・新しすぎる）
- **企業ネットワークのプロキシ**で Maven Central に届かない
- **`<repositories>` / `repositories { ... }`** で間違ったリポジトリを指定している

ということが起きます。

### 対処

- まずは [Maven Central](https://central.sonatype.com/) で**コピーした GAV** をそのまま貼り直す
- ネットワーク問題が疑わしいときは、ブラウザで `https://repo.maven.apache.org/maven2/<groupIdをスラッシュに>/<artifactId>/` にアクセスできるか試す
- ローカルリポジトリ（`~/.m2/repository`・`~/.gradle/caches`）に**壊れたファイル**が残っていることもある。該当の GAV のフォルダを削除して、再ダウンロードさせる

---

## 2. JDK バージョンが合わない

`maven.compiler.release` や `JavaLanguageVersion` で指定した Java バージョンと、実機の `java --version` が合わないと、こんなエラーが出ます。

```text
[ERROR] release version 25 not supported
```

これは、ビルド中の Maven が**古い JDK**で動いているサインです。
たとえば JDK 21 上で Maven を動かしているのに、`maven.compiler.release` に `25` を指定するとこうなります。

### 対処

- 環境変数 **`JAVA_HOME`** を、使いたい JDK に向ける
- `mise` / `SDKMAN` で、JDK のバージョンを切り替える
- Gradle は **toolchain** を使えば、自動で必要な JDK を取ってきてくれる（前節を参照）

> **補足: Maven の `source` / `target` ではなく `release` を使う**
>
> Java 9 以降は `<maven.compiler.release>` の使用が推奨されています。
> 旧来の `<maven.compiler.source>` / `<maven.compiler.target>` は古い書き方で、Java の標準ライブラリの互換チェックが甘く、思わぬクラスを参照できてしまうことがあります。

---

## 3. `repositories` を忘れる（Gradle）

Gradle で、`build.gradle.kts` に **`repositories { ... }`** ブロックを書き忘れると、依存ライブラリを取ってくる先がわからず、次のようなエラーになります。

```text
> Could not resolve all files for configuration ':compileClasspath'.
   > Cannot resolve external dependency org.junit.jupiter:junit-jupiter:5.11.3 because no repositories are defined.
```

Maven は、何も書かなくても Maven Central を見るのに対し、**Gradle は明示が必要**な点が違います。
これは引っかけポイントなので、覚えておいてください。

### 対処

```kotlin
repositories {
    mavenCentral()
}
```

を、`build.gradle.kts` に必ず書きます。

---

## 4. Wrapper を使わずに、環境ごと壊す

ローカルにグローバルな Maven 3.9 / Gradle 9 が入っているからといって、それで全プロジェクトを動かしてしまうと、

- 古いプロジェクトが、新しい Maven / Gradle で動かなくなる
- チームの誰かが古いバージョンを使っていて、結果が違う
- CI と手元で、ビルド結果が一致しない

といった問題が起きます。

### 対処

- Maven なら **`./mvnw`**（Maven Wrapper）、Gradle なら **`./gradlew`** を使う
- 新しいリポジトリでは、**最初に Wrapper を生成**しておく（`mvn wrapper:wrapper` / `gradle wrapper`）
- **`mvnw` / `gradlew` / `gradle/` フォルダはコミット**する

「グローバルな `mvn` / `gradle` は、Wrapper を作るときだけ使う」くらいの気持ちでいると、事故が減ります。

---

## 5. `target/` や `build/` を Git に入れてしまう

ビルドの生成物（`.class` ファイル、JAR、ログ）が、リポジトリに混ざってしまうと、

- リポジトリのサイズが膨らむ
- 別の環境でビルドした生成物が、コミット履歴を汚す
- 機密情報（社内ライブラリへの認証トークンなど）が、生成物に混ざって流出する

など、ろくなことがありません。

### 対処

プロジェクト直下の `.gitignore` に、次を書いておきます。

```text
# Maven
target/

# Gradle
.gradle/
build/

# IDE
.idea/
*.iml
.vscode/
```

新規プロジェクトを作ったら、**いちばん最初にやる**作業にしましょう。

---

## 6. ビルドが「謎の状態」になったら `clean`

ときどき、

- 設定ファイルを直したのに、変更が反映されない
- 削除したクラスがまだ JAR に入っている
- ビルドキャッシュが壊れている

といった状況が起きます。
そんなときは、**何より先にクリーンビルド**を試します。

```text
$ mvn clean package
$ ./gradlew clean build
```

これでも直らなければ、**ローカルリポジトリのキャッシュも疑う**フェーズです。

```text
# Maven のローカルリポジトリ
$ ls ~/.m2/repository/

# Gradle のキャッシュ
$ ls ~/.gradle/caches/
```

該当ライブラリのフォルダごと削除すれば、次回ビルドで再ダウンロードされます。

---

## まとめ

- 依存解決エラーは **GAV の typo** がいちばん多い。Maven Central からコピーして貼り直す
- JDK バージョンは、`JAVA_HOME` または **Gradle toolchain** で合わせる
- Gradle は **`repositories { mavenCentral() }`** を必ず書く（Maven は不要）
- **Wrapper（`./mvnw` / `./gradlew`）**を使い、ビルドツール自身もバージョン固定する
- `.gitignore` で **`target/`・`build/`・`.gradle/`** を除外する
- 困ったら **`clean`** ―― それでもダメならローカルリポジトリを疑う

次は、この章で学んだ言葉を、用語集としてまとめます。

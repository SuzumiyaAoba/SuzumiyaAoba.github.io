---
title: 用語集 ― この章で学んだ言葉
llm: true
co-author: ["Claude Opus 4.7"]
---

## 用語集 ― この章で学んだ言葉

第31章では、Java プロジェクトを支える「ビルドツール」（Maven / Gradle）を学びました。
節ごとに、言葉を整理しておきます。

---

## ビルドツールの基礎（第1〜2節）

| 用語 | 英語・読み | 意味 |
|---|---|---|
| ビルドツール | build tool | 依存解決・コンパイル・テスト・パッケージングを自動化する道具 |
| 規約による設定 | Convention over Configuration | `src/main/java` などのお約束に従えば、最小設定で動かせる考え方 |
| 依存ライブラリ | dependency | 自分のプロジェクトが利用する、他人が書いたコード（多くは JAR） |
| GAV 座標 | GroupId / ArtifactId / Version | ライブラリを一意に特定する 3 つの情報 |
| GroupId | ― | 提供する組織を表す ID。逆ドメイン名で書く（例: `com.fasterxml.jackson.core`） |
| ArtifactId | ― | ライブラリ名（例: `jackson-databind`） |
| Version | ― | バージョン番号（例: `2.18.0`） |
| リポジトリ | repository | ライブラリの倉庫。Maven Central・ローカル・プライベートの 3 種 |
| Maven Central | ― | 事実上の標準となっている公開リポジトリ |
| ローカルリポジトリ | ― | 自分のマシン上のキャッシュ。Maven は `~/.m2/repository`、Gradle は `~/.gradle/caches` |
| 推移的依存関係 | transitive dependencies | 依存ライブラリ自身が持つ依存も、自動でたどって取ってくるしくみ |

---

## Maven（第3節）

| 用語 | 意味 |
|---|---|
| `pom.xml` | Maven の設定ファイル。Project Object Model の略 |
| `<groupId>` / `<artifactId>` / `<version>` | プロジェクト自身の GAV |
| `<packaging>` | 出力形式（`jar` / `war` / `pom`） |
| `<properties>` | 設定値をまとめる場所（`maven.compiler.release` など） |
| `maven.compiler.release` | コンパイル対象の Java バージョン（Java 9+ の標準） |
| `<dependencies>` | 依存ライブラリを並べる場所 |
| `<scope>` | 依存の利用範囲。`compile`（既定）・`test`・`provided` など |
| ライフサイクル | フェーズが順番に並んだもの。`validate` → `compile` → `test` → `package` → `install` → `deploy` |
| Surefire プラグイン | Maven でテストを実行するプラグイン |
| `target/` | Maven の生成物が置かれるディレクトリ（`.gitignore` 対象） |
| `mvn compile` | 本番コードをコンパイル |
| `mvn test` | テストまで実行 |
| `mvn package` | JAR / WAR を作る |
| `mvn install` | ローカルリポジトリに保存 |
| `mvn clean` | `target/` を削除 |

---

## Gradle（第4節）

| 用語 | 意味 |
|---|---|
| `build.gradle.kts` | Gradle の設定ファイル（Kotlin DSL） |
| `settings.gradle.kts` | プロジェクト全体を定義（ルート名・子プロジェクト） |
| プラグイン | Gradle の機能を提供する単位。`application` で実行可能アプリの基盤がそろう |
| `repositories { mavenCentral() }` | ライブラリの取得元（**Gradle では必須**） |
| Java toolchain | ビルドに使う JDK を指定するしくみ。必要なら自動でダウンロードしてくれる |
| `dependencies` 設定（configuration）名 | `implementation` / `testImplementation` / `testRuntimeOnly` など |
| `implementation` | 本番コードで使う依存 |
| `testImplementation` | テストでだけ使う依存 |
| `testRuntimeOnly` | テスト実行時にだけ必要（コンパイル時は不要） |
| `useJUnitPlatform()` | JUnit 5 でテストを実行するための設定 |
| タスク | Gradle の処理の単位。依存関係でつながり、必要なものから順番に実行される |
| `build/` | Gradle の生成物が置かれるディレクトリ（`.gitignore` 対象） |
| `gradle build` | コンパイル → テスト → JAR 作成 |
| `gradle test` | テストを実行 |
| `gradle run` | アプリを実行（`application` プラグインが必要） |
| `gradle clean` | `build/` を削除 |
| `gradle tasks` | 使えるタスクの一覧 |
| Gradle Wrapper | プロジェクトに必要な Gradle 自体をダウンロードしてくれるしくみ。`./gradlew` を使う |

---

## 使い分けと落とし穴（第5〜6節）

| 用語 | 意味 |
|---|---|
| Maven Wrapper | Maven 自身をバージョン固定して使うしくみ。`./mvnw` |
| Gradle Wrapper | Gradle 自身をバージョン固定して使うしくみ。`./gradlew` |
| バージョン固定 | 依存ライブラリのバージョンを明示的に指定すること。再現性の基本 |
| `.gitignore` | Git の追跡から除外するファイルを書くファイル。`target/` / `build/` / `.gradle/` を入れる |
| `clean` ビルド | 生成物を全削除してからビルドし直すこと。謎のトラブル時の第一手 |

---

## おわりに ― これで第4部の土台ができました

第31章で、Java プロジェクトを支える**いちばん下のレイヤー**である、ビルドツールを学びました。
これで、

- Maven の `pom.xml` も Gradle の `build.gradle.kts` も、見て読める
- 新規プロジェクトを、自分で作ってビルドできる
- 依存ライブラリを、Maven Central から取ってきて使える
- どちらのツールを使う現場でも、最低限の作法を知っている

という状態になりました。

次の第32章では、いま追加だけはした **JUnit 5** を使って、本格的に**ユニットテスト**を書いていきます。
ビルドツールの上で、テストが自動実行されることの**ありがたみ**を、ここから少しずつ感じていただけるはずです。

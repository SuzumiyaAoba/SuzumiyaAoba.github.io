---
title: 用語集 ― この章で学んだ言葉
llm: true
---

## 用語集 ― この章で学んだ言葉

### GraalVM

Oracle が中心となって開発する**JDK の代替実装**。
強力な JIT（GraalVM Compiler）と、ネイティブイメージビルダーを含む。

### GraalVM Community Edition（GraalVM CE）

GraalVM のオープンソース版。本書のサンプルもこれを前提。

### ネイティブイメージ（Native Image）

Java のバイトコードをビルド時にネイティブコードにコンパイルし、JVM なしで動かす仕組み。

### `native-image` コマンド

GraalVM に同梱される、ネイティブイメージビルダー。
`.class` または `.jar` を引数に取り、OS ネイティブの実行ファイルを出力する。

### AOT（Ahead-Of-Time）コンパイル

実行前に（先んじて）ネイティブコードを生成すること。
JIT（実行中の just-in-time）と対比される。

### Closed-World Assumption（閉じた世界の仮定）

ネイティブイメージビルダーの設計上の前提。
**実行時に使われる全クラス・全メソッド・全リソースが、ビルド時に分かっている**こと。

### Substrate VM

ネイティブイメージに組み込まれる、極小ランタイム。
GC、スレッド、例外、`Object.hashCode()` などの基本動作を提供する。

### Reachability Metadata

ネイティブイメージビルダーへの設定ファイル群。
- `reflect-config.json` ―― リフレクション
- `resource-config.json` ―― リソース
- `proxy-config.json` ―― 動的プロキシ
- `serialization-config.json` ―― シリアライゼーション
- `jni-config.json` ―― JNI

### Tracing Agent

JVM 起動時に付ける `native-image-agent`。
実際にアプリを動かして使われたリフレクション・リソース・プロキシを**自動記録**し、設定ファイルを生成する。

### Reachability Metadata Repository

GraalVM コミュニティが管理する、ライブラリごとのメタデータ集約リポジトリ。
主要ライブラリの設定は、すでにここに用意されている。

### `--initialize-at-run-time` / `--initialize-at-build-time`

`native-image` のフラグ。クラスの static 初期化を**実行時**にやるか、**ビルド時**にやるかを制御する。

### Spring Boot Native

Spring Boot 3 の公式機能で、Spring Boot アプリのネイティブイメージビルドをサポート。
`spring-aot` プロセッサが、AOT 処理を担当する。

### `spring-aot`

Spring Boot 3 が提供する AOT 処理プロセッサ。
ビルド時にリフレクション情報を**コード生成**して、ネイティブイメージビルドを通す。

### Buildpacks

Cloud Native Buildpacks。Docker イメージを**Dockerfile なし**で作る仕組み。
Spring Boot の `spring-boot:build-image` でネイティブイメージを含むコンテナを作れる。

### CDS（Class Data Sharing）

ふつうの JVM 機能で、起動時に必要なクラス情報を**事前に共有メモリにダンプ**しておき、次回起動時に使う仕組み。
ネイティブイメージほど劇的でないが、**起動を速くする**中間的な選択肢。

### `-XX:ArchiveClassesAtExit` / `-XX:SharedArchiveFile`

CDS のためのフラグ。前者で**作成**、後者で**使用**。

### `--no-fallback`

`native-image` のフラグ。ビルドに失敗したときに JVM ベースの代替バイナリを作らない、と指示する。

### `--gc=...`

ネイティブイメージの GC を指定するフラグ。
デフォルトは Serial GC、ヒープが大きいなら G1 など。

### `@Reflective`

Spring Framework 6 のアノテーション。
「このメソッド・コンストラクタは**リフレクションで使う**」ことを宣言し、AOT 処理にメタデータを生成させる。

### コールドスタート

サーバーレス（Lambda 等）で、**新しいインスタンスを起動する時間**。
JVM では数秒、ネイティブイメージでは数百 ms。

### JIT vs AOT

実行時に翻訳するか、事前に翻訳するか。

| | JIT | AOT |
|---|---|---|
| いつ翻訳 | 実行中 | ビルド時 |
| 利点 | **実行時情報**で最適化 | **起動が速い**、メモリ少 |
| 欠点 | 起動が遅い | 静的解析の限界 |

---

これで第49章の用語整理は終わりです。
ネイティブイメージは、Java の**新しい一面**を見せてくれる強力な仕組みでした。
すべてのアプリに使うわけではありませんが、**サーバーレス・CLI・短命アプリ**には強力な選択肢です。

次の第50章では、本書の総まとめとして**パフォーマンスチューニング実践**を扱います。
そして第50章は、本書「Java 入門」の**最終章**でもあります。

---
title: ネイティブイメージとは
llm: true
---

## ネイティブイメージとは

GraalVM の **ネイティブイメージ**（Native Image）は、Java のコードを**ビルド時に**ネイティブコード（OS の機械語）に翻訳して、JVM なしで動かす仕組みです[^graalvm-native]。
この節では、その仕組みを「ふつうの JVM」との対比で整理します。

---

## JVM の伝統的な流れ ―― 第41章のおさらい

第41章で見た JVM の流れを、もう一度書きます。

```text line-numbers=false
.java
  ↓ javac（コンパイル時）
.class（バイトコード）
  ↓ クラスローダ・ランタイム（実行時）
JVM 上でインタプリタ実行
  ↓ JIT がホットコードをコンパイル（実行時）
ネイティブコード
```

**実行時**にネイティブコードが作られるため、

- 起動時間がかかる
- ウォームアップ期間が必要
- JVM 自体が数百 MB のメモリを使う

という特徴がありました。

---

## ネイティブイメージの流れ

ネイティブイメージは、これを次のように変えます。

```text line-numbers=false
.java
  ↓ javac（コンパイル時）
.class（バイトコード）
  ↓ GraalVM ネイティブイメージビルダー（ビルド時）
ネイティブの実行ファイル（OS の機械語）
  ↓ 直接実行
プロセス起動 → 数ミリ秒で main へ
```

ポイントは:

- バイトコードを、**ビルド時に**ネイティブコードに翻訳する
- 結果は**OS ネイティブの実行ファイル**（Linux なら ELF、macOS なら Mach-O）
- 実行時には JVM が**不要**

これにより、

- 起動が**数桁速い**（数十ミリ秒）
- メモリ使用量が**大幅減**
- 配布物は**1 つの実行ファイル**

を実現します。

---

## 「**Closed-World Assumption**」 ―― 閉じた世界の仮定

ネイティブイメージの設計の核心が、**Closed-World Assumption**（閉じた世界の仮定）です。

> ビルド時に、**実行時に使われる全クラス・全メソッド・全リソース**が分かっている。

この仮定の下で、ビルダーは

- 使われないクラス・メソッド・フィールドを**完全に削除**
- 使われる範囲だけを**強力に最適化**
- 起動時に何もロードしなくていいように**事前に解決**

を行います。
その結果、**極小・高速**な実行ファイルが出来上がります。

---

## 何が「**閉じない**」と困るのか

「すべてが分かっている」のは、ふつうの Java では**成り立ちません**。

- **リフレクション**: 文字列でクラス名を渡される
- **動的クラスロード**: `Class.forName(name)` で実行時にロード
- **`Proxy`**: 動的にクラスを生成
- **リソース**: `Class.getResource("...")` で実行時に取得
- **JNI**: ネイティブから Java を呼ぶ

これらは、**ビルド時には何を使うか分からない**操作です。
ネイティブイメージは、

- これらの**ヒント**をビルド時に与えてもらう（設定ファイル）
- または、**自動検出**を試みる

ことで対応します。
これが、第4節で扱う **reachability metadata** の正体です。

---

## AOT コンパイラと GraalVM Compiler

ネイティブイメージのビルダーは、**GraalVM Compiler** を使っています。
これは、

- 元々は **JIT** として開発（HotSpot JVM の C2 を置き換える）
- AOT（Ahead-Of-Time、事前コンパイル）にも転用できる

という設計の、特殊なコンパイラです。
Java 自身も、Java 9 で `jaotc` という標準 AOT コンパイラを実験的に持っていましたが、Java 17 で削除されました。
現代における Java の AOT は、事実上 GraalVM ネイティブイメージ一強です。

---

## 「**JVM レス**」の世界

ネイティブイメージで作った実行ファイルは、

- JVM を**含まない**
- ですが、軽量な**Substrate VM** という小さなランタイムを含む
- GC、スレッド、例外、`Object.hashCode()` など、Java の基本動作を提供

つまり、「**JVM ゼロ**」ではなく「**極小ランタイム + Java コード**」がネイティブにまとめられたもの、と理解するのが正確です。

このランタイムには、Java の標準的な GC（Serial GC、世代別の G1 相当）も含まれます。
そのため、ネイティブイメージで作ったアプリも、**ふつうに GC が動きます**。

---

## どこで使われているか

ネイティブイメージは、もはや**特殊な選択肢**ではなくなっています。

| 用途 | 採用例 |
|---|---|
| **CLI ツール** | `gradle`、`micronaut`、`quarkus` などの CLI |
| **サーバーレス** | AWS Lambda の Java ランタイム、Google Cloud Functions |
| **マイクロサービス** | Micronaut、Quarkus、Helidon |
| **Spring Boot** | Spring Boot 3 から**標準対応** |

特に Spring Boot 3 で、`spring-boot-starter-native` を含めて公式サポートが入ったのは大きな変化です。

---

## なぜ Spring Boot 2 では難しかったのか

Spring Boot は、伝統的に**リフレクションへの依存**が大きいフレームワークでした。

- `@Component` のスキャンに**全クラスのリフレクション**
- DI の決定に**コンストラクタのリフレクション**
- `@Autowired` でのフィールド注入

これらが、ネイティブイメージの**Closed-World Assumption**と相性が悪い。

Spring Boot 3 では、

- **AOT**処理を**ビルド時**にやる仕組みを導入（`spring-aot`）
- ランタイムのリフレクションを大幅削減
- ネイティブイメージのメタデータを**Spring 自身が生成**

これにより、ネイティブ化が現実的になりました。
**`spring-boot-starter-native` + Maven の `process-aot` ゴール**で、ふつうのプロジェクトがそのままネイティブ化できるようになっています（**詳細は第5節**）。

---

## まとめると

- ネイティブイメージは、Java コードを**ビルド時に**ネイティブ機械語にする
- **Closed-World Assumption**: ビルド時に全使用箇所が分かる前提
- **リフレクション・動的ロード**には、設定ファイル（reachability metadata）が必要
- JVM を含まないが、極小ランタイム **Substrate VM** を含む
- **起動・メモリ**で圧勝、**スループット**は JVM の JIT がやや勝つ
- Spring Boot 3 で公式対応 ―― **現代の選択肢**として一般化

次の節では、実際に GraalVM をインストールして、ネイティブイメージのビルドを試してみます。

[^graalvm-native]: Oracle, "GraalVM Native Image," [https://www.graalvm.org/latest/reference-manual/native-image/](<https://www.graalvm.org/latest/reference-manual/native-image/>)。AOT コンパイラ Substrate VM ベースで、Java コードをビルド時にネイティブ実行ファイルへ変換する。Spring Boot 3 では `spring-aot` プラグインによる公式サポートが入っている（[https://docs.spring.io/spring-boot/reference/packaging/native-image/index.html](<https://docs.spring.io/spring-boot/reference/packaging/native-image/index.html>)）。

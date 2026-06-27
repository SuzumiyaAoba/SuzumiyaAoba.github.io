---
title: リフレクション・リソース・プロキシの設定
llm: true
---

## リフレクション・リソース・プロキシの設定

ネイティブイメージの **Closed-World Assumption** に最も衝突するのが、

- **リフレクション**（第46章）
- **リソース読み取り**（`getResource`）
- **動的プロキシ**（第46章で触れた `Proxy.newProxyInstance`）

の 3 つです。
この節では、それぞれをどう**ネイティブ化に対応**させるかを整理します。

---

## 「**Reachability Metadata**」 ―― 設定ファイル

ネイティブイメージビルダーは、

> 実行時にリフレクションやリソースで触られるものを、**設定ファイル**で明示してもらう

ことを要求します。
この設定を **Reachability Metadata**（到達可能性メタデータ）と呼びます。

GraalVM 公式の指針に従うと、メタデータは `META-INF/native-image/<group>/<artifact>/` ディレクトリに置きます。

```text
src/main/resources/META-INF/native-image/com.example/my-app/
├── reflect-config.json
├── resource-config.json
├── proxy-config.json
├── serialization-config.json
└── jni-config.json
```

主役は **`reflect-config.json`** と **`resource-config.json`** の 2 つです。

---

## リフレクションのメタデータ

たとえば、

```java
Class<?> c = Class.forName("com.example.Foo");
Method m = c.getMethod("doSomething");
m.invoke(c.getConstructor().newInstance());
```

このコードを動くようにするには、

```json
[
  {
    "name": "com.example.Foo",
    "allDeclaredConstructors": true,
    "allPublicMethods": true,
    "allDeclaredFields": true
  }
]
```

のような `reflect-config.json` を用意します。

- **`name`** ―― 対象クラスの完全限定名
- **`allDeclaredConstructors`** ―― すべての宣言済みコンストラクタを許可
- **`allPublicMethods`** ―― すべての public メソッドを許可
- **`allDeclaredFields`** ―― すべての宣言済みフィールドを許可

これで、ビルダーは「このクラスはリフレクションで使うから、削るな」と理解します。

---

## リソースのメタデータ

`Foo.class.getResourceAsStream("/messages.properties")` のような、**リソース読み取り**もネイティブイメージのデフォルトでは含まれません。

```json
{
  "resources": {
    "includes": [
      {"pattern": "messages.properties"},
      {"pattern": "templates/.*\\.html"}
    ]
  }
}
```

正規表現で、含めたいリソースを指定します。
ビルダーがこれを見て、該当ファイルを**ネイティブイメージの中にバイナリとして埋め込みます**。

---

## 動的プロキシのメタデータ

`Proxy.newProxyInstance(...)` で動的にインタフェース実装を作る場合は、**事前に**「**どのインタフェース集合**」を作るかを宣言します。

```json
[
  ["com.example.MyService"],
  ["com.example.MyService", "java.io.Closeable"]
]
```

これは「`MyService`」だけ、または「`MyService` + `Closeable`」のプロキシを作ることを許可、という意味です。
Spring AOP や JDBC のプロキシは、すべてこの仕組みでネイティブイメージに含めます。

---

## 「**Tracing Agent**」 ―― 自動でメタデータを集める

これらの設定を**手で書くのは大変**です。
GraalVM は、それを自動化する**Tracing Agent** という仕組みを提供します。

```text
$ java -agentlib:native-image-agent=config-output-dir=META-INF/native-image/ -jar app.jar
```

このように JVM に Agent を付けて、**普通の JVM で**アプリを動かします。
アプリが内部で使ったリフレクション・リソース・プロキシを Agent が**自動記録**し、`META-INF/native-image/` 配下に設定ファイルを生成します。

そのファイルをそのまま使えば、ネイティブイメージビルドが通る ―― という、強力な自動化です。

ただし、Tracing Agent は「**実際に走ったコードパス**」しか記録しません。
**ユニットテスト・統合テスト**を全部 Agent ありで走らせ、

- 全クラスパス
- すべての REST エンドポイント
- すべてのバッチ処理

をカバーするようにする ―― これが現実的な運用です。
未踏のパスがあると、ネイティブ実行時にだけ「**`NoSuchMethodException`**」のようなエラーが出ます。

---

## 「**Reachability Metadata Repository**」 ―― ライブラリ作者が用意

主要なライブラリ（Jackson、Hibernate、Spring）は、すでに**事前にメタデータを用意**してくれています。
GraalVM コミュニティが管理する **[Reachability Metadata Repository](https://github.com/oracle/graalvm-reachability-metadata)** に、ライブラリごとの設定が集約されています。

ビルドツールは自動的にここを参照するので、

- ライブラリのバージョンを揃える
- メタデータが用意されているか確認

だけで、自分で設定を書く必要がほぼなくなります。
これが、Spring Boot 3 でネイティブ化が現実的になった大きな要因です。

---

## `--initialize-at-run-time` と `--initialize-at-build-time`

設定ファイルとは別に、**クラスの初期化を**いつ**やるか**を指定するフラグもあります。

```text
$ native-image --initialize-at-run-time=com.example.MyLogger Hello
```

これは、`com.example.MyLogger` の static 初期化を **実行時**に行う、という意味。
逆に **`--initialize-at-build-time`** で、**ビルド時**に static 初期化を済ませることもできます。

このフラグが重要なのは、

- ビルド時初期化: **起動が速くなる**（再計算が不要）
- 実行時初期化: ビルド時に解決できない状態（ファイルパス・乱数など）に対応

両者を使い分けます。
たとえば乱数の `Random` や、ファイルパスに依存する設定オブジェクトは、**実行時初期化**にしないと不具合が起きます。

---

## 設定ファイルがうまく書けないとき

「**メタデータを書いたが、ビルドが通らない**」「**ビルドは通ったが、実行時にエラー**」 ―― これは、ネイティブイメージで最も時間を取られる箇所です。

対策の優先順位:

1. **Tracing Agent**で実行して、自動生成された設定を使う
2. ライブラリの **公式メタデータ**があれば、それを使う
3. それでもダメなら、**`reflect-config.json` を手で**書く
4. 部分的に **`--initialize-at-run-time`** で逃げる

これらを段階的に試します。

---

## まとめると

- ネイティブイメージでは、**リフレクション・リソース・プロキシ**は**設定ファイル**で明示する
- 設定ファイルは `META-INF/native-image/<group>/<artifact>/` に置く
- **Tracing Agent** で、実行から自動収集できる
- **Reachability Metadata Repository** に、主要ライブラリの設定が事前用意されている
- **`--initialize-at-run-time`** / **`--initialize-at-build-time`** で初期化タイミングを制御

次の節では、これらすべてが**裏で動いて**くれる **Spring Boot のネイティブイメージ対応**を見ていきます。

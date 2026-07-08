---
title: exports と requires
llm: true
---

## `exports` と `requires`

前節で**最小限**の `exports` と `requires` を扱いました。
この節では、これらをもう一段深掘りして、**`transitive`**・**`static`**・**Qualified Export** を使えるようにします。

---

## `requires transitive` ―― 依存を伝搬させる

ふつうの `requires` は、**そのモジュール内でだけ**使える依存です。
利用側のモジュールには、**伝わりません**。

```java
module com.example.lib {
    requires java.sql;     // ← lib の中で java.sql を使える
}

module com.example.app {
    requires com.example.lib;
    // ↓ ここで java.sql.Connection は使えない（com.example.lib が requires してるだけだから）
}
```

ですが、`com.example.lib` の**公開 API** が `java.sql.Connection` を引数や戻り値に持つなら、**利用側でも `java.sql` が必要**になります。
そういうとき、`requires transitive` を使います。

```java
module com.example.lib {
    requires transitive java.sql;
    exports com.example.lib;
}

module com.example.app {
    requires com.example.lib;
    // ↑ これだけで、java.sql も自動的に見える（transitive のおかげ）
}
```

`transitive` は「**この依存は、私の利用者にも必要だから、一緒に持って行って**」という宣言です。
公開 API に出てくる型のモジュールには、ほぼ常に `transitive` を付けます。
逆に、**実装の中だけで使う**依存（ログ、ヘルパー）には付けません。

---

## `requires static` ―― コンパイル時だけの依存

`static`（オプショナル）は、「**コンパイル時には要るが、実行時にはあってもなくてもよい**」依存です。

```java
module com.example.lib {
    requires static com.example.optional;
}
```

ユースケースは:

- **アノテーション**: `@Nullable` のようなコンパイル時のヒントだけ。実行時には不要
- **オプショナル機能**: 「プラグインがあれば使う」設計

`static` を付けると、

- **コンパイル時**: 依存があれば使える
- **実行時**: モジュールがなくても、起動はできる（ただし、そのコードを実行しようとすると失敗）

`Optional` 機能を持つライブラリの設計で、たまに使われます。

---

## Qualified Export ―― 特定のモジュールにだけ公開

`exports パッケージ` は、**全モジュール**から見える「**完全公開**」です。
これを「**ある特定のモジュールにだけ公開**」したいときは、`to` 句を付けます。

```java
module com.example.framework {
    exports com.example.framework.api;                // 全モジュールに公開
    exports com.example.framework.internal to com.example.framework.test;  // テストモジュールにだけ公開
}
```

これを **Qualified Export**（修飾された公開）と呼びます。

主なユースケース:

- **フレームワーク内部 API**を、テストモジュールにだけ見せる
- **大きなライブラリ**の中で、サブモジュール間でだけ使う API を作る
- **互換性ブリッジ**を、限られたモジュールにだけ提供

「**完全に隠す**」と「**完全に公開**」の中間が欲しいときに便利です。

---

## サービスローダ ―― `uses` と `provides`

JPMS は、Java 6 から続く **`ServiceLoader`** という仕組みを、モジュールに統合しました。
これは、「**インタフェースを宣言しておき、実装は実行時にプラグインのように見つける**」というパターンです。

```java
module com.example.api {
    exports com.example.api;
    uses com.example.api.PaymentProcessor;   // このサービスを使う
}

module com.example.stripe {
    requires com.example.api;
    provides com.example.api.PaymentProcessor with com.example.stripe.StripeProcessor;
}
```

利用側は、

```java
ServiceLoader<PaymentProcessor> loader = ServiceLoader.load(PaymentProcessor.class);
for (PaymentProcessor p : loader) {
    p.process(payment);
}
```

これで、**モジュールパスにある実装**を見つけて使えます。
本書では深掘りしませんが、Spring の `@Service` の素朴版のような仕組み、と覚えておけば実用上 OK です。

---

## モジュールの**読み取り関係**（readability）

ここで、JPMS の用語整理をしておきます。
モジュール A が B の何かを使えるとき、「**A は B を読み取れる**」（readability）と言います。

| 関係 | 成立条件 |
|---|---|
| A → B（A が B を読める） | `module A { requires B; }` |
| A → B（推移的） | `module A { requires C; }` かつ `module C { requires transitive B; }` |
| A → java.base | **常に**成立（暗黙） |

そして、**読み取れる**だけでは使えません。さらに **アクセシビリティ**（accessibility）が必要です。

| アクセス | 成立条件 |
|---|---|
| A から B の `com.example.X` が**使える** | A が B を読み取れる、かつ `module B { exports com.example to A; }`（または無条件 `exports`） |

つまり、**`requires`（読み取り） × `exports`（アクセシビリティ）の AND** が成立して、はじめて使えます。
両者がそろわないと、コンパイル時に弾かれます。

---

## モジュールの**循環依存**

JPMS は、**モジュール間の循環依存**を**禁止**します。

```text line-numbers=false
モジュール A     requires B
モジュール B     requires A    ← これは NG
```

これを書くと、コンパイル時にエラーになります。
互いに依存する必要があるなら、**共通の依存先**を抽出する、あるいは**設計を見直す**サインです。

クラスパス世界では、こうした循環は気づかぬうちにできてしまいました。
JPMS は、それを**構造的に防ぐ**点でも有用です。

---

## まとめると

- **`requires transitive`** ―― 利用者にも依存を伝える（公開 API に登場する型）
- **`requires static`** ―― コンパイル時のみの依存（アノテーション、Optional 機能）
- **`exports ... to ...`** ―― Qualified Export、特定モジュールにだけ公開
- **`uses` / `provides`** ―― サービスローダの宣言（プラグイン機構）
- モジュール A が B のクラスを使えるのは、**`requires`（読み取り） × `exports`（アクセシビリティ）**両方の AND
- **循環依存**は禁止されている

次の節では、JPMS とリフレクションがどう関わるか ―― **`open` モジュール**と `opens` を見ていきます。

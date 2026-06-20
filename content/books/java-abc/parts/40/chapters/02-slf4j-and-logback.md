---
title: SLF4J と Logback
llm: true
---

## SLF4J と Logback

Java の世界には、たくさんのロギングライブラリがあります。
歴史的経緯で、

- **java.util.logging（JUL）** … Java 標準
- **Log4j 1**（古い）
- **Log4j 2**（新しい）
- **Logback** … Spring Boot のデフォルト
- **commons-logging** … 古い Apache 製

など、選択肢が乱立してきました。
ここから、入門者にとって最適な構成を整理します。

---

## SLF4J ― ロギングの「窓口」

**SLF4J**（Simple Logging Facade for Java、エスエルフォージェイ）は、

> 「**ロギング呼び出しのための、共通のインタフェース**」

を提供します。
`Facade`（ファサード、見せかけの正面）という言葉が表すとおり、SLF4J 自身はログを出しません。
その**裏側に実装**（Logback など）を差し込んで使います。

```text
あなたのコード
       ↓
SLF4J（インタフェース）              ← ここに書く
       ↓
Logback / Log4j 2 / java.util.logging  ← どれかを実装として使う
```

ライブラリ側は SLF4J に向かってログを書き、利用者は**実装を自由に選ぶ**ことができます。
これは、第35章で学んだ **DIP**（依存性逆転原則）の典型例です。

---

## Logback ― SLF4J の実装

**Logback**（ログバック）は、SLF4J を作った人（Ceki Gülcü）が開発した、SLF4J の**標準的な実装**です。

- 高速
- 安定
- 設定が柔軟
- Spring Boot の**デフォルト**

特に Spring Boot ユーザーは、何も設定しなくても**最初から Logback が使われている**状態です。
本書も Logback を前提に進めます。

---

## ロガーを取得する

ロガーは、クラスごとに**1 つ**用意するのが慣習です。

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    public void placeOrder(long userId) {
        log.info("注文受付: userId={}", userId);
    }
}
```

`LoggerFactory.getLogger(クラス.class)` で、そのクラス用のロガーを取得します。
ふつう、

- **`static final`** にする（インスタンスごとには持たない）
- 名前は **`log`** か **`LOG`** か **`logger`**

が慣習です。本書では `log` を使います。

> **Lombok の `@Slf4j` で書く**
>
> 現場では、Lombok（第36章で言及）の `@Slf4j` でロガーを自動生成することもあります。
>
> ```java
> @Slf4j
> public class OrderService {
>     public void placeOrder(long userId) {
>         log.info("...");   // log フィールドが自動生成される
>     }
> }
> ```
>
> Lombok を使わない場合は、本節のように手で書きます。

---

## メッセージの書き方 ― `{}` プレースホルダ

SLF4J には、ログメッセージを書くための**特殊な記法**があります。

```java
log.info("注文受付: userId={}, orderId={}", userId, orderId);
```

`{}` がプレースホルダで、**第 2 引数以降**の値が、順番に埋め込まれます。
出力は、

```text
注文受付: userId=42, orderId=1001
```

このようになります。

---

## なぜ `+` で連結してはいけないのか

「同じことなら、文字列を **`+`** で連結すればよいのでは?」と思うかもしれません。

```java
log.info("注文受付: userId=" + userId + ", orderId=" + orderId);   // △
```

このコードは、

1. `"注文受付: userId="` と `userId` を連結
2. 結果と `", orderId="` を連結
3. 結果と `orderId` を連結
4. **完成した長い文字列**を `info` に渡す

―― という流れで動きます。
ここで問題なのは、**4 が、ログを出すかどうかにかかわらず実行される**ことです。

```java
log.debug("詳細データ: " + heavyData.toString());   // ← 常に toString() が呼ばれる!
```

DEBUG レベルが無効でも、`heavyData.toString()` が**毎回**実行されてしまいます。
無駄な処理が積もると、性能を悪化させます。

### SLF4J の `{}` 記法は遅延評価

`{}` の記法だと、

```java
log.debug("詳細データ: {}", heavyData);    // ← DEBUG が無効なら heavyData.toString() を呼ばない
```

ログが**実際に出力されるときだけ**、`toString()` が呼ばれます。
これにより、**無効なログの計算コストがゼロ**になります。

### ラムダ式での遅延評価（SLF4J 2.0+）

`{}` 記法でもダメな、**さらに重い計算**は、ラムダ式で遅延させます。

```java
log.debug("詳細: {}", () -> expensiveCalculation());
```

`expensiveCalculation()` は、DEBUG が有効なときだけ実行されます。
ただ、ふつうは `{}` だけで十分です。

---

## 例外オブジェクトを渡す

第39章でも繰り返したとおり、例外をログに残すときは、**最後の引数に例外オブジェクト**を渡します。

```java
try {
    process();
} catch (Exception e) {
    log.error("処理失敗: orderId={}", orderId, e);     // ← 最後に e
}
```

実機での出力（抜粋）：

```text
ERROR [main] c.e.log.LogDemoApplication - 処理失敗: orderId=1001
java.lang.RuntimeException: DB接続失敗
        at com.example.log.LogDemoApplication.run(LogDemoApplication.java:25)
        at ...
```

メッセージのあとに、**スタックトレース**が自動的に追加されています。
これがないと、デバッグは絶対にできません。

---

## ガード節 ― `isDebugEnabled` で念入りに

「**メッセージの組み立て自体が重い**」場合、SLF4J の `{}` でも完全にはコストを消せません。
そんなときは、**`isDebugEnabled` でガード**します。

```java
if (log.isDebugEnabled()) {
    log.debug("巨大なデータ: {}", convertToReadable(data));
}
```

`convertToReadable(data)` 自体が重い処理なら、`if` で囲んで、DEBUG が無効なら**呼ばれない**ようにします。
ただし、ふつうの `{}` 記法で済む場面では、ガード節は**不要**です（むしろコードを汚す）。

---

## 同じロガー、複数の出力先

ここまでで、ログを「**呼び出す側**」のコードは書けるようになりました。
ですが、本物の業務システムでは、**どこに出すか**も大事です。

```text
log.info("注文受付")
       ↓
   Logback
       ├─→ コンソール
       ├─→ ログファイル（app.log）
       ├─→ JSON形式のログファイル
       └─→ syslog / Kafka
```

これは、Logback の**設定ファイル**で決めます。
詳しくは、第6節「設定とローテーション」で扱います。

---

## まとめ

- **SLF4J** は、ロギングの**共通インタフェース**
- **Logback** は SLF4J の**標準実装**で、Spring Boot のデフォルト
- ロガーは、`LoggerFactory.getLogger(クラス.class)` で取得
- メッセージは、**`{}` プレースホルダ + 引数**で書く
- 文字列 `+` 連結は**書かない**（無効ログでも計算が走る）
- 例外は、**最後の引数**に渡す（スタックトレースが付く）
- 重い処理は、`isDebugEnabled` のガード節で防ぐ
- 出力先は、Logback の**設定ファイル**で決める

次の節は、**ログレベル**の使い分けを、現場感のある視点で整理します。

---
title: ログレベル
llm: true
co-author: ["Claude Opus 4.7"]
---

## ログレベル

第39章でも触れた**ログレベル**を、この節で改めて整理します。
使い分けが**チームでぶれない**ようにするのが、業務システムの基本だからです。

---

## 5 つのレベル

SLF4J のレベルは、下から上に**重要度が上がる**順に並んでいます。

| レベル | 重要度 | 概要 |
|---|---|---|
| **TRACE** | いちばん低い | きめ細かい追跡。ほぼ開発時のみ |
| **DEBUG** | 低 | 開発時の状態確認 |
| **INFO** | 中 | 正常時の業務イベント |
| **WARN** | 高 | 異常ではないが注意したい状況 |
| **ERROR** | いちばん高い | 異常。**人間が対応**すべき |

これに加えて、`FATAL`（致命的、回復不能）が Log4j などにはありますが、SLF4J には**ない**ので、本書では扱いません。

---

## 各レベルの典型的な使い方

### TRACE

ふだんは出さない、開発時にだけ「**詳しい流れを追いたい**」ときに使います。

```java
log.trace("メソッド呼び出し: arg1={}, arg2={}", a, b);
log.trace("ループの内側: i={}, item={}", i, item);
```

本番では**まず無効化**します。
有効にすると、毎リクエストで大量のログが出るため、**性能が落ちる**ことも。

### DEBUG

開発・QA フェーズで、内部状態を確認するために使います。

```java
log.debug("処理開始: req={}", req);
log.debug("計算結果: result={}", result);
```

本番でも、**問題調査のために一時的に**有効にすることがあります。
ただし、平常時は OFF（INFO 以上）にしておきます。

### INFO

「**正常時の業務イベント**」を残すためのレベル。本番でも常時 ON です。

```java
log.info("アプリケーション起動完了");
log.info("注文受付: orderId={}, userId={}", orderId, userId);
log.info("バッチ完了: 件数={}, 所要時間={}ms", count, elapsed);
```

業務的に重要なイベントを、INFO レベルで記録しておくと、

- 「**何時にどんな処理が走ったか**」が見える
- 障害時に**直前までの動き**を追える
- 利用状況の集計に使える

### WARN

「**異常ではないが、放置すると問題になりうる**」状況。
完全な異常ではないので、**自動でリトライした**ような場合に使います。

```java
log.warn("外部API応答遅延: latencyMs={}", latency);
log.warn("リトライ実行: attempt={}, error={}", attempt, error);
log.warn("非推奨APIが呼ばれました: caller={}", caller);
```

WARN がたくさん出るときは、**何かが傾向として悪化している**サインです。
監視で「**WARN の急増**」を検出する仕組みを組むと、障害を未然に防げます。

### ERROR

「**異常。誰かが対応すべき**」というレベル。

```java
log.error("注文の保存に失敗: orderId={}", orderId, e);
log.error("予期しない例外", e);
```

ERROR には**例外オブジェクト**を必ず渡しましょう。
スタックトレースなしでは、原因解明はほぼ不可能です。

---

## 「ERROR」と「業務エラー」の混同に注意

第39章で何度か触れたとおり、

> **業務エラーは、`INFO` か `WARN` で十分なことが多い**

です。
たとえば、

- ユーザーが間違ったパスワードを入れた
- 在庫が足りない
- すでに登録済みのメールアドレスでサインアップしようとした

これらは「**業務的にはふつうに起きること**」であって、**運用者が対応する事案ではありません**。
`ERROR` で出すと、

- 監視アラートが**鳴りやまない**
- 「**本物のエラー**」が埋もれる
- 運用者が**慣れて鈍化**してしまう

業務エラーは `INFO` で受け止めて、本物の異常（DB 切断、NPE）だけを `ERROR` に絞ります。

---

## レベルを設定で切り替える

Spring Boot では、`application.yml` で簡単にレベルを設定できます。

```yaml
logging:
  level:
    root: INFO
    com.example.shop: DEBUG           # 自社のパッケージは DEBUG
    org.hibernate.SQL: DEBUG          # SQL を見たい
    org.springframework: WARN         # Spring 自体は WARN 以上だけ
```

- **`root`** は、設定がないロガーのデフォルト
- **パッケージ単位**で細かく制御できる

たとえば、本番ではこんなふうにすると、ノイズを抑えつつ重要なログを残せます。

```yaml
logging:
  level:
    root: WARN
    com.example.shop: INFO    # 自社業務ログだけ INFO
```

---

## レベルを動的に変える ― Actuator

業務システムでは、「**いま、特定パッケージだけ DEBUG にしたい**」ことが、しばしば起きます。
そのために**アプリを再起動**するのは大変です。

Spring Boot Actuator を入れると、**起動中のアプリのログレベルを HTTP で動的に変更**できます。

```text
POST /actuator/loggers/com.example.shop
{
  "configuredLevel": "DEBUG"
}
```

入門段階では使わなくてかまいませんが、「**こんな機能がある**」と覚えておくと、現場で困らないでしょう。

---

## レベルの実機確認

第40章の章扉でセットアップした `LogDemoApplication` を動かすと、こんな出力になります。

```text
INFO  [] c.e.log.LogDemoApplication - 注文を受け付けました: orderId=1001, userId=42
WARN  [] c.e.log.LogDemoApplication - 外部API遅延: latencyMs=1500
ERROR [] c.e.log.LogDemoApplication - 注文処理が失敗しました: orderId=1001
java.lang.RuntimeException: DB接続失敗
        at com.example.log.LogDemoApplication.run(LogDemoApplication.java:25)
        at ...
DEBUG [] c.e.log.LogDemoApplication - デバッグ: 詳細情報 = DUMP
```

- INFO は淡々と
- WARN は「これは様子を見るべき」
- ERROR は**スタックトレース**つきで、即座に注目される
- DEBUG は `application.yml` で `com.example.log: DEBUG` にしたので出る

「**ログを見ただけで、何が大事か**」が伝わるか? という観点で、自分のログを点検する習慣をつけましょう。

---

## まとめ

- レベルは、**TRACE / DEBUG / INFO / WARN / ERROR** の 5 段階
- **業務エラーは INFO / WARN**、**本物の異常だけ ERROR**
- パッケージ単位で**レベルを設定**できる
- 本番では `INFO` または `WARN` を基準に
- Spring Boot Actuator で**動的にレベル変更**できる
- ログ出力を見て「**重要度の伝わるログか**」を点検する

次の節は、機械が読みやすい**構造化ログ**を学びます。

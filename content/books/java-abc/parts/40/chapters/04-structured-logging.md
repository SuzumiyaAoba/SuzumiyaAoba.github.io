---
title: 構造化ログ
llm: true
---

## 構造化ログ

ここまでに書いてきたログは、**人間が読みやすい形**でした。

```text
INFO 注文受付: orderId=1001, userId=42, total=12800
```

これは読むぶんには分かりやすいですが、**機械が処理**しようとすると意外に厄介です。
たとえば、

- 「**今日、ユーザー 42 が出した注文の合計金額**を集計したい」
- 「**`total` が 50000 以上の注文だけ**抜き出したい」

を実現するには、ログを**正規表現でパース**することになります。
業務システムでログを大量に扱う現場では、これがすぐ限界になります。

そこで使われるのが、**構造化ログ**（structured logging）です。

---

## 構造化ログとは

構造化ログは、**ログそのものを構造化されたデータ**（JSON など）で書く、というアイデアです。

```json
{"timestamp":"2026-06-18T18:17:44.374Z","level":"INFO","logger":"OrderService","message":"注文受付","orderId":1001,"userId":42,"total":12800}
```

このようにすると、

- フィールドごとに**機械的に処理**できる
- ログ集約システム（Datadog、Elasticsearch、Splunk）が**自動でインデックス**を作る
- 「**`total >= 50000` の注文だけ表示**」のような検索が、一瞬でできる
- 人間が読むときも、**ログビューア**が整形して表示

業務システムでは、本番ログは**ほぼ常に構造化ログ**にします。

---

## Logback での構造化ログ ― logstash-logback-encoder

Logback で JSON 形式のログを出すには、**`logstash-logback-encoder`** というライブラリが定番です。
`pom.xml` に追加します。

```xml
<dependency>
    <groupId>net.logstash.logback</groupId>
    <artifactId>logstash-logback-encoder</artifactId>
    <version>8.0</version>
</dependency>
```

そして、Logback の設定ファイル（次節で扱います）で、**エンコーダ**を `LogstashEncoder` に変えます。

```xml
<appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="net.logstash.logback.encoder.LogstashEncoder"/>
</appender>
```

これだけで、ログが **JSON 形式**になります。

```json
{"@timestamp":"2026-06-18T18:17:44.374+09:00","@version":"1","message":"注文受付","logger_name":"com.example.shop.OrderService","thread_name":"main","level":"INFO"}
```

---

## 値を**キー付き**で残す ― key-value 引数

構造化ログの威力を活かすには、業務的な値を**フィールドとして**残すことが大事です。
`logstash-logback-encoder` には、**StructuredArguments** という補助があります。

```java
import static net.logstash.logback.argument.StructuredArguments.kv;

log.info("注文受付", kv("orderId", orderId), kv("userId", userId), kv("total", total));
```

これで、JSON にこんなフィールドが追加されます。

```json
{"message":"注文受付","orderId":1001,"userId":42,"total":12800}
```

- メッセージは**人間向け**
- 個別の値は**機械が検索しやすい**フィールド

両方の良さを取れる、現代的な書き方です。

---

## SLF4J 2.0 の Fluent API

SLF4J 2.0 以降は、構造化ログ風に書ける **Fluent API** が標準にもあります。

```java
log.atInfo()
    .setMessage("注文受付")
    .addKeyValue("orderId", orderId)
    .addKeyValue("userId", userId)
    .addKeyValue("total", total)
    .log();
```

Logback の対応次第で、これが JSON のフィールドにも反映されます。
ライブラリ非依存で書きたいときの選択肢です。

---

## メッセージは「**何が起きた**」を簡潔に

構造化ログを採用すると、メッセージにあれこれ詰め込まなくてよくなります。

```java
// △ 旧スタイル ― 全部メッセージに詰める
log.info("注文受付: orderId=" + orderId + ", userId=" + userId);

// ◯ 新スタイル ― メッセージは「何が起きた」だけ
log.info("注文受付", kv("orderId", orderId), kv("userId", userId));
```

メッセージは「**業務イベントの名前**」、値は**フィールド**として書く ―― これが、構造化ログの作法です。

---

## サーバー側で構造化ログを活用する

構造化ログを本領発揮させるには、**ログ集約システム**と組み合わせます。
代表的なスタックは、

- **ELK スタック** … Elasticsearch + Logstash + Kibana
- **EFK スタック** … Elasticsearch + Fluentd + Kibana
- **Loki + Grafana**
- **Datadog Logs**
- **Splunk**
- **CloudWatch Logs**（AWS）

これらに JSON ログを送れば、

- 「**`level=ERROR` のログ件数**」のグラフ
- 「**`orderId=1001` の関連ログだけ**」の絞り込み
- 「**`userId=42` のすべての操作**」の追跡
- 「**`total >= 50000` の注文**」のリストアップ

が、UI からポチポチで実現できます。

---

## いつ構造化ログにするか?

- 個人プロジェクト、小さな CLI ツール → **人間向けで十分**
- Web API、業務システム、マイクロサービス → **構造化ログを使う**

「**ログを集約・検索する仕組みがある**」現場では、構造化ログは**ほぼ必須**です。
入門段階でも、「**こういう書き方がある**」と知っておくだけで、初日から戦力になれます。

---

## 個人情報・機密の扱い

構造化ログには、機械処理しやすい反面、**個人情報がそのまま検索可能**になるリスクもあります。

- メールアドレス、電話番号
- 住所、生年月日
- 認証トークン、パスワード

これらを**そのままフィールド**に入れると、ログ集約システムから漏れる可能性があります。

### 対処

- **マスキング**する（メール「abc@example.com」を「a***@example.com」に）
- **ハッシュ化**する（個人を識別する必要がなければ、ハッシュ値で）
- **そもそも残さない**

第39章でも触れたとおり、「**ログにいれる前**」に、機密かどうかを意識するのが、現場の作法です。

---

## まとめ

- **構造化ログ**は、ログを**機械処理しやすい形式（JSON）**で出す
- Logback で実現するには、**`logstash-logback-encoder`** + 設定変更
- 業務的な値は、**`kv("key", value)`** でフィールドに分離
- メッセージは「**何が起きた**」を簡潔に
- 集約システム（ELK、Datadog 等）と組み合わせて、本領発揮
- 個人情報は**マスキング**または**残さない**

次の節は、リクエスト全体を貫通する **MDC** によるリクエスト追跡を学びます。

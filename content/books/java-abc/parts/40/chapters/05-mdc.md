---
title: MDC でリクエスト追跡
llm: true
co-author: ["Claude Opus 4.7"]
---

## MDC でリクエスト追跡

業務システムのログは、しばしば「**1 リクエスト**」の単位で追跡したいことがあります。

```text
INFO  リクエスト受付: /api/orders
INFO  ユーザー認証成功
INFO  在庫確認
INFO  決済処理
ERROR 決済が失敗しました
```

このログから、「**どのリクエストの一連の流れか**」を読み取れるでしょうか。
同時に複数のリクエストが走っていると、**各 INFO がどのリクエストのものか分かりません**。

これを解決するのが、**MDC**（Mapped Diagnostic Context、診断コンテキスト）です。

---

## MDC とは

MDC は、

> 「**スレッドごとに、ログにつけたいキー = 値のペア**を保管しておけるしくみ」

です。
SLF4J の標準機能で、Logback もデフォルトで対応しています。

```java
import org.slf4j.MDC;

MDC.put("traceId", "abc-123-def");
log.info("リクエスト受付");
log.info("処理を実行");
MDC.clear();
```

こうすると、`log.info(...)` の出力に **`traceId`** が自動で付くようになります。

```text
INFO [abc-123-def] - リクエスト受付
INFO [abc-123-def] - 処理を実行
```

同じ traceId のログだけを集めれば、**1 リクエストの流れ**が追えます。

---

## 実機での動作

第40章の章扉で動かしたサンプルでは、こんな実行結果になっていました。

```text
INFO  [abc-123-def] c.e.log.LogDemoApplication - MDC付きログ
```

`[abc-123-def]` の部分が、**MDC から差し込まれた `traceId`** です。
Logback の出力パターンに `%X{traceId}` と書くと、MDC の値が埋め込まれます。

---

## Logback のパターン設定

実機で使った `application.yml` の出力パターンは、こうでした。

```yaml
logging:
  pattern:
    console: "%d{HH:mm:ss.SSS} %-5level [%X{traceId:-}] %logger{30} - %msg%n"
```

`%X{traceId:-}` の中身を解剖します。

- `%X{key}` … MDC の値を埋め込む
- `:-` … 値がないときのデフォルト（空文字）

MDC に `traceId` が入っていれば、その値が表示され、入っていなければ空のままになります。

---

## なぜ「**スレッドごと**」なのか?

MDC の重要なポイントは、

> **「同じスレッド」**で put された値は、`clear` まで保持される

ということです。
ふつうの Web リクエストは、**1 リクエスト = 1 スレッド**で処理されます。
だから、リクエストの入口で `put`、出口で `clear` すれば、そのリクエストの**すべてのログ**に、自動で `traceId` が付くのです。

---

## Spring Boot での自動化

毎回 `put` / `clear` を書くのは大変です。
Spring MVC では、**フィルタ（Filter）**を使ってリクエストの境界で自動的に行います。

```java
@Component
public class TraceIdFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest req,
            HttpServletResponse res,
            FilterChain chain) throws ServletException, IOException {

        String traceId = req.getHeader("X-Trace-Id");
        if (traceId == null) {
            traceId = UUID.randomUUID().toString();
        }
        MDC.put("traceId", traceId);
        try {
            chain.doFilter(req, res);
        } finally {
            MDC.clear();
        }
    }
}
```

これで、

- リクエスト到着時に `X-Trace-Id` ヘッダーを取り出す（なければ新規発番）
- MDC に登録
- 処理終了時に `clear`

という流れが、自動化されます。
リクエストごとに**ユニークな ID** が振られ、すべてのログに自動付与されます。

---

## マイクロサービスでの「分散トレース」

マイクロサービス間で、**同じ `traceId`** を引き継ぐと、

- サービス A の Controller のログ
- サービス B の Service のログ
- サービス C の Repository のログ

を、**ぜんぶ同じ ID で串刺し**できます。
これを **分散トレーシング**（distributed tracing）と呼びます。

Spring Boot 3 では、**Micrometer Tracing** という標準ライブラリで、

- traceId（リクエスト全体）
- spanId（サービス内の処理単位）

を自動で MDC に入れてくれます。
HTTP 呼び出しのヘッダーにも自動で付与され、**サービス間で引き継がれる**しくみです。

入門段階では「**そういう仕組みがある**」と覚えておけば十分。
業務システムを書くようになったら、Micrometer Tracing + Zipkin / Tempo を組み合わせるのが、現代の定石です。

---

## MDC を活用するときの注意点

### 1. `clear` を忘れない

`put` したまま `clear` を忘れると、

- **そのスレッドが、次のリクエストを処理**するときに、**前の `traceId` が残る**
- 「**まったく違うリクエストのログに、別の traceId**」という、最悪の事故

業務システムでは**重大なバグ**なので、`try-finally` で必ず `clear` します。

### 2. 機密情報を入れない

MDC に入った値は、**そのスレッドのすべてのログ**に出ます。
パスワードや認証トークンを入れると、**全ログに**残り、漏洩のリスクが上がります。
「機械が処理する識別子」だけにしましょう。

### 3. 非同期スレッドへの引き継ぎ

`CompletableFuture` や別スレッドプールに処理を渡すと、MDC は**引き継がれません**。

```java
CompletableFuture.runAsync(() -> {
    log.info("非同期処理");   // ← traceId が空
});
```

これを解決するには、

- MDC のスナップショットを別スレッドに**手で渡す**
- **Micrometer の `Wrappers`** や **Spring の `ContextPropagation`** を使う

業務システムでは、第29章で学んだ仮想スレッドや、Project Reactor のような非同期処理を併用するときに、特に意識します。

---

## MDC 以外にもある「コンテキスト」

業務システムでは、リクエスト単位の値（ユーザー ID、テナント ID、リクエスト元 IP）を、ログ以外でも持ち回りたいことがあります。

- **`ThreadLocal`** … ふつうの「スレッドごとの保管庫」
- **`InheritableThreadLocal`** … 子スレッドにも引き継ぐ
- **`ScopedValue`**（Java 21+ プレビュー） … `ThreadLocal` の現代版

これらは、ロギングと組み合わせて、リクエストごとの状態を管理する仕組みとして使われます。
本書では深入りしませんが、「**MDC は、ロギング専用の `ThreadLocal`**」と考えると分かりやすいです。

---

## まとめ

- **MDC** は、ログに**スレッドごとのキー=値**を自動付与するしくみ
- Logback の **`%X{key}`** で値を出力
- **Spring の Filter** で `put` / `clear` を自動化する
- マイクロサービスでは、**分散トレーシング**（Micrometer Tracing）で引き継ぐ
- 必ず `try-finally` で `clear` する（前のリクエストの値が混ざる事故を防ぐ）
- 非同期スレッドへの引き継ぎには、別の仕組みが必要

次の節は、**Logback の設定**と、ログファイルの**ローテーション**について学びます。

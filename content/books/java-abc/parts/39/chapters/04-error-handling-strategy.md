---
title: 境界での集約とログ
llm: true
co-author: ["Claude Opus 4.7"]
---

## 境界での集約とログ

例外の捕まえ方には、**戦略**があります。

- **どこで** 捕まえるか
- **何を** ログに残すか
- **誰に** 通知するか

ここを設計しておくと、運用フェーズでぐっと楽になります。

---

## 例外は、**境界**で集約する

業務システムで、例外を捕まえるべき場所は、基本的に**境界**です。

| 境界 | 集約する例外ハンドラ |
|---|---|
| REST API の入口 | `@RestControllerAdvice` |
| バッチの入口 | `main` メソッドの try-catch |
| 非同期処理の境界 | `ExecutorService` の `uncaughtExceptionHandler` |
| メッセージキューの consumer | `@RabbitListener` などの ErrorHandler |

「**サービスの一番外側**」に、ハンドラを 1 つ置く。
内部のコードでは、原則として `catch` を書かない ―― これが、現代的な書き方です。

```text
[境界]                            ← ここで集約してハンドリング
   ↓
[Controller]                      ← catch しない
   ↓
[Service]                         ← catch しない、ドメイン例外を投げる
   ↓
[Repository]                      ← catch しない、SQLException は Spring がラップ
```

各層は、自分の責務に集中し、例外は**上に流す**のが基本です。

---

## 「不必要に catch しない」

入門段階で起きがちなのが、**気休めの catch** です。

```java
try {
    bookRepository.save(book);
} catch (Exception e) {
    System.out.println("エラー発生");   // △ 何の意味もない
}
```

これは、いわゆる**例外の握りつぶし**で、業務システムでは**やってはいけない**典型です。

- ログに**詳細**が残らない
- 上の層に**例外が伝わらない**
- バグの**証拠が消える**

### catch していい場面

- **業務的なリカバリ**ができるとき（例: リトライ、デフォルト値の使用）
- 例外を**ドメイン例外にラップ**するとき
- **境界で集約**するとき

これらに該当しなければ、`catch` は書かないのが正解です。

---

## ログは「捕まえた場所」で書く

`catch` するなら、**必ずログを残す**のがルールです。
これを忘れて再 throw すると、

- 上層でもう一度 catch されてログが出る
- ログが**二重・三重に**出力される
- 量だけ多くて、何が起きたかわからない

という、運用での悪夢が始まります。

```java
// △ ログを出してから再 throw → 上層でもまたログ
try {
    ...
} catch (Exception e) {
    log.error("失敗", e);
    throw e;
}
```

### 対処

- 「**最終的に処理する場所**」だけでログを残す（基本は境界のハンドラ）
- 途中で**ラップして throw**するときは、**ログを出さない**
- どうしても途中で記録したいなら、`log.debug` などの低レベルで残し、**運用ログには出さない**

---

## ログには「何を」書くか

エラーログには、次の情報を入れるのが理想です。

| 要素 | 例 |
|---|---|
| いつ | タイムスタンプ（ログラインに自動付与） |
| どこで | クラス名・メソッド名（ロガーに自動付与） |
| 何を | エラーメッセージ |
| なぜ | スタックトレース（**例外オブジェクトを最後の引数に**） |
| 誰が | リクエスト ID・ユーザー ID・トレース ID |
| どんな状況で | 入力値の概要（**個人情報は伏字に**） |

第40章で扱う **SLF4J** の書き方で言うと、

```java
log.error("注文の保存に失敗: userId={}, orderId={}", userId, orderId, e);
```

最後の `e` が**例外オブジェクト**として認識され、**スタックトレース**がそのまま出ます。
これがないと、原因究明が**著しく難しく**なります。

> **重要: 例外の `getMessage()` だけをログに書かない**
>
> ```java
> log.error("失敗: " + e.getMessage());   // △ スタックトレースが消える
> ```
>
> これは典型的なアンチパターンで、原因究明の手がかりを失います。
> **必ず例外オブジェクト `e` を引数で渡す**こと。

---

## ログレベルの使い分け

ログは、**レベル**で重要度を分けます。

| レベル | 用途 |
|---|---|
| `TRACE` | 細かい動きの追跡（ほぼ開発時のみ） |
| `DEBUG` | 開発時の状態確認 |
| `INFO` | 正常時の業務イベント（注文受付、ログイン成功） |
| `WARN` | 異常ではないが注意すべき状況（リトライ発生、外部 API 遅延） |
| `ERROR` | 異常。**人間が対応**すべき |

エラーハンドラで `log.error(...)` を呼ぶときは、

- 本当に「**人間が見るべき**」エラーか?
- 業務的な失敗（在庫不足など）は、**`INFO` か `WARN`** で十分なことも

を意識します。
業務エラーまで `ERROR` で出すと、**ノイズで本当の異常が埋もれる**ことになります。

---

## エラーを「通知する」 ― 監視への連携

ログだけでは、エラーが起きてもチームが気づきません。
本番運用では、**通知**の仕組みと組み合わせます。

- **Slack に通知**（特定の `ERROR` ログをトリガーに）
- **PagerDuty / Opsgenie** で**オンコール**を起こす
- **Sentry**、**Datadog**、**New Relic** のような APM で**エラートラッキング**

これらは、エラーハンドラ自体に通知ロジックを書くというより、**ログ基盤と監視基盤を組み合わせて**実現します。
入門段階では、「**ログを正しく出す**」ことが、いちばん大事です。

---

## 例外の境界ハンドラの実例

第38章で書いた `@RestControllerAdvice` を、もう一段ふつうの業務向けにします。

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NotFoundException e) {
        log.info("Not Found: code={}, message={}", e.getCode(), e.getMessage());
        return ResponseEntity.status(404).body(
            ErrorResponse.of(404, e.getCode(), e.getMessage()));
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessRuleException e) {
        log.warn("Business rule violated: code={}, message={}", e.getCode(), e.getMessage());
        return ResponseEntity.status(422).body(
            ErrorResponse.of(422, e.getCode(), e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAny(Exception e) {
        log.error("Unexpected error", e);   // ← 想定外。スタックトレース付き ERROR
        return ResponseEntity.status(500).body(
            ErrorResponse.of(500, "INTERNAL_ERROR", "サーバー内部でエラーが発生しました"));
    }
}
```

ポイント：

- **業務エラー**は `INFO` / `WARN`（人間が見るべきではない）
- **想定外**は `ERROR` で**スタックトレース付き**
- API のレスポンスからは、内部情報を漏らさない（**汎用メッセージ**）

---

## まとめ

- 例外は、**境界**（API の入口・バッチの main）で集約してハンドリング
- **不必要な catch は書かない**（握りつぶし禁止）
- ログは「**捕まえた場所で 1 回だけ**」
- **例外オブジェクト `e` を log の引数に**渡す（`getMessage()` だけはダメ）
- **`INFO`・`WARN`・`ERROR`** を業務的に使い分ける
- 業務エラーは `INFO` / `WARN`、想定外は `ERROR`
- 通知・監視は、**ログ基盤と組み合わせて**実現

次の節では、例外を使わずにエラーを表現する **Result 型**と **`Optional`** を学びます。

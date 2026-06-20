---
title: エラーレスポンスの設計
llm: true
---

## エラーレスポンスの設計

REST API でエラーを返すとき、

- **ステータスコード**
- **ボディの構造**
- **メッセージの粒度**

をどうするか、ちゃんと設計しておくことが大事です。
この節では、業務システムで通用する**エラーレスポンスの設計指針**を整理します。

---

## ステータスコードの選び方

第38章で見た一覧を、もう一度整理します。

| ステータス | 使う場面 | 例 |
|---|---|---|
| **400 Bad Request** | 入力の**形式**が不正 | 必須項目が空、文字列の長さ違反 |
| **401 Unauthorized** | 認証されていない | トークンなし、期限切れ |
| **403 Forbidden** | 認証済みだが**権限がない** | 他人のデータを見ようとした |
| **404 Not Found** | リソースが**存在しない** | 該当 ID の本がない |
| **409 Conflict** | 状態の**競合** | 同じ ID で二重登録 |
| **422 Unprocessable Entity** | 形式は OK だが**業務的に不正** | 在庫不足、注文締切後 |
| **429 Too Many Requests** | **レート制限** に引っかかった | API コール数の上限 |
| **500 Internal Server Error** | サーバー側の**バグ・想定外** | NullPointerException など |
| **502 / 503 / 504** | 上流の依存が不調 | 外部 API 障害、DB 切断 |

「**400 か 422 か**」は、よく議論になります。

- **400** … `JSON が壊れている`・`必須が空`・`型が違う`（形式エラー）
- **422** … `JSON は読めるが、業務的にダメ`（在庫不足、二重登録など）

完全な決まりはありませんが、「**HTTP として読めるかどうか**」を境目にする流派が多いです。

---

## ボディの構造 ― 共通フォーマットにする

エラーレスポンスのボディは、**API 全体で共通の形**にします。
これにより、クライアントが**一様にエラー処理**を書けます。

```json
{
  "status": 422,
  "code": "STOCK_INSUFFICIENT",
  "message": "在庫が不足しています",
  "timestamp": "2026-06-17T08:53:16Z",
  "path": "/api/orders",
  "details": {
    "productId": 100,
    "stock": 3,
    "requested": 10
  },
  "traceId": "abc123def456"
}
```

各フィールドの役割：

| フィールド | 役割 |
|---|---|
| `status` | HTTP ステータスコード（ボディと矛盾しないように） |
| `code` | 機械可読なエラーコード（クライアントが分岐に使う） |
| `message` | 人間向けのメッセージ |
| `timestamp` | エラー発生時刻 |
| `path` | エラーが起きた URL |
| `details` | 業務的な詳細情報 |
| `traceId` | 分散トレーシング ID（**サーバー側のログと突合**できる） |

すべての項目が**必須**というわけではありません。
チームの方針で、必要なものだけ残してかまいません。

---

## 共通レスポンスを record で書く

これを Java で書くなら、record が便利です。

```java
public record ErrorResponse(
    int status,
    String code,
    String message,
    Instant timestamp,
    String path,
    Map<String, Object> details,
    String traceId
) {
    public static ErrorResponse of(int status, String code, String message) {
        return new ErrorResponse(status, code, message,
            Instant.now(), null, null, null);
    }
}
```

`@RestControllerAdvice` から、これを返すだけで、API 全体で一貫したフォーマットになります。

---

## ProblemDetail（RFC 7807）も視野に

第38章でも触れた **ProblemDetail**（RFC 7807）は、エラーレスポンスの**業界標準**です。

```json
{
  "type": "https://example.com/probs/out-of-stock",
  "title": "Stock insufficient",
  "status": 422,
  "detail": "在庫が不足しています",
  "instance": "/api/orders/123"
}
```

Spring Boot 3 で標準サポートされていて、

```yaml
spring:
  mvc:
    problemdetails:
      enabled: true
```

を入れるだけで、デフォルトのエラーレスポンスが ProblemDetail 形式になります。

「業界標準」と「自社の形」のどちらを採るかは、

- 外部に公開する API なら **ProblemDetail**（互換性・サードパーティが理解できる）
- 内部向けで、フロントエンドと密結合なら **自社の形**（自由に設計できる）

という基準で選べばよいでしょう。

---

## 情報を**漏らさない**

エラーレスポンスは、便利さと**情報漏洩**のバランスが大事です。

### 漏らしてはいけないもの

- **スタックトレース**
- **SQL 文の中身**
- **内部のクラス名・ファイルパス**
- **個人情報**（メールアドレス・電話番号など）

これらが見えてしまうと、**攻撃の手がかり**になります。
本番では、**500 のメッセージは「サーバー内部でエラーが発生しました」など、汎用的なもの**にとどめます。

### 漏らしてよいもの

- 業務的な失敗の理由（在庫不足、二重登録など）
- 入力エラーの詳細（どのフィールドが何でダメか）

これらは、**ユーザーがリカバリするために必要**な情報です。
業務エラーは積極的に**わかりやすく**返しましょう。

---

## ログとレスポンスを分けて考える

ここがポイントです。

| | レスポンス | ログ |
|---|---|---|
| 内容 | クライアント向けの**最小限**の情報 | 開発者向けの**最大限**の情報 |
| 詳細 | 業務的な意味だけ | スタックトレース・SQL・内部状態 |
| 個人情報 | できるだけ伏字 | 必要なら残す（ただしマスキング） |

両者は**別物**として、`@RestControllerAdvice` で**それぞれ組み立てる**のが鉄則です。

```java
@ExceptionHandler(Exception.class)
public ResponseEntity<ErrorResponse> handleAny(Exception e, HttpServletRequest request) {
    String traceId = UUID.randomUUID().toString();

    // ログには詳細を残す
    log.error("Unexpected error: traceId={}, path={}", traceId, request.getRequestURI(), e);

    // レスポンスは最小限
    return ResponseEntity.status(500).body(
        new ErrorResponse(500, "INTERNAL_ERROR",
            "サーバー内部でエラーが発生しました",
            Instant.now(), request.getRequestURI(), null, traceId));
}
```

`traceId` を共通の手がかりにすることで、**問い合わせがあったとき**にログを突き合わせて原因を追跡できます。

---

## バリデーションエラーの返し方

バリデーションエラーは、**フィールドごとの問題**をリストで返すのが親切です。

```json
{
  "status": 400,
  "code": "VALIDATION_FAILED",
  "message": "入力値に誤りがあります",
  "fields": [
    { "field": "title", "message": "必須項目です" },
    { "field": "publishedYear", "message": "1900 以上で指定してください" }
  ]
}
```

```java
@ExceptionHandler(MethodArgumentNotValidException.class)
public ResponseEntity<...> handleValidation(MethodArgumentNotValidException e) {
    List<Map<String, String>> fields = e.getBindingResult().getFieldErrors().stream()
        .map(f -> Map.of(
            "field", f.getField(),
            "message", f.getDefaultMessage()))
        .toList();

    return ResponseEntity.badRequest().body(Map.of(
        "status", 400,
        "code", "VALIDATION_FAILED",
        "message", "入力値に誤りがあります",
        "fields", fields));
}
```

フロントエンドは、`fields` を見て**入力欄ごと**にエラーを表示できます。

---

## まとめ

- ステータスは **HTTP 標準**に沿って、業務的に正しく選ぶ
- ボディは **共通フォーマット**を決めて使い回す
- **機械可読なコード**と**人間向けメッセージ**を両方持つ
- 外部向け API は **ProblemDetail（RFC 7807）**を検討
- **情報漏洩**に注意（スタックトレース、SQL、内部パス）
- **ログ**と**レスポンス**は別物。それぞれの目的に合わせて書く
- **`traceId`** で、ログとレスポンスを突き合わせられるようにする
- バリデーションエラーは、**フィールド単位**で返す

次の節は、エラーハンドリングでの**よくあるつまずき**を整理します。

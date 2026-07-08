---
title: 例外ハンドリング
llm: true
co-author: ["Claude Opus 4.7"]
---

## 例外ハンドリング

前節までで、

- ID が見つからないと `BookNotFoundException` が投げられる
- 入力が不正だと `MethodArgumentNotValidException` が投げられる

ところまでは作りました。
ですが、エラーレスポンスは、

- **500 Internal Server Error**（`BookNotFoundException` の場合）
- フィールド別の情報がない（バリデーションエラーの場合）

と、クライアントが扱いにくい状態です。
この節では、これらを**まとめて整形する**しくみを学びます。

---

## 例外を変換する 3 つの方法

Spring で例外をハンドリングする方法は、主に 3 つあります。

| 方法 | 用途 |
|---|---|
| **`@ResponseStatus`** | 例外クラスにステータスだけ付ける |
| **`@ExceptionHandler`** | 1 つのコントローラの中だけ |
| **`@RestControllerAdvice`** | **全コントローラ共通**（推奨） |

実務でいちばんよく使うのは **`@RestControllerAdvice`** です。
ここで全ハンドリングを集約するのが、現代的な書き方です。

---

## 方法1 ― `@ResponseStatus` で例外にステータスを付ける

`BookNotFoundException` に、`@ResponseStatus` を付けます。

```java
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class BookNotFoundException extends RuntimeException {
    public BookNotFoundException(long id) {
        super("Book not found: " + id);
    }
}
```

これだけで、`BookNotFoundException` が投げられたときに、**404 Not Found** が返るようになります。
シンプルな解決策で、**1 例外 = 1 ステータス**で済むケースには、これで十分です。

ただし、

- ボディの中身を細かく組み立てられない
- 「特定のフィールドだけメッセージを変えたい」が難しい

ので、業務では次の `@RestControllerAdvice` を使うことが多いです。

---

## 方法2 ― `@RestControllerAdvice` で集約

`@RestControllerAdvice` を付けたクラスを 1 つ用意すると、**すべてのコントローラ**の例外を一括で扱えるようになります。

```java
package com.example.library;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BookNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(BookNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
            "timestamp", Instant.now().toString(),
            "status", 404,
            "error", "Not Found",
            "message", e.getMessage()
        ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException e) {
        return ResponseEntity.badRequest().body(Map.of(
            "timestamp", Instant.now().toString(),
            "status", 400,
            "error", "Bad Request",
            "message", e.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .toList()
        ));
    }
}
```

ポイントを順番に見ていきます。

### `@RestControllerAdvice`

`@ControllerAdvice` + `@ResponseBody` を兼ねたアノテーションです。
これを付けると、**戻り値が JSON として返る** ＆ **全コントローラに適用**されます。

### `@ExceptionHandler(例外クラス)`

特定の例外を捕まえるメソッドを宣言します。
複数のメソッドを並べれば、**例外ごとに違うレスポンス**を組み立てられます。

### バリデーションのメッセージ整形

```java
e.getBindingResult().getFieldErrors().stream()
    .map(f -> f.getField() + ": " + f.getDefaultMessage())
    .toList()
```

`MethodArgumentNotValidException` から、フィールド単位のエラー情報を取り出して、文字列リストに変換しています。
これで、**どのフィールドが何でダメか**が、クライアントに伝わります。

---

## 動かして確かめる

`mvn spring-boot:run` で起動して、不正なリクエストを送ってみます。

### 1. 見つからない ID

```text line-numbers=false
$ curl http://localhost:8080/api/books/999 -i
HTTP/1.1 404
Content-Type: application/json

{
  "error": "Not Found",
  "message": "Book not found: 999",
  "timestamp": "2026-06-17T09:02:53.773779Z",
  "status": 404
}
```

ちゃんと **404** で、メッセージも入っています。

### 2. バリデーション NG

```text line-numbers=false
$ curl -X POST http://localhost:8080/api/books \
       -H "Content-Type: application/json" \
       -d '{"title":"","author":"","publishedYear":1800}' -i
HTTP/1.1 400
Content-Type: application/json

{
  "error": "Bad Request",
  "message": [
    "title: 空白は許可されていません",
    "author: 空白は許可されていません",
    "publishedYear: 1900 以上の値にしてください"
  ],
  "timestamp": "2026-06-17T09:02:53.825595Z",
  "status": 400
}
```

**400** + フィールドごとの**詳しい説明**が返ります。
クライアント側で、「**この入力が悪い**」が一目でわかります。

---

## ProblemDetail（RFC 9457）― 標準形式に従う

エラーレスポンスの形式を、**業界標準**に合わせるという選択もあります。
**RFC 9457** で定められた **Problem Details for HTTP APIs** という JSON 形式です（旧 RFC 7807 を改訂・置き換えたもの）[^rfc9457]。

Spring 6 / Spring Boot 3 からは、これが**標準でサポート**されています[^spring-problemdetail]。
`application.yml` に、

```yaml
spring:
  mvc:
    problemdetails:
      enabled: true
```

を追加するだけで、エラーレスポンスが ProblemDetail 形式（`type`・`title`・`detail`・`status`・`instance`）になります。

```json
{
  "type": "about:blank",
  "title": "Not Found",
  "status": 404,
  "detail": "Book not found: 999",
  "instance": "/api/books/999"
}
```

各フィールドの意味は次のとおりです。

| フィールド | 意味 |
|---|---|
| `type` | エラー種別を識別する URI（既定値は `about:blank`） |
| `title` | 人間向けの短い要約 |
| `status` | HTTP ステータスコード |
| `detail` | 人間向けの詳しい説明 |
| `instance` | エラーが起きた具体的なリソースを示す URI |

自前で `ProblemDetail.forStatusAndDetail(...)` を組み立てることもできます。

```java
@ExceptionHandler(BookNotFoundException.class)
public ProblemDetail handleNotFound(BookNotFoundException e) {
    ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage());
    pd.setType(URI.create("https://example.com/probs/book-not-found"));
    pd.setProperty("bookId", e.getBookId());   // 独自フィールドも追加可
    return pd;
}
```

新しいプロジェクトでは、ProblemDetail を採用するのもよい選択です。
本書では、自前のシンプルな Map 形式で説明しましたが、業務で「業界標準に合わせよう」となったら、ProblemDetail を覚えてください。

[^rfc9457]: IETF RFC 9457: Problem Details for HTTP APIs, [https://www.rfc-editor.org/rfc/rfc9457](<https://www.rfc-editor.org/rfc/rfc9457>)。2023年7月公開。RFC 7807（2016年）を改訂・置き換えた現行仕様。HTTP API のエラーを構造化された JSON／XML で返すためのフォーマットを規定する。

[^spring-problemdetail]: Spring Framework Reference, "ProblemDetail," [https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html](<https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html>)。Spring Framework 6.0 / Spring Boot 3.0 から `org.springframework.http.ProblemDetail` クラスとして組み込み実装が提供される。

---

## 業務でよくある例外ハンドラ

実務でよく書く例外のリストを、紹介しておきます。

```java
@ExceptionHandler(BookNotFoundException.class)
ResponseEntity<...> handleNotFound(BookNotFoundException e) { /* 404 */ }

@ExceptionHandler(DuplicateBookException.class)
ResponseEntity<...> handleConflict(DuplicateBookException e) { /* 409 */ }

@ExceptionHandler(InsufficientStockException.class)
ResponseEntity<...> handleStock(InsufficientStockException e) { /* 422 */ }

@ExceptionHandler(MethodArgumentNotValidException.class)
ResponseEntity<...> handleValidation(MethodArgumentNotValidException e) { /* 400 */ }

@ExceptionHandler(HttpMessageNotReadableException.class)
ResponseEntity<...> handleMalformedJson(HttpMessageNotReadableException e) { /* 400 */ }

@ExceptionHandler(Exception.class)        // 最後の保険
ResponseEntity<...> handleAny(Exception e) {
    log.error("Unexpected error", e);
    return ResponseEntity.status(500).body(...);
}
```

「**最後の保険**」（`@ExceptionHandler(Exception.class)`）として、**500 を返すハンドラ**を 1 つ置いておくのがおすすめです。
予期しない例外が起きても、**スタックトレースをクライアントに見せない**ようにできます。

---

## エラーレスポンスの設計のコツ

エラーレスポンスを設計するときの、3 つのコツを紹介します。

### 1. ステータスと `error` フィールドを揃える

```json
{ "status": 404, "error": "Not Found" }
```

HTTP ステータスと、ボディの中の説明が**矛盾しない**ようにします。

### 2. `message` は人間が読むためのもの

メッセージは、**エンジニアやサポートの人**が読んで状況を理解するためのものです。
エンドユーザーに直接見せるものではない、と割り切ります。

### 3. 機械処理用のコードもあるとよい

クライアント側で「**この種類のエラーだ**」と分岐したい場合、

```json
{ "status": 409, "code": "DUPLICATE_BOOK", "message": "..." }
```

のように、**機械可読なコード**を入れておくと便利です。
これは ProblemDetail の `type` の役割でもあります。

---

## まとめ

- `@ResponseStatus` … 例外クラスに**ステータスだけ**付ける
- **`@RestControllerAdvice`** ＋ **`@ExceptionHandler`** … 全コントローラ共通のハンドラ
- バリデーションエラーは、**フィールドごとに整形**して返す
- 「最後の保険」として、**`Exception.class` のハンドラ**を置く
- 標準形式に合わせたいなら、**ProblemDetail（RFC 7807）**を使う
- レスポンスは、**ステータス・error・message・code** をそろえる

次の節は、REST API でのよくあるつまずきを整理します。

---
title: バリデーションとステータス
llm: true
co-author: ["Claude Opus 4.7"]
---

## バリデーションとステータス

前節までで、ボディを受け取って保存することはできました。
ですが、

- `title` が空のまま投げられたら?
- `publishedYear` が `-1` だったら?
- `author` が 500 文字あったら?

といった**不正な入力**を、何もしないと、

- そのまま DB に保存される
- DB 制約違反で 500 エラーになる
- レスポンスから何が悪いか分からない

ということが起きます。
これを防ぐのが、**入力バリデーション**（validation）です。

---

## 依存の追加

バリデーションに必要な Starter を、`pom.xml` に追加します。

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

これは、

- **Jakarta Bean Validation**（仕様）
- **Hibernate Validator**（実装）

がセットになった Starter です。
これで `@NotBlank` などの**バリデーションアノテーション**が使えるようになります。

---

## record にバリデーションを付ける

第4節の `BookCreateRequest` に、バリデーションを足します。

```java
import jakarta.validation.constraints.*;

public record BookCreateRequest(
    @NotBlank String title,
    @NotBlank String author,
    @Min(1900) int publishedYear
) {}
```

各アノテーションの意味は、こんな感じです。

| アノテーション | 意味 |
|---|---|
| `@NotNull` | `null` であってはならない |
| `@NotBlank` | 空文字・空白・null であってはならない（`String` 用） |
| `@NotEmpty` | 空であってはならない（`String` / コレクション） |
| `@Min(N)` / `@Max(N)` | 数値の最小/最大 |
| `@Size(min=, max=)` | 文字列・コレクションの長さ |
| `@Email` | メール形式 |
| `@Pattern(regexp=)` | 正規表現にマッチ |
| `@Positive` / `@Negative` | 正の値 / 負の値 |
| `@PastOrPresent` / `@FutureOrPresent` | 日付（`LocalDate` など） |

これらを組み合わせるだけで、ほとんどの業務要件はカバーできます。

---

## バリデーションを有効化 ― `@Valid`

バリデーションを実行してもらうには、コントローラの引数に **`@Valid`** を付けます。

```java
import jakarta.validation.Valid;

@PostMapping
public ResponseEntity<BookResponse> create(@Valid @RequestBody BookCreateRequest req) {
    ...
}
```

`@Valid` がないと、アノテーションは**飾り**で、何もチェックされません。
**`@Valid` と `@RequestBody` をセットで書く**、と覚えましょう。

---

## バリデーションに失敗したら?

不正な入力で POST すると、`MethodArgumentNotValidException` という例外が投げられます。
Spring のデフォルトでは、**400 Bad Request** + 詳しいエラーメッセージが返ります。

```text line-numbers=false
$ curl -X POST http://localhost:8080/api/books \
       -H "Content-Type: application/json" \
       -d '{"title":"","author":"","publishedYear":1800}' -i
```

```text line-numbers=false
HTTP/1.1 400
Content-Type: application/json

{
  "timestamp": "2026-06-17T09:02:53.825595Z",
  "status": 400,
  "error": "Bad Request",
  "path": "/api/books"
}
```

ただし、デフォルトのレスポンスには「**どのフィールドが、なぜダメか**」が含まれません。
クライアントが**わかるように整形する**ためには、第6節の**例外ハンドラ**を使います。

---

## ステータスコードの返し分け

業務システムの REST API では、ステータスをきめ細かく返すのが基本です。
場面ごとに、どう返すべきかの一覧をまとめます。

### 正常系

| 場面 | ステータス |
|---|---|
| GET でデータを返す | **200 OK** |
| POST で新規作成 | **201 Created** |
| PUT / PATCH で更新 | **200 OK** または **204 No Content** |
| DELETE | **204 No Content** |

### 異常系

| 場面 | ステータス |
|---|---|
| 入力が形式的におかしい（バリデーションエラー） | **400 Bad Request** |
| 認証が必要なのに、トークンがない / 期限切れ | **401 Unauthorized** |
| 認証は通ったが、その操作の権限がない | **403 Forbidden** |
| リソースが見つからない | **404 Not Found** |
| ビジネスルール違反（在庫不足、二重登録など） | **409 Conflict** or **422 Unprocessable Entity** |
| サーバー側のバグ（想定外の例外） | **500 Internal Server Error** |

「**4xx か 5xx か**」「**何の理由か**」を、ステータスで伝えるのが、よい REST API の基本です。

---

## バリデーションで気をつけたいこと

### 1. 「null だけ」と「空文字だけ」をきちんと分ける

```java
@NotNull String title    // 空文字 "" は OK
@NotBlank String title   // 空白・空文字も NG
```

UI から空文字 `""` が送られてくることはよくあります。
「**ユーザーが入力するテキスト**」には、ほぼ `@NotBlank` が正解です。

### 2. 数値の最小/最大は適切に

```java
@Min(0) int quantity        // 0 は許容
@Positive int quantity      // 1 以上のみ
```

「**0 は許すか?**」は要件次第です。明示するクセをつけましょう。

### 3. ネストしたオブジェクトには `@Valid` を伝播

```java
public record OrderCreateRequest(
    @NotNull Long userId,
    @Valid List<ItemRequest> items   // ← @Valid を再帰的に
) {}

public record ItemRequest(@NotNull Long productId, @Min(1) int quantity) {}
```

`@Valid` を付け忘れると、ネストの中はチェックされません。注意。

---

## カスタムバリデーション

標準アノテーションで足りなければ、**自作**もできます。

```java
@Target({ElementType.FIELD, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = IsbnValidator.class)
public @interface Isbn {
    String message() default "ISBN として不正です";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

public class IsbnValidator implements ConstraintValidator<Isbn, String> {
    @Override
    public boolean isValid(String value, ConstraintValidatorContext ctx) {
        // ISBN-13 のチェック処理
        return value != null && value.matches("\\d{13}");
    }
}
```

業務的なバリデーション（社員番号の形式、JAN コードなど）は、こうやって自作するのが定番です。
入門段階では「**できる**」ことだけ覚えておけば大丈夫です。

---

## まとめ

- バリデーションは **`spring-boot-starter-validation`** で導入
- record のコンポーネントに **`@NotBlank`・`@Min`** などを付ける
- コントローラ引数に **`@Valid`** を付けて有効化
- 失敗時は **400 Bad Request** + `MethodArgumentNotValidException`
- ステータスは、**意味に応じてきめ細かく**返す（201・204・400・404・409・500）
- ネストしたオブジェクトに `@Valid` を伝播するのを忘れない

次の節では、いまデフォルトで返っているエラーレスポンスを、**自前のフォーマット**に整える方法を学びます。

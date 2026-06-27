---
title: リクエストボディ
llm: true
co-author: ["Claude Opus 4.7"]
---

## リクエストボディ

GET だけでは、API は読み取り専用です。
新しい本を**登録**したり、**更新**したりするには、リクエストの**ボディ**から JSON を受け取る必要があります。
ここでは、`POST` の書き方を学んでいきます。

---

## 新規作成の API ― `POST /api/books`

REST の約束に従えば、本を 1 つ作るのは **`POST /api/books`** です。
リクエストボディには、こんな JSON が来ます。

```json
{
  "title": "新刊",
  "author": "鈴木",
  "publishedYear": 2026
}
```

これを受け取って、`Book` として保存します。

```java
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;

@PostMapping
public ResponseEntity<BookResponse> create(@RequestBody BookCreateRequest req) {
    Book book = new Book(null, req.title(), req.author(), req.publishedYear());
    Book saved = bookRepository.save(book);

    return ResponseEntity
        .created(URI.create("/api/books/" + saved.getId()))
        .body(BookResponse.from(saved));
}

public record BookCreateRequest(String title, String author, int publishedYear) {}
```

順番に見ていきます。

---

## `@RequestBody` ― ボディを Java オブジェクトに変換

```java
@PostMapping
public ResponseEntity<BookResponse> create(@RequestBody BookCreateRequest req) { ... }
```

`@RequestBody` は、

> 「リクエストの**ボディの JSON**を、引数の型に**自動で変換**してください」

という指示です。
Jackson が、JSON の各フィールドを **record のコンポーネント**にマッピングしてくれます。

---

## record でリクエスト DTO を書く

```java
public record BookCreateRequest(String title, String author, int publishedYear) {}
```

リクエストを受け取る DTO は、**record で書く**のが現代的です。
record にすると、

- **コンストラクタ・getter** が自動で生成
- フィールドは**不変**
- Jackson が**コンポーネント名どおり**に JSON とマッピング

と、何も書かなくても期待どおりに動きます。

`Book`（エンティティ、ミュータブル）と、`BookCreateRequest`（DTO、不変な record）は、**別物**として書く ―― これが REST のあるべき形です。
**エンティティをそのまま受け取る**のは、エンティティ側に「**API に公開してよい**」フィールドを縛ってしまうので、避けます。

---

## `ResponseEntity` ― 細かいレスポンスを組み立てる

```java
return ResponseEntity
    .created(URI.create("/api/books/" + saved.getId()))
    .body(BookResponse.from(saved));
```

`ResponseEntity<T>` は、**HTTP ステータス・ヘッダー・ボディ**を細かく制御できるクラスです。

- `.created(URI)` … **201 Created** ステータスを設定し、`Location` ヘッダーに作成されたリソースの URL を入れる
- `.body(...)` … レスポンスボディを設定

`POST` で新規作成したときは、

- **201 Created** を返す
- **`Location` ヘッダー**に新しいリソースの URL を載せる

のが、REST のお作法です。
クライアントは、`Location` を見て「**新しく作られたリソースの URL**」を知ることができます。

---

## 動かしてみる

`mvn spring-boot:run` で起動して、`curl` で叩いてみます。

```text
$ curl -X POST http://localhost:8080/api/books \
       -H "Content-Type: application/json" \
       -d '{"title":"新刊","author":"鈴木","publishedYear":2026}' \
       -i
```

実機での出力：

```text
HTTP/1.1 201
Location: /api/books/4
Content-Type: application/json

{"id":4,"title":"新刊","author":"鈴木","publishedYear":2026}
```

- ステータスは **`201`**
- `Location` に **`/api/books/4`** が入っている
- ボディに、作成された本の JSON が返ってきた

REST の理想どおりの動きです。

---

## ステータスをアノテーションで指定 ― `@ResponseStatus`

`ResponseEntity` を使わずに、**メソッドアノテーション**でステータスを指定することもできます。

```java
@PostMapping
@ResponseStatus(HttpStatus.CREATED)
public BookResponse create(@RequestBody BookCreateRequest req) {
    Book saved = bookRepository.save(new Book(null, req.title(), req.author(), req.publishedYear()));
    return BookResponse.from(saved);
}
```

これだと、`Location` ヘッダーは付けられませんが、**コードは短く**なります。
「ステータスだけ変えたい」場面では便利です。

---

## 更新の API ― `PUT /api/books/{id}`

更新は、`PUT` または `PATCH` を使います。

```java
@PutMapping("/{id}")
public BookResponse update(
        @PathVariable Long id,
        @RequestBody BookUpdateRequest req) {

    Book book = bookRepository.findById(id)
        .orElseThrow(() -> new BookNotFoundException(id));

    book.setTitle(req.title());
    book.setAuthor(req.author());
    book.setPublishedYear(req.publishedYear());

    return BookResponse.from(book);   // @Transactional で自動 UPDATE
}

public record BookUpdateRequest(String title, String author, int publishedYear) {}
```

- `@PutMapping("/{id}")` で `PUT /api/books/{id}` を処理
- パスから `id` を取り、ボディから新しい値を取る
- 取得した `Book` のフィールドを更新する
- メソッドに `@Transactional`（あるいは Service 経由）があれば、`save` を呼ばなくても**永続コンテキストの追跡**で UPDATE が走る（第37章）

---

## 削除の API ― `DELETE /api/books/{id}`

削除は、シンプルです。

```java
@DeleteMapping("/{id}")
@ResponseStatus(HttpStatus.NO_CONTENT)
public void delete(@PathVariable Long id) {
    bookRepository.deleteById(id);
}
```

削除の結果は「**204 No Content**」を返すのが REST の慣習です。
ボディはなく、戻り値は `void` のままで OK。
`@ResponseStatus(HttpStatus.NO_CONTENT)` で、ステータスを 204 に明示します。

実行すると、

```text
$ curl -X DELETE http://localhost:8080/api/books/1 -i
HTTP/1.1 204
Content-Length: 0
```

シンプル。

---

## 一覧と詳細・作成・更新・削除 ― CRUD のまとめ

ここまでの API をまとめると、こうなります。

| メソッド | URL | 用途 | ステータス |
|---|---|---|---|
| GET | `/api/books` | 全件取得 / 検索 | 200 |
| GET | `/api/books/{id}` | 1 件取得 | 200 / 404 |
| POST | `/api/books` | 新規作成 | 201 |
| PUT | `/api/books/{id}` | 全体更新 | 200 / 404 |
| DELETE | `/api/books/{id}` | 削除 | 204 |

これが、リソース 1 つに対する**完全な CRUD API** です。
業務システムの API のうち、9 割はこのパターンで書けます。

---

## まとめ

- リクエストボディは **`@RequestBody`** で受け取る
- リクエスト DTO は、**record で書く**のが現代的
- ステータスは **`ResponseEntity`** か **`@ResponseStatus`** で指定
- 新規作成は **201 Created** + **`Location` ヘッダー**が REST のお作法
- 更新は **PUT / PATCH**、削除は **DELETE + 204 No Content**
- 1 つのリソースに対する **CRUD 5 エンドポイント**で、ほぼ完結する

次の節では、入力チェック（バリデーション）と HTTP ステータスを丁寧に扱います。

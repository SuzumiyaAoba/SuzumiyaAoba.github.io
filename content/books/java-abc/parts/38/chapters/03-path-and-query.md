---
title: パス変数とクエリパラメータ
llm: true
co-author: ["Claude Opus 4.7"]
---

## パス変数とクエリパラメータ

GET だけのコントローラを、もう少し実用的にしていきます。
クライアントが「**どの本を**」「**どんな条件で**」と指定するために、

- **パス変数**（URL の中の値、例: `/books/1`）
- **クエリパラメータ**（`?` 以降の値、例: `?author=鈴木`）

の 2 つを使えるようになる必要があります。

---

## パス変数 ― `@PathVariable`

「ID で 1 件取得する」 API を作ってみます。

```java
@GetMapping("/{id}")
public BookResponse get(@PathVariable Long id) {
    return bookRepository.findById(id)
        .map(BookResponse::from)
        .orElseThrow(() -> new BookNotFoundException(id));
}
```

ポイントは 2 つです。

### `@GetMapping("/{id}")`

`{id}` の中括弧で、**パスの一部を変数として受け取る**ことを示します。
クラスレベルの `@RequestMapping("/api/books")` と合わさり、**`GET /api/books/{id}`** にマッチするようになります。

### `@PathVariable Long id`

パスから取り出した `{id}` を、**メソッド引数の `id`** に渡してもらいます。
型は `Long` でも `int` でも `String` でも構いません。Spring が**自動で型変換**してくれます。

実機で動かしてみると、

```text line-numbers=false
$ curl http://localhost:8080/api/books/1
{"id":1,"title":"Java入門","author":"鈴木","publishedYear":2026}
```

`{id}` に `1` が代入されて、その本が JSON で返ります。

---

## 「見つからない」場合の扱い

```java
return bookRepository.findById(id)
    .map(BookResponse::from)
    .orElseThrow(() -> new BookNotFoundException(id));
```

`findById` は `Optional<Book>` を返します（第37章）。
見つからなければ、`BookNotFoundException` を投げます。

```java
public class BookNotFoundException extends RuntimeException {
    public BookNotFoundException(long id) {
        super("Book not found: " + id);
    }
}
```

このまま投げると、Spring のデフォルトでは**500 Internal Server Error**が返ります。
ですが、本当は **404 Not Found** を返したい ―― これを第6節の例外ハンドリングで解決します。

---

## 複数のパス変数

パス変数は、**何個でも書けます**。

```java
@GetMapping("/{bookId}/reviews/{reviewId}")
public ReviewResponse getReview(
        @PathVariable Long bookId,
        @PathVariable Long reviewId) {
    ...
}
```

URL の `{bookId}` と `{reviewId}` が、メソッド引数 `bookId` と `reviewId` にそのまま渡されます。
URL 内の名前と引数名を**そろえる**のが慣習です。
名前が違うときは、`@PathVariable("bookId") Long id` のように、明示します。

---

## クエリパラメータ ― `@RequestParam`

「著者で絞り込む」API を作ってみます。

```java
@GetMapping
public List<BookResponse> list(@RequestParam(required = false) String author) {
    List<Book> books = (author == null)
        ? bookRepository.findAll()
        : bookRepository.findByAuthor(author);
    return books.stream().map(BookResponse::from).toList();
}
```

`@RequestParam` は、**`?` 以降のクエリパラメータ**を受け取ります。

```text line-numbers=false
$ curl "http://localhost:8080/api/books?author=%E4%BD%90%E8%97%A4"
[{"id":2,"title":"モダンJava","author":"佐藤","publishedYear":2025}]
```

`佐藤` のような日本語は、URL に直接書けないので **URL エンコード**（`%E4%BD%90%E8%97%A4`）して送る必要があります（`curl --data-urlencode` も使えます）。

---

## `required` ・ デフォルト値

`@RequestParam` には、いくつか細かい属性があります。

### `required = false`

```java
@RequestParam(required = false) String author
```

指定しなくてもよい、ということです。
指定がなければ、`author` は `null` になります。

`required = true`（デフォルト）のときに**指定がない**と、**400 Bad Request** が返ります。

### `defaultValue`

```java
@RequestParam(defaultValue = "10") int size
```

指定がなければ、`"10"` が使われます（型は `int` でも、Spring が変換）。

### 名前のマッピング

URL のパラメータ名と Java の引数名が違うときは、`name` を指定します。

```java
@RequestParam(name = "yr") int year
```

これで、`?yr=2026` というクエリを受け取れます。

---

## ページングのクエリパラメータ

第37章で学んだ `Pageable` を、`@RequestParam` を書かずに**そのまま引数に書ける**のが、Spring の便利機能です。

```java
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@GetMapping
public Page<BookResponse> list(Pageable pageable) {
    return bookRepository.findAll(pageable).map(BookResponse::from);
}
```

クエリで `?page=0&size=10&sort=publishedYear,desc` のように指定すると、Spring が `Pageable` に組み立ててくれます。

```text line-numbers=false
$ curl "http://localhost:8080/api/books?page=0&size=2&sort=publishedYear,desc"
{
  "content": [
    {"id":1,"title":"Java入門","author":"鈴木","publishedYear":2026},
    {"id":2,"title":"モダンJava","author":"佐藤","publishedYear":2025}
  ],
  "pageable": {...},
  "totalElements": 3,
  "totalPages": 2,
  ...
}
```

ページング API を作るときに、最初に思い出してほしいパターンです。

---

## ヘッダーから受け取る ― `@RequestHeader`

ヘッダーの値が必要なら、`@RequestHeader` を使います。

```java
@GetMapping("/me")
public UserResponse me(@RequestHeader("Authorization") String token) {
    ...
}
```

入門段階では出番が少ないですが、認証ヘッダーを受け取る場面で見かけます。
覚えておくと、いつか役立ちます。

---

## 実用例 ― 検索 API

ここまでの組み合わせで、検索 API を組み立ててみます。

```java
@GetMapping
public List<BookResponse> search(
        @RequestParam(required = false) String author,
        @RequestParam(required = false, defaultValue = "1900") int minYear,
        @RequestParam(required = false, defaultValue = "2100") int maxYear) {

    // 派生クエリでやれることはやり、それ以外は手で絞る
    List<Book> books = (author != null)
        ? bookRepository.findByAuthor(author)
        : bookRepository.findAll();

    return books.stream()
        .filter(b -> b.getPublishedYear() >= minYear)
        .filter(b -> b.getPublishedYear() <= maxYear)
        .map(BookResponse::from)
        .toList();
}
```

例として書きましたが、**実用では、DB 側で絞り込み**するように `@Query` を書きます。
ここでは「複数のクエリパラメータを受け取る形」の見本です。

---

## まとめ

- **`@PathVariable`** … URL の中の値（`/books/{id}` の `{id}` など）
- **`@RequestParam`** … `?` 以降のクエリパラメータ
- どちらも、**型変換**は Spring が自動でやってくれる
- 必須かどうかは `required`、デフォルト値は `defaultValue`
- ページングは **`Pageable`** を引数に書くだけで受け取れる
- ヘッダーは **`@RequestHeader`** で取れる

次の節では、**`POST` でリクエストボディを受け取る**書き方を学びます。

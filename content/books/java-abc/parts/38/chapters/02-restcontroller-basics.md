---
title: `@RestController` の基本
llm: true
co-author: ["Claude Opus 4.7"]
---

## `@RestController` の基本

それでは、Spring Boot で REST API を実装していきます。
本章のサンプルは、第37章の `library` プロジェクトに**そのまま追加**して動かせる形になっています。

---

## 依存の追加

`pom.xml` に、Web 用 Starter を追加します。

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

これだけで、

- **内蔵 Tomcat** が動くようになり、HTTP リクエストを受け付ける
- **Jackson** で、JSON ⇔ Java オブジェクトを変換する
- Spring MVC（Web 用のフレームワーク）が使えるようになる

という、Web の道具がぜんぶそろいます。

---

## 最小の REST コントローラ

第37章の `BookRepository` を使って、本の一覧を返す API を書いてみます。

```java
package com.example.library;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/books")
public class BookController {

    private final BookRepository bookRepository;

    public BookController(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    @GetMapping
    public List<Book> list() {
        return bookRepository.findAll();
    }
}
```

ファイルを 1 つ追加するだけで、もう **`GET /api/books`** が動きます。
3 つのアノテーションを順番に見ていきましょう。

### `@RestController` ― 「これは REST のコントローラ」

```java
@RestController
public class BookController { ... }
```

`@RestController` は、

- `@Controller`（Bean として登録される）
- `@ResponseBody`（戻り値を**そのまま JSON にして返す**）

の 2 つを兼ねたアノテーションです。
これを付けるだけで、メソッドの**戻り値が自動で JSON に変換**されます。

> **`@Controller` との違い**
>
> `@Controller` だけだと、ふつうの Web ページ（HTML テンプレート）を返す古典的な MVC コントローラになります。
> JSON を返したいなら、**必ず `@RestController`** を使います。

### `@RequestMapping("/api/books")` ― 共通のパスを指定

```java
@RequestMapping("/api/books")
public class BookController { ... }
```

このコントローラに属するすべてのメソッドの URL の**先頭部分**を、まとめて指定します。
`@GetMapping` などのメソッドに、**さらにパスを追加**できます。

### `@GetMapping` ― GET リクエストを受ける

```java
@GetMapping
public List<Book> list() { ... }
```

`@GetMapping` は、`@RequestMapping(method = RequestMethod.GET)` のショートカットです。
クラスの `@RequestMapping("/api/books")` と組み合わせて、`GET /api/books` を処理することになります。

同様に、HTTP メソッドごとに、次のショートカットがあります。

| アノテーション | HTTP メソッド |
|---|---|
| `@GetMapping` | GET |
| `@PostMapping` | POST |
| `@PutMapping` | PUT |
| `@PatchMapping` | PATCH |
| `@DeleteMapping` | DELETE |

---

## 動かす

第36章と同じく、`mvn spring-boot:run` で起動します。
ログに、Tomcat が 8080 ポートで待機していることが表示されます。

```text
INFO  Tomcat started on port(s): 8080 (http)
INFO  Started LibraryApplication in 1.234 seconds
```

別のターミナルから、`curl` で叩いてみます。

```text
$ curl http://localhost:8080/api/books
```

実機での出力：

```json
[{"id":1,"title":"Java入門","author":"鈴木","publishedYear":2026},
 {"id":2,"title":"モダンJava","author":"佐藤","publishedYear":2025},
 {"id":3,"title":"Spring実践","author":"高橋","publishedYear":2024}]
```

`Book` のリストが、自動で JSON に変換されて返されました。
私たちは、JSON の組み立てコードを**一行も書いていません**。

---

## 「エンティティをそのまま返す」のは練習用

ここまでで動きはしますが、**`Book` エンティティをそのまま返す**のは、第37章の最後で警告した**実務では避けたほうがよい書き方**です。
理由を、もう一度整理します。

- **Lazy ロード**が、シリアライズ時に発火して N+1 を起こす
- DB の構造（カラム名）が**外部 API の構造**になってしまう
- 双方向関連で**JSON が無限ループ**を起こすことがある
- 「ID は隠したい」「カラムを増やしたが公開はしたくない」が**難しい**

そこで、エンティティを **DTO**（Data Transfer Object）に変換してから返す、というのが現代的な書き方です。

---

## DTO で返す ― 安全で柔軟

`BookResponse` という record を、コントローラと一緒のファイルに置きます。

```java
@RestController
@RequestMapping("/api/books")
public class BookController {

    private final BookRepository bookRepository;

    public BookController(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    @GetMapping
    public List<BookResponse> list() {
        return bookRepository.findAll().stream()
            .map(BookResponse::from)
            .toList();
    }

    public record BookResponse(Long id, String title, String author, int publishedYear) {
        public static BookResponse from(Book book) {
            return new BookResponse(
                book.getId(), book.getTitle(), book.getAuthor(), book.getPublishedYear());
        }
    }
}
```

record（第17章）を使うことで、

- **コンストラクタ・getter・equals・hashCode・toString が自動**
- フィールドは**不変**（`final`）
- Jackson が、**フィールド名どおりに JSON 化**してくれる

と、DTO の理想形ができます。
これで、エンティティをいくらいじっても、**API の形は変わらない**ようになりました。

---

## 出力例

`/api/books` の出力は、エンティティを直接返したときと同じです。

```json
[{"id":1,"title":"Java入門","author":"鈴木","publishedYear":2026},
 {"id":2,"title":"モダンJava","author":"佐藤","publishedYear":2025}]
```

ただし、ここから「**`publishedYear` をなくしたい**」「**`author` を別オブジェクトとして返したい**」と思ったら、record を直すだけで済みます。
エンティティを巻き込まずに変更できる ―― これが DTO の力です。

---

## URL の階層を考える

`@RequestMapping("/api/books")` のように、`/api/...` という階層を切るのは、**REST API のための名前空間**を作るためです。

```text
/api/books       ← REST API
/admin/users     ← 管理画面
/static/css/...  ← 静的ファイル
```

「API」と「画面」と「静的ファイル」の URL を整理して、**他の用途とぶつからない**ようにします。
これは Spring の規約ではなく、**URL 設計の慣習**です。

---

## まとめ

- **`@RestController`** で、REST API 用のコントローラを書く
- **`@RequestMapping`** で、クラス全体の URL の先頭を指定
- **`@GetMapping`** などで、HTTP メソッドごとのエンドポイントを定義
- 戻り値は、**Jackson が自動で JSON 化**する
- エンティティを直接返さず、**DTO（record）** に変換するのが推奨
- URL は **`/api/...`** など、用途ごとに名前空間を切る

次の節では、リクエストから値を受け取る**パス変数とクエリパラメータ**を学びます。

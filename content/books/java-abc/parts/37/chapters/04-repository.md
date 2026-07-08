---
title: リポジトリ
llm: true
co-author: ["Claude Opus 4.7"]
---

## リポジトリ

**リポジトリ**（Repository、保管庫）は、エンティティを**保存・取得・更新・削除**するための窓口です。
Spring Data JPA を使うと、**interface を書くだけ**で、リポジトリが**自動生成**されます。

---

## 最小のリポジトリ

第2節の `BookRepository` を、再掲します。

```java
package com.example.library;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookRepository extends JpaRepository<Book, Long> {
    List<Book> findByAuthor(String author);
}
```

これだけで、

- 全件取得
- ID で 1 件取得
- 保存
- 更新
- 削除
- 著者で検索（`findByAuthor`）

ができるようになります。
実装クラスを書かなくても、Spring Data JPA が**実行時に自動で実装**してくれるのです。

---

## `JpaRepository` がくれるメソッド

`JpaRepository<エンティティ, 主キーの型>` を継承すると、**標準で 20 個以上のメソッド**が使えます。
代表的なものを表で整理します。

| メソッド | 何をする |
|---|---|
| `save(エンティティ)` | 新規保存 or 更新 |
| `saveAll(リスト)` | 複数まとめて保存 |
| `findById(id)` | ID で 1 件取得（`Optional<T>`） |
| `existsById(id)` | 存在チェック |
| `findAll()` | 全件取得 |
| `findAll(Pageable)` | ページング付きの全件取得 |
| `findAllById(リスト)` | ID リストで一括取得 |
| `count()` | 件数 |
| `deleteById(id)` | ID で 1 件削除 |
| `delete(エンティティ)` | エンティティを指定して削除 |
| `deleteAll()` | 全件削除 |
| `deleteAllInBatch()` | 一括で DELETE 文を投げる（性能寄り） |

これだけあれば、ふつうの CRUD は**1 つもメソッドを書かずに**まかなえます。

---

## 派生クエリ（Derived Query）― メソッド名で SQL を作る

`JpaRepository` の標準メソッドにない検索が必要なときは、**メソッド名を「読めば分かる英語」で書く**だけで、Spring Data JPA が SQL を組み立ててくれます。

```java
public interface BookRepository extends JpaRepository<Book, Long> {

    List<Book> findByAuthor(String author);
    List<Book> findByPublishedYear(int year);
    List<Book> findByPublishedYearGreaterThanEqual(int year);
    List<Book> findByAuthorAndPublishedYear(String author, int year);
    List<Book> findByTitleContaining(String keyword);
    List<Book> findByAuthorOrderByPublishedYearDesc(String author);
    long countByAuthor(String author);
    boolean existsByTitle(String title);
}
```

メソッド名と SQL の対応は、こうなります。

| メソッド名 | 生成される SQL（イメージ） |
|---|---|
| `findByAuthor` | `... WHERE author = ?` |
| `findByPublishedYear` | `... WHERE published_year = ?` |
| `findByPublishedYearGreaterThanEqual` | `... WHERE published_year >= ?` |
| `findByAuthorAndPublishedYear` | `... WHERE author = ? AND published_year = ?` |
| `findByTitleContaining` | `... WHERE title LIKE %?%` |
| `findByAuthorOrderByPublishedYearDesc` | `... WHERE author = ? ORDER BY published_year DESC` |
| `countByAuthor` | `SELECT COUNT(*) ... WHERE author = ?` |
| `existsByTitle` | `SELECT EXISTS ... WHERE title = ?` |

派生クエリのキーワードは、たくさんあります。
代表的なものを紹介しておきます。

| キーワード | 例 | 意味 |
|---|---|---|
| `Is` / `Equals` | `findByAuthorIs(...)` | `=` |
| `Not` | `findByAuthorNot(...)` | `<>` |
| `Like` / `Containing` / `StartingWith` | `findByTitleContaining(...)` | `LIKE` |
| `LessThan` / `GreaterThan` | `findByYearGreaterThan(...)` | `<` / `>` |
| `Between` | `findByYearBetween(a, b)` | `BETWEEN` |
| `In` | `findByAuthorIn(list)` | `IN (...)` |
| `IsNull` / `IsNotNull` | `findByAuthorIsNull()` | `IS NULL` |
| `OrderBy...Asc` / `OrderBy...Desc` | `findByAuthorOrderByYearDesc(...)` | `ORDER BY` |

公式リファレンス（[Spring Data JPA Reference](https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html)）に、より詳しい一覧があります。

---

## CRUD のサンプルコード

第2節で書いたコードに、もう少し操作を追加してみます。

```java
@Override
public void run(String... args) {
    // CREATE
    Book java25 = new Book(null, "Java25入門", "鈴木", 2026);
    Book saved = bookRepository.save(java25);
    System.out.println("保存: " + saved);

    // READ
    Optional<Book> found = bookRepository.findById(saved.getId());
    found.ifPresent(b -> System.out.println("取得: " + b));

    // UPDATE  ― save() は ID があれば更新になる
    // （実際には setter が必要だが、紙面では省略のため省略）

    // DELETE
    bookRepository.deleteById(saved.getId());
    System.out.println("削除後の件数: " + bookRepository.count());
}
```

実機での出力例：

```text line-numbers=false
保存: Book[id=4, title=Java25入門, author=鈴木, year=2026]
取得: Book[id=4, title=Java25入門, author=鈴木, year=2026]
削除後の件数: 3
```

`save` が「ID が `null` なら INSERT、ID があれば UPDATE」と賢く振り分ける点に注目してください。

---

## `Optional<T>` で「見つからない可能性」を表す

```java
Optional<Book> book = bookRepository.findById(99L);
```

`findById` の戻り値は **`Optional<Book>`** です（第24章）。
これは、

- 該当する ID の本があれば、`Optional.of(book)`
- 見つからなければ、`Optional.empty()`

を返します。
**`null` を返さない**ことで、利用側が `null` チェックを忘れる事故を防いでくれます。

```java
Book book = bookRepository.findById(99L)
    .orElseThrow(() -> new BookNotFoundException(99L));
```

第24章の `orElseThrow` も、ここで活きます。

---

## ページング（Pageable）

「100 件ずつ表示する」のような場面で使うのが、**ページング**です。
`Pageable` を引数に取るメソッドが、`JpaRepository` 標準で用意されています。

```java
import org.springframework.data.domain.*;

Pageable pageable = PageRequest.of(0, 10, Sort.by("publishedYear").descending());
Page<Book> page = bookRepository.findAll(pageable);

System.out.println("総件数: " + page.getTotalElements());
System.out.println("総ページ数: " + page.getTotalPages());
page.getContent().forEach(System.out::println);
```

- **`PageRequest.of(ページ番号, サイズ, ソート)`** で、ページの指定を作る
- 戻り値の **`Page<T>`** に、結果と総件数が入る
- LIMIT / OFFSET 付きの SQL が、自動で組み立てられる

派生クエリにも、`Pageable` を追加できます。

```java
Page<Book> findByAuthor(String author, Pageable pageable);
```

ページネーションつき API を作るときの基本テクニックです。

---

## 派生クエリで書けないときは `@Query`

複雑なクエリは、メソッド名だけでは書ききれません。
そういうときは、**`@Query`** で直接書きます。

```java
import org.springframework.data.jpa.repository.Query;

public interface BookRepository extends JpaRepository<Book, Long> {

    @Query("SELECT b FROM Book b WHERE b.author = :author AND b.publishedYear >= :year")
    List<Book> searchByAuthorSince(String author, int year);
}
```

これは **JPQL**（Java Persistence Query Language、JPA 専用の SQL ライク言語）です。
SQL に似ていますが、**テーブル名ではなくクラス名**（`Book`）、**カラム名ではなくフィールド名**（`publishedYear`）を使う点に注意してください。

「素の SQL を書きたい」ときは、`nativeQuery = true` を付けます。

```java
@Query(value = "SELECT * FROM books WHERE author = :author", nativeQuery = true)
List<Book> findByAuthorNative(String author);
```

ただし、`nativeQuery` は **DB 製品に依存**するので、移植性が下がる点に注意です。

---

## なぜ「実装クラスを書かなくていい」のか

`BookRepository` は **interface** です。
中身（実装クラス）は、いったいどこから来るのでしょうか?

種明かしは、**Spring Data JPA が起動時にプロキシ実装を動的に生成している**から、というものです。

1. Spring Boot が起動する
2. Spring Data JPA が、`JpaRepository` を継承した interface を全部見つける
3. 各 interface に対して、**実装クラスを動的に生成**（リフレクション + プロキシ）
4. その実装クラスのインスタンスを、Bean としてコンテナに登録
5. `@Service` などで `BookRepository` を注入されると、その動的実装が渡る

私たちは、**interface を書くだけ**。
実装は、フレームワークが**自分で書いてくれる**。これが Spring Data JPA の魔法の正体です。

---

## まとめ

- **`JpaRepository<エンティティ, 主キーの型>`** を継承するだけで、20 種類以上の標準メソッドが使える
- **派生クエリ**は、メソッド名から SQL を自動生成（`findByAuthor`、`countByAuthor` など）
- 検索キーワードには、`Containing`・`Between`・`In`・`OrderBy` などが豊富
- `findById` は **`Optional<T>`** を返す
- ページングは **`Pageable` + `Page<T>`** で表現
- 複雑なクエリは **`@Query`** で **JPQL** か **ネイティブ SQL** を書く
- 実装クラスは、Spring Data JPA が**動的に生成**してくれる

次の節は、テーブル間の**関連**（`@OneToMany` / `@ManyToOne`）を扱います。

---
title: 関連を扱う
llm: true
---

## 関連を扱う

実務のデータベースでは、テーブルが**複数**あって、互いに**関連**しています。

- 1 人の**ユーザー**が、複数の**注文**を持つ
- 1 つの**注文**には、複数の**注文明細**がぶら下がる
- 1 つの**著者**が、複数の**本**を書いている

このようなテーブル間の関連を、JPA では**アノテーションで表現**します。
代表的なのが、

- **`@OneToMany`** … 1 対多
- **`@ManyToOne`** … 多 対 1
- **`@OneToOne`** … 1 対 1
- **`@ManyToMany`** … 多 対 多

の 4 つです。
入門段階では、まず **`@OneToMany`** と **`@ManyToOne`** を押さえれば十分です。

---

## 題材 ― 著者と本

第3節までの `Book` クラスを、こんな関係に変えてみます。

```text
authors                           books
─────────                        ─────────
id  | name                       id  | title | author_id (FK)
1   | 鈴木                        1   | Java入門 | 1
2   | 佐藤                        2   | モダンJava | 2
                                 3   | Spring実践 | 1
```

- `authors` テーブル（著者）
- `books` テーブル（本）
- 1 人の `Author` が、複数の `Book` を持つ
- 1 つの `Book` は、ちょうど 1 人の `Author` に属する

これを、エンティティで表現していきます。

---

## 多 対 1 の側 ― `@ManyToOne`（Book → Author）

```java
@Entity
@Table(name = "books")
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @ManyToOne
    @JoinColumn(name = "author_id")
    private Author author;          // 「自分の著者」への参照

    protected Book() {}

    public Book(String title, Author author) {
        this.title = title;
        this.author = author;
    }

    // getters / setters は省略
}
```

ポイントは、

- **`@ManyToOne`** … 「**多**の側（本）が、**1** の側（著者）に属する」を表す
- **`@JoinColumn(name = "author_id")`** … テーブル `books` の `author_id` カラムで、`authors.id` を参照することを示す

Hibernate は、これを見て **`author_id BIGINT REFERENCES authors(id)`** という外部キー制約を、テーブル定義に**自動で追加**します。

---

## 1 対 多 の側 ― `@OneToMany`（Author → Book）

```java
@Entity
@Table(name = "authors")
public class Author {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @OneToMany(mappedBy = "author", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Book> books = new ArrayList<>();   // 「自分の本」たち

    protected Author() {}

    public Author(String name) {
        this.name = name;
    }

    public void addBook(Book book) {
        books.add(book);
        // 双方向の整合を取る
        // book.setAuthor(this);   ← setter があれば
    }

    // getters は省略
}
```

ポイントを順番に見ていきます。

### `@OneToMany(mappedBy = "author")`

`mappedBy = "author"` は、

> 「**この関連の管理は、`Book.author` フィールド側に任せる**」

という意味です。
書き忘れると、Hibernate は「中間テーブルがあるはず」と誤解して、**変な構造のテーブル**を作ろうとします。
**`mappedBy` を必ず指定する**のが、`@OneToMany` の鉄則です。

### `cascade = CascadeType.ALL`

「**親（Author）への操作を、子（Book）にも伝える**」設定です。

- `Author` を保存すると、ぶら下がる `Book` も保存される
- `Author` を削除すると、`Book` も削除される

入門段階では便利ですが、業務では「**何を一括で扱うか**」を慎重に考えるべきです。
むやみに `CascadeType.ALL` を付けると、思わぬ削除事故が起きることがあります。

### `orphanRemoval = true`

「**親の `books` リストから外された `Book` は、DB からも削除**」する設定です。

```java
author.getBooks().remove(book);   // ← この瞬間に、book が DB からも消える
```

便利ですが、`cascade` と同様に**強力で危険**な機能です。
ライフサイクルを意識して使いましょう。

### `List<Book> books = new ArrayList<>()`

リストは、必ず**初期化**しておきます。
`null` のままだと、`addBook` で NullPointerException になります。

---

## 保存してみる

```java
@Override
@Transactional
public void run(String... args) {
    Author suzuki = new Author("鈴木");
    Author sato   = new Author("佐藤");

    suzuki.getBooks().add(new Book("Java入門", suzuki));
    suzuki.getBooks().add(new Book("Spring実践", suzuki));
    sato.getBooks().add(new Book("モダンJava", sato));

    authorRepository.save(suzuki);   // cascade ALL なので、Book も保存される
    authorRepository.save(sato);

    System.out.println("=== 全著者 ===");
    authorRepository.findAll().forEach(a ->
        System.out.println(a.getName() + ": " + a.getBooks().size() + "冊"));
}
```

`authorRepository.save(suzuki)` を呼ぶだけで、

- `authors` に「鈴木」のレコードが INSERT
- `books` に「Java入門」「Spring実践」のレコードが INSERT（外部キー付き）

が、まとめて走ります。
**`bookRepository.save` を別に呼ぶ必要がない**のが、`cascade` の恩恵です。

---

## 取得時の動き ― Lazy ロード

`authorRepository.findAll()` は、デフォルトで「**著者だけ**」を取得します。
`books` は、**最初は取りに行かない**のです。

```java
List<Author> authors = authorRepository.findAll();   // SQL: SELECT * FROM authors

for (Author author : authors) {
    int count = author.getBooks().size();   // ← ここで初めて books を取りに行く
}
```

このような「**必要になったときに DB を見にいく**」動きを、**Lazy ロード**（lazy loading、遅延ロード）と呼びます。
`@OneToMany` のデフォルトは**Lazy**、`@ManyToOne` のデフォルトは**EAGER**（即時ロード）です。

Lazy ロードは、

- 使わないかもしれないデータを**取りに行かない**ので、性能によい
- しかし、ループの中で呼ぶと**N+1 問題**（次節）になる

という、両面があります。
詳しくは第7節で扱います。

---

## `@OneToOne` ― 1 対 1

`User` と `UserProfile` のような、1 対 1 の関連は **`@OneToOne`** で表します。

```java
@Entity
public class User {
    @Id @GeneratedValue
    private Long id;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private UserProfile profile;
}

@Entity
public class UserProfile {
    @Id @GeneratedValue
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;
}
```

考え方は `@OneToMany` / `@ManyToOne` と同じで、「**多**」が「**1**」に変わっただけです。
1 対 1 は、テーブルを分けたい強い理由があるとき（カラム数が多い、別の DB に置きたい等）以外、あまり使いません。

---

## `@ManyToMany` ― 多 対 多

「**本**と**タグ**」「**学生**と**履修科目**」のように、両方向に**多**がある関係です。

```java
@Entity
public class Book {
    @ManyToMany
    @JoinTable(
        name = "book_tags",
        joinColumns = @JoinColumn(name = "book_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tag> tags = new HashSet<>();
}
```

中間テーブル `book_tags` が、自動で作られます。
ですが、`@ManyToMany` には注意点があります。

- 中間テーブルに**追加の情報**（紐づけた日時など）を持ちたくなることが多い
- そうなると、`@ManyToMany` ではなく、**中間テーブル用のエンティティ**を作る必要がある

実務では、最初から **`@ManyToMany` を使わず、中間エンティティを作る**ことが多いです。
入門段階では、「`@ManyToMany` というものがある」と覚えるだけで十分です。

---

## 双方向と単方向 ― どちらを選ぶか

エンティティ間の関連は、

- **双方向** … 両方のエンティティに、互いへの参照を持つ（例: `Author.books` と `Book.author`）
- **単方向** … 片方だけが参照を持つ

の 2 つがあります。

| | 双方向 | 単方向 |
|---|---|---|
| 書く量 | 多い | 少ない |
| 整合の手間 | 両方を同期させる必要がある | なし |
| 検索の便利さ | 親から子を辿れる | 辿れない |

「**親から子を辿る必要がない**」なら、単方向で十分です。
**`@OneToMany` 側を省略**すると、シンプルになります。

実務では、必要になってから双方向を追加する、というのが安全な進め方です。

---

## まとめ

- 関連は、**`@OneToMany`・`@ManyToOne`・`@OneToOne`・`@ManyToMany`** で表現
- **多** の側に `@JoinColumn` で外部キーを書く
- **1** の側に `@OneToMany(mappedBy = "...")` で関連を任せる
- **`cascade`・`orphanRemoval`** で、親子のライフサイクルを連動させられる
- 取得は、`@OneToMany` がデフォルト**Lazy**、`@ManyToOne` がデフォルト **EAGER**
- 双方向は便利だが、**両側を同期**する手間がある。単方向で済むならそれが楽

次の節は、これまで何度か顔を出した**トランザクション**を整理します。

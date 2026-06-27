---
title: ORM とは
llm: true
co-author: ["Claude Opus 4.7"]
---

## ORM とは

**ORM**（Object-Relational Mapping、オブジェクト関係マッピング）は、

> 「**Java のオブジェクト**と、**データベースのテーブル**を、**自動で対応づける**しくみ」

です。

---

## 「対応づける」とは

たとえば、こんな Java クラスがあるとします。

```java
public class Book {
    private Long id;
    private String title;
    private String author;
}
```

これを、データベースの**こんなテーブル**と対応づけます。

| id | title | author |
|---|---|---|
| 1 | Java入門 | 鈴木 |
| 2 | モダンJava | 佐藤 |

対応関係は、次のとおりです。

| Java | データベース |
|---|---|
| クラス `Book` | テーブル `books` |
| インスタンス（`new Book(...)`） | 1 行のレコード |
| フィールド（`id`、`title`） | カラム |
| `List<Book>` | 複数行の結果セット |

「**この対応**を、自動でやってくれる**仕組み**」が ORM です。

---

## ORM がない世界 ― 生 JDBC で書く

ORM の便利さを実感するために、いったん「ORM なし」の世界を見てみましょう。
Java 標準のデータベース接続 API は、**JDBC**（Java Database Connectivity、ジェイディービーシー）と呼ばれます。

```java
String url = "jdbc:postgresql://localhost:5432/library";
try (Connection conn = DriverManager.getConnection(url, "user", "pass");
     PreparedStatement stmt = conn.prepareStatement(
         "SELECT id, title, author FROM books WHERE author = ?")) {

    stmt.setString(1, "佐藤");

    try (ResultSet rs = stmt.executeQuery()) {
        List<Book> result = new ArrayList<>();
        while (rs.next()) {
            Book book = new Book();
            book.setId(rs.getLong("id"));
            book.setTitle(rs.getString("title"));
            book.setAuthor(rs.getString("author"));
            result.add(book);
        }
        return result;
    }
} catch (SQLException e) {
    throw new RuntimeException(e);
}
```

ぱっと見て分かるとおり、

- 接続を開いて閉じる
- `?` で SQL のパラメータを書く
- `ResultSet` を 1 行ずつ回す
- カラム名を文字列で指定する（typo してもコンパイルが通る）
- 例外処理を書く

と、**1 つの SELECT** のためにこれだけのコードが必要です。
これを、テーブルごと・操作ごとに書いていくのは、現実的ではありません。

---

## ORM がある世界 ― Spring Data JPA

同じ「`author = '佐藤'` の本を取ってくる」処理を、Spring Data JPA で書くと、こうなります。

```java
public interface BookRepository extends JpaRepository<Book, Long> {
    List<Book> findByAuthor(String author);
}
```

これだけです。実装クラスは要りません。**メソッドの名前**から、SQL が自動生成されます。

利用側は、

```java
List<Book> books = bookRepository.findByAuthor("佐藤");
```

ORM が、

1. 「`findByAuthor` というメソッド名 → `WHERE author = ?` という条件」と解釈
2. `SELECT * FROM books WHERE author = ?` を組み立て
3. `?` に `"佐藤"` をバインド
4. 結果を `Book` のリストに**自動マッピング**

までを、すべて勝手にやってくれます。
**SQL も `ResultSet` も `try-with-resources` も書きません**。

---

## ORM のメリット・デメリット

ORM の良いところと、注意したいところを整理します。

### メリット

| メリット | 何がいいか |
|---|---|
| **SQL を書かなくてよい** | 単純な CRUD は完全自動化 |
| **型安全** | カラム名の typo にコンパイラが気づく |
| **オブジェクト指向** | Java のクラスでデータを設計できる |
| **DB の違いを吸収** | PostgreSQL でも MySQL でも、同じコードが動く |
| **トランザクション管理が楽** | `@Transactional` 1 行で完結（第6節） |

### デメリット

| デメリット | 何が起きるか |
|---|---|
| **「魔法」感が強い** | 何が裏で起きているか見えにくい |
| **複雑なクエリは書きにくい** | JOIN 多用・集計などはネイティブ SQL が必要 |
| **パフォーマンスに注意** | N+1 問題などの罠（第7節） |
| **学習コスト** | 概念がたくさん（永続コンテキスト、Lazy ロードなど） |

ORM は、銀の弾丸ではありません。
**「単純な CRUD はとても楽。複雑になると注意が必要」**と覚えておきましょう。
入門段階では、まずメリットの恩恵にあずかってから、徐々にデメリットも知っていけばよいです。

---

## JPA・Hibernate・Spring Data JPA の関係

ここで、用語を整理しておきます。

### JPA（Jakarta Persistence API）

- **Java 標準の ORM 仕様**[^jpa-spec]
- インターフェースやアノテーションが定義されている
- 「JPA」は API の名前で、自分では SQL を実行できない

### Hibernate

- **JPA の代表的な実装**[^hibernate]
- 実際に SQL を組み立てて DB に投げる
- 業界で広く使われている

### Spring Data JPA

- JPA を使うときの、**Spring 流のお膳立て**を提供[^spring-data-jpa]
- リポジトリのメソッド名から SQL を自動生成
- ふつうの Spring Boot プロジェクトで使うのは、これ

```text
あなたのコード
       ↓
Spring Data JPA   ← 「リポジトリ」の自動実装
       ↓
JPA               ← 仕様（interface とアノテーション）
       ↓
Hibernate         ← 実装（実際の SQL 組み立て）
       ↓
JDBC              ← Java 標準の DB 接続 API
       ↓
データベース
```

3 層の上に立っているのが、私たちのコードです。
**「Spring Data JPA を使う」**＝ この全体を一括で使うこと、と覚えましょう。

---

## エンティティとリポジトリ ― 2 つの主役

JPA でデータを扱うとき、登場人物は基本的に**2 つ**です。

### エンティティ（Entity）

```java
@Entity
@Table(name = "books")
public class Book {
    @Id @GeneratedValue
    private Long id;
    @Column(nullable = false)
    private String title;
    ...
}
```

**テーブルと対応する Java クラス**です。
`@Entity` を付けて、Hibernate に「これはテーブルにマッピングするクラスだよ」と教えます。

### リポジトリ（Repository）

```java
public interface BookRepository extends JpaRepository<Book, Long> {
    List<Book> findByAuthor(String author);
}
```

**そのエンティティを操作するためのインターフェース**です。
`JpaRepository` を継承するだけで、CRUD のメソッドが全部使えるようになります。

この 2 つの組み合わせが、JPA の基本パターンです。
第3〜4節で、それぞれを詳しく見ていきます。

---

## まとめ

- **ORM** は、Java のオブジェクトと DB のテーブルを**自動でマッピング**するしくみ
- 生 JDBC で書くと長く面倒なコードが、ORM なら**1 メソッド**で済む
- Java の世界では **JPA**（仕様）+ **Hibernate**（実装）+ **Spring Data JPA**（Spring 流）が主流
- 主役は **エンティティ**（`@Entity`）と **リポジトリ**（`JpaRepository`）の 2 つ
- 単純な CRUD は楽、複雑なクエリは別途検討、というのが ORM の特性

次の節では、Spring Boot で JPA を使うための**プロジェクトのセットアップ**を学びます。

[^jpa-spec]: Jakarta EE, "Jakarta Persistence Specification," <https://jakarta.ee/specifications/persistence/>。元は JSR 220（Java EE 5, 2006年）として導入された Java Persistence API（JPA）が、Eclipse Foundation 移管後に Jakarta Persistence と改称された。現行の最新版は Jakarta Persistence 3.2。

[^hibernate]: Red Hat, "Hibernate ORM," <https://hibernate.org/orm/>。Gavin King らが2001年に開発を始めた Java の代表的 ORM 実装で、JPA の参照実装（reference implementation）級の地位にある。Spring Boot のデフォルト JPA プロバイダ。

[^spring-data-jpa]: Spring Data JPA Reference, <https://docs.spring.io/spring-data/jpa/reference/>。Spring チームが提供する JPA 用 Repository 抽象。メソッド名から JPQL クエリを自動生成する Derived Query 機能や、`@Query` アノテーションによる手動クエリ指定に対応する。

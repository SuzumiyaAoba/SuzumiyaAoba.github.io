---
title: Spring Data JPA のセットアップ
llm: true
co-author: ["Claude Opus 4.7"]
---

## Spring Data JPA のセットアップ

実際に、Spring Boot プロジェクトに JPA を組み込んで、データベースを動かせる状態にしましょう。
本章は、**Spring Boot 3.5 + Spring Data JPA + H2 + Java 25** で実機検証しています。

---

## プロジェクト構成

今回作るのは、**書籍管理**のサンプルです。

```text line-numbers=false
library/
├── pom.xml
└── src/
    └── main/
        ├── java/com/example/library/
        │   ├── LibraryApplication.java
        │   ├── Book.java                  ← エンティティ
        │   └── BookRepository.java        ← リポジトリ
        └── resources/
            └── application.yml            ← DB 設定
```

第36章とほぼ同じ構成ですが、`resources/application.yml` で**データベース接続情報**を渡すのが新しい部分です。

---

## ステップ1 ― `pom.xml` に依存を追加

第36章の `pom.xml` をベースに、JPA と H2 を追加します。

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>com.h2database</groupId>
        <artifactId>h2</artifactId>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

### `spring-boot-starter-data-jpa`

これだけで、**Spring Data JPA・Hibernate・JDBC・コネクションプール（HikariCP）**などが、まとめて入ります。
Starter のうれしさが、ここでも活きています。

### `h2`

H2 データベースの実装です。
`<scope>runtime</scope>` にしているのは、

- コンパイル時には**H2 への直接依存はない**（JDBC を介すだけ）
- 実行時にだけ、ドライバとして必要

という理由です。
本番では、ここを `org.postgresql:postgresql` などに置き換えます。

---

## ステップ2 ― `application.yml` で接続情報を書く

`src/main/resources/application.yml` を作って、データベースの設定を書きます。

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:librarydb
    driver-class-name: org.h2.Driver
    username: sa
    password:
  jpa:
    hibernate:
      ddl-auto: create-drop
    properties:
      hibernate:
        format_sql: true
    show-sql: true
logging:
  level:
    org.hibernate.SQL: debug
```

順番に意味を見ていきます。

### `spring.datasource.url` ― 接続先

```yaml
url: jdbc:h2:mem:librarydb
```

`jdbc:h2:mem:librarydb` は、**メモリ上に作る H2 データベース**を意味します。
`librarydb` がデータベース名です。
アプリを止めると消えるので、本番では使えませんが、学習・テストには十分です。

本物の PostgreSQL なら、

```yaml
url: jdbc:postgresql://localhost:5432/library
```

のように、ホスト・ポート・DB 名を書きます。

### `spring.jpa.hibernate.ddl-auto: create-drop`

これは「**Hibernate に、テーブルを自動で作らせる**」設定です。

| 値 | 意味 |
|---|---|
| `none` | 何もしない（本番ではこれ） |
| `validate` | エンティティと既存テーブルの定義が一致するか検証 |
| `update` | 不足カラム・テーブルを追加（既存データは保持） |
| `create` | 起動時に全テーブルを作り直す |
| `create-drop` | 起動時に作り直し、終了時に削除（学習・テスト用） |

入門段階では `create-drop` が便利です。
本番では絶対に使ってはいけません ―― **データが全消去**されます。
本番では `none` または `validate` を使い、テーブル定義は **Flyway** や **Liquibase** などのマイグレーションツールで管理するのが一般的です。

### `spring.jpa.show-sql` と SQL ログ

```yaml
show-sql: true
properties:
  hibernate:
    format_sql: true
```

これで、Hibernate が実行する SQL を**標準出力**に表示してくれます。
さらに `format_sql: true` で、改行・インデント付きの読みやすい SQL になります。

```yaml
logging:
  level:
    org.hibernate.SQL: debug
```

`Hibernate.SQL` ロガーを DEBUG に上げて、より詳しい SQL ログを出力します。
**学習中・デバッグ中は、必ず ON にしましょう**。何が起きているのか見えるようになります。

---

## ステップ3 ― 起動クラス

第36章の `ShopApplication` と同じ形です。

```java
package com.example.library;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class LibraryApplication implements CommandLineRunner {
    private final BookRepository bookRepository;

    public LibraryApplication(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    public static void main(String[] args) {
        SpringApplication.run(LibraryApplication.class, args);
    }

    @Override
    public void run(String... args) {
        bookRepository.save(new Book(null, "Java入門", "鈴木", 2026));
        bookRepository.save(new Book(null, "モダンJava", "佐藤", 2025));
        bookRepository.save(new Book(null, "Spring実践", "高橋", 2024));

        System.out.println("=== 全件 ===");
        bookRepository.findAll().forEach(System.out::println);

        System.out.println("=== 著者検索 ===");
        bookRepository.findByAuthor("佐藤").forEach(System.out::println);
    }
}
```

`BookRepository` は、コンストラクタ注入で受け取ります。
`run` メソッドで、3 冊保存して、全件取得・著者検索を試しています。

`Book` と `BookRepository` の中身は、次の節で扱います。
まずは、これで動かしてみましょう。

---

## ステップ4 ― 動かす

```text line-numbers=false
$ mvn spring-boot:run
```

実機での出力（抜粋）。

```text line-numbers=false
Hibernate:
    insert into books (author, published_year, title, id) values (?, ?, ?, default)
Hibernate:
    insert into books (author, published_year, title, id) values (?, ?, ?, default)
Hibernate:
    insert into books (author, published_year, title, id) values (?, ?, ?, default)
=== 全件 ===
Hibernate:
    select b1_0.id, b1_0.author, b1_0.published_year, b1_0.title from books b1_0
Book[id=1, title=Java入門, author=鈴木, year=2026]
Book[id=2, title=モダンJava, author=佐藤, year=2025]
Book[id=3, title=Spring実践, author=高橋, year=2024]
=== 著者検索 ===
Hibernate:
    select b1_0.id, b1_0.author, b1_0.published_year, b1_0.title from books b1_0 where b1_0.author=?
Book[id=2, title=モダンJava, author=佐藤, year=2025]
```

注目してください。
**3 つの `INSERT`**、**1 つの `SELECT *`**、**1 つの `SELECT ... WHERE author=?`** が、すべて自動で生成されています。
私たちは、**1 行も SQL を書いていません**。

---

## 動かしたあと ― いま起きていること

このセットアップで、起動時に Spring Boot が裏でやっていることは、こうです。

1. `pom.xml` の `spring-boot-starter-data-jpa` を見て、JPA / Hibernate を準備
2. `application.yml` の `datasource` を見て、H2 にメモリ DB を作成
3. `@Entity` 付きクラスを探して、`books` テーブルを**自動で作成**
4. `JpaRepository` を継承した interface を**自動で実装**して Bean 登録
5. `LibraryApplication` のコンストラクタに、その Bean を注入
6. `run` メソッドが呼ばれ、データ操作が実行される

「**コードを書く量と、実際に動く量の落差**」が、JPA + Spring の最大の魅力です。

---

## まとめ

- `spring-boot-starter-data-jpa` 1 つで、JPA・Hibernate・JDBC・接続プールがそろう
- 学習用には **H2 のインメモリ DB** が便利。`<scope>runtime</scope>` で依存に追加
- `application.yml` で接続先・`ddl-auto`・SQL ログを設定
- 学習中は **`create-drop` + SQL ログ ON** で、何が起きているか見える化する
- **テーブル作成・リポジトリ実装も**、起動時に Spring と Hibernate が**自動でやる**

次の節では、テーブルとマッピングされる**エンティティ**を、もっと詳しく見ていきます。

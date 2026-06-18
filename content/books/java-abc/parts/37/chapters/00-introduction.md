---
title: はじめに ― この章で学ぶこと
llm: true
---

## はじめに ― この章で学ぶこと

前の章で、Spring Boot を使った DI コンテナの基本を学びました。
ここまでは、データは**プログラムの中だけ**で完結していました。

ですが、実務のアプリケーションでは、

- ユーザー情報・注文情報・在庫情報を**永続化**する
- 何百万件もの**データの中から検索**する
- **複数の利用者**が、同時にデータを読み書きする

といったことを、ふつうにやります。
そのために必要なのが、**データベース**（database）と、それを Java から扱うための**データアクセス**の技術です。

---

## なぜ「ORM」が必要か

Java の世界は、**オブジェクト**でできています。
一方、リレーショナルデータベース（RDB: PostgreSQL、MySQL など）の世界は、**テーブルと行**でできています。

```text
Java の世界 (Object)             RDB の世界 (Relation)
────────────────                ────────────────
class Book { ... }   ←─────→   テーブル books
new Book(...)        ←─────→   1 行のレコード
List<Book>           ←─────→   結果セット
```

この **「オブジェクト」と「テーブル」の世界の橋渡し**をするのが、**ORM**（Object-Relational Mapping、オブジェクト関係マッピング）です。

ORM を使うと、

- **SQL を手で書かなくても**、オブジェクトの保存・取得ができる
- **オブジェクトの編集**が、勝手に SQL に変換されて DB に反映される
- **コンパイル時の型チェック**が、データ操作にも効く

といったメリットがあります。

---

## Java での ORM ― JPA と Spring Data JPA

Java 標準の ORM 仕様が、**JPA**（Jakarta Persistence API、ジェーピーエー）です。
JPA の実装としていちばん使われているのが、**Hibernate**（ハイバネート）です。
そして、これを Spring からとても簡単に使えるようにしたのが、**Spring Data JPA** です。

```text
あなたのコード
       ↓
Spring Data JPA   ←  リポジトリの自動生成、メソッド名から SQL を作る
       ↓
JPA (Jakarta Persistence API)
       ↓
Hibernate          ←  実際の SQL を組み立てて DB に投げる
       ↓
JDBC               ←  Java 標準のデータベース接続 API
       ↓
データベース (PostgreSQL / MySQL / H2 ...)
```

たくさんの層がありますが、私たちが書くのは**いちばん上の層**だけです。
あとは、Spring と Hibernate がやってくれます。

---

## 本章の前提

本書のサンプルは、**Spring Boot 3.5・Spring Data JPA・H2 データベース・Java 25** で実機検証しています。

**H2** は、Java で書かれた**インメモリ・データベース**です。
ファイルやサーバーを別途立てなくても、`pom.xml` に書くだけで使えます。
本物の PostgreSQL や MySQL のかわりに、**学習・テスト用**として使われます。

`pom.xml` には、次の依存を追加します。

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>runtime</scope>
</dependency>
```

---

## この章で学ぶこと

第37章は、次の8つの節で構成されています。

| 節 | タイトル | 内容 |
|---|---|---|
| 1 | ORM とは | オブジェクトとテーブルの橋渡し |
| 2 | Spring Data JPA のセットアップ | プロジェクトと設定 |
| 3 | エンティティ | `@Entity` でテーブルにマッピング |
| 4 | リポジトリ | `JpaRepository` と派生クエリ |
| 5 | 関連を扱う | `@OneToMany` / `@ManyToOne` |
| 6 | トランザクション | `@Transactional` の基本 |
| 7 | よくあるつまずき | N+1 問題、`equals` / `hashCode`、Lazy ロード |

前半（1〜4節）で、テーブル1つを扱う基本を身につけます。
中盤（5〜6節）で、複数テーブルとトランザクションへ広げます。
最後（7節）に、実務でハマる落とし穴を集めます。

---

## この章を読み終えると

第37章を読み終えるころには、次のことができるようになっています。

- ORM の意義と、JPA・Hibernate・Spring Data JPA の関係を説明できる
- `@Entity` でクラスをテーブルにマッピングできる
- `JpaRepository` を使って、CRUD（作成・読取・更新・削除）を書ける
- メソッド名から自動でクエリが生成される**派生クエリ**を書ける
- テーブル間の関連を、`@OneToMany` / `@ManyToOne` で表現できる
- `@Transactional` で、トランザクションを意識して書ける
- **N+1 問題**などの典型的なつまずきを、回避できる

---

> **補足: なぜ JPA なのか?**
>
> Java の世界では、ORM 以外にも、SQL を直接書く **MyBatis** や、Kotlin/Java で型安全に SQL を書く **jOOQ** などの選択肢があります。
> 本書では、業務で多く採用されている **Spring Data JPA** を取り上げます。
> SQL を意識せずに書ける手軽さと、自動生成の力強さが、入門書のテーマと合うためです。
> ただし、複雑なクエリは JPA だけだと書きにくいことがあり、現場では JPA と MyBatis を併用するケースもあります。

それでは、最初の節「ORM とは」から始めましょう。

---
title: 用語集 ― この章で学んだ言葉
llm: true
co-author: ["Claude Opus 4.7"]
---

## 用語集 ― この章で学んだ言葉

第37章では、ORM とデータベースアクセスを学びました。
節ごとに、言葉を整理しておきます。

---

## ORM の基礎（第1節）

| 用語 | 英語・読み | 意味 |
|---|---|---|
| ORM | Object-Relational Mapping | オブジェクトとテーブルを橋渡しする仕組み |
| JPA | Jakarta Persistence API | Java 標準の ORM 仕様 |
| Hibernate | ― | JPA のもっとも普及した実装 |
| Spring Data JPA | ― | Spring 流に JPA を使うためのライブラリ |
| JDBC | Java Database Connectivity | Java 標準の DB 接続 API |
| RDB | Relational Database | リレーショナルデータベース |

---

## セットアップ（第2節）

| 用語 | 意味 |
|---|---|
| `spring-boot-starter-data-jpa` | JPA / Hibernate などの詰め合わせ |
| H2 | Java 製のインメモリ DB（学習・テスト用） |
| `application.yml` | Spring Boot の設定ファイル |
| `ddl-auto` | テーブル定義の自動管理。`create-drop` / `update` / `validate` / `none` |
| `show-sql` | 実行 SQL を標準出力に表示 |

---

## エンティティ（第3節）

| 用語 | 意味 |
|---|---|
| エンティティ | テーブルにマッピングされる Java クラス |
| `@Entity` | エンティティであることを宣言 |
| `@Table(name=...)` | マッピング先のテーブル名 |
| `@Id` | 主キーを示す |
| `@GeneratedValue` | 主キーの採番方法 |
| `IDENTITY` / `SEQUENCE` / `AUTO` | 採番方式 |
| `@Column` | カラム単位の設定（`name` / `nullable` / `length` / `unique`） |
| デフォルトコンストラクタ | JPA がリフレクションで使う引数なしコンストラクタ |
| DTO | Data Transfer Object。外部とやり取りする値オブジェクト |

---

## リポジトリ（第4節）

| 用語 | 意味 |
|---|---|
| `JpaRepository<T, ID>` | CRUD と派生クエリの基本 interface |
| 派生クエリ | メソッド名から SQL を自動生成 |
| `findByXxx` / `countByXxx` / `existsByXxx` | 標準的な派生メソッド |
| `Containing` / `Between` / `In` / `OrderBy` | 派生クエリのキーワード |
| `Pageable` / `Page<T>` | ページング |
| `@Query` | JPQL またはネイティブ SQL を直接書く |
| JPQL | JPA 専用のオブジェクト指向クエリ言語 |
| nativeQuery | 素の SQL を書くオプション |

---

## 関連（第5節）

| 用語 | 意味 |
|---|---|
| `@ManyToOne` | 多 対 1 の関連 |
| `@OneToMany` | 1 対 多 の関連 |
| `@OneToOne` | 1 対 1 の関連 |
| `@ManyToMany` | 多 対 多 の関連 |
| `@JoinColumn` | 外部キーカラムの設定 |
| `mappedBy` | 関連の管理を反対側に任せる宣言 |
| `cascade` | 親への操作を子に伝える |
| `CascadeType.ALL` | すべてのライフサイクル操作を伝える |
| `orphanRemoval` | リストから外された子を DB からも削除 |
| Lazy ロード | 必要時にだけ DB を見にいく |
| EAGER ロード | 即時にロードする |
| 双方向 / 単方向 | 両側に参照を持つ／片側のみ |

---

## トランザクション（第6節）

| 用語 | 意味 |
|---|---|
| トランザクション | 複数の DB 操作をまとめる単位 |
| ACID | Atomicity / Consistency / Isolation / Durability |
| `@Transactional` | Spring の宣言的トランザクション |
| `rollbackFor` | ロールバック対象の例外を明示 |
| `readOnly = true` | 読み取り専用最適化のヒント |
| 永続コンテキスト | トランザクション内のエンティティの保管庫 |
| Dirty Checking | 永続エンティティの変更を自動追跡 |
| 分離レベル | 同時実行の干渉度合い |
| `Propagation.REQUIRED` / `REQUIRES_NEW` | 既存トランザクションへの参加 / 新規開始 |

---

## つまずき（第7節）

| 用語 | 意味 |
|---|---|
| N+1 問題 | 親 1 件＋子 N 件で SELECT が N+1 回走る性能問題 |
| `JOIN FETCH` | JPQL で関連を一括取得する |
| `@EntityGraph` | 取得項目を宣言的に指定 |
| `LazyInitializationException` | トランザクション外で Lazy フィールドに触れた例外 |
| `@DataJpaTest` | JPA だけを軽量に起動するテスト用アノテーション |
| Flyway / Liquibase | DB マイグレーションツール |

---

## おわりに ― 「データを永続化する」力がそろいました

第37章で、JPA を使って Java アプリにデータを永続化する**最小限の力**がそろいました。
ここまでで、

- **テストの書き方**（第32〜33章）
- **設計原則**（第34〜35章）
- **DI コンテナ**（第36章）
- **データベース**（第37章）

を学び、業務システムを動かす土台が、ほぼ整いました。

次の第38章では、ここまでで作ったロジックを、**HTTP で外の世界に公開**する **REST API** を学びます。
**Spring Boot の `@RestController`** で、JSON でやり取りする API を、ふつうに作れるようになります。
それでは、次の章でお会いしましょう。

---
title: 用語集 ― この章で学んだ言葉
llm: true
co-author: ["Claude Opus 4.7"]
---

## 用語集 ― この章で学んだ言葉

第36章では、依存性の注入（DI）と Spring の基本を学びました。
節ごとに、言葉を整理しておきます。

---

## DI の基礎（第1節）

| 用語 | 英語・読み | 意味 |
|---|---|---|
| DI | Dependency Injection | 依存を外から受け取る設計手法 |
| コンストラクタ注入 | constructor injection | コンストラクタ引数で依存を受け取る（推奨） |
| セッター注入 | setter injection | セッターで依存を渡す（非推奨） |
| フィールド注入 | field injection | フィールドに `@Autowired` で注入（非推奨） |
| DI コンテナ | DI container | 依存を組み立てて注入する仕組み |
| IoC | Inversion of Control | 制御の反転。フレームワークが流れを管理する |

---

## Spring の基本（第2節）

| 用語 | 意味 |
|---|---|
| Spring | Java のフレームワーク群の中核 |
| Spring Framework | DI を中心とする中核ライブラリ |
| Spring Boot | 設定不要で使える Spring の上位フレームワーク |
| `ApplicationContext` | Spring の DI コンテナ |
| Bean | コンテナが管理するオブジェクト |
| `@Component` | 汎用的な Bean を登録 |
| `@Service` | ビジネスロジック層の Bean |
| `@Repository` | データアクセス層の Bean |
| `@Controller` / `@RestController` | Web 層の Bean（第38章） |
| ステレオタイプアノテーション | 上記4種のような Bean 登録用アノテーションの総称 |

---

## Spring Boot プロジェクト（第3節）

| 用語 | 意味 |
|---|---|
| `spring-boot-starter-parent` | おすすめ依存・設定のセット |
| `spring-boot-starter` | Spring Boot の基本機能の詰め合わせ |
| `spring-boot-starter-test` | テスト系の詰め合わせ（JUnit 5 + Mockito + AssertJ） |
| `@SpringBootApplication` | `@Configuration` + `@EnableAutoConfiguration` + `@ComponentScan` |
| `SpringApplication.run` | Spring Boot を起動する |
| `CommandLineRunner` | 起動完了後に呼ばれる処理を書く |
| `spring-boot-maven-plugin` | `mvn spring-boot:run` などを提供する Maven プラグイン |

---

## コンポーネントスキャン（第4節）

| 用語 | 意味 |
|---|---|
| コンポーネントスキャン | `@Component` 系の付いたクラスを自動で見つけて Bean 登録 |
| スキャン起点 | `@SpringBootApplication` クラスのパッケージ |
| `scanBasePackages` | スキャン対象を追加・変更する |
| `@Primary` | 同じ型の Bean が複数あるときに優先する Bean を決める |
| `@Qualifier` | 名前で Bean を選ぶ |

---

## コンストラクタ注入（第5節）

| 用語 | 意味 |
|---|---|
| 1コンストラクタ規則 | コンストラクタが1つなら `@Autowired` 省略可 |
| `@Autowired` | 注入対象を明示するアノテーション |
| `final` フィールド | 再代入禁止。コンストラクタ注入と相性がよい |
| Lombok の `@RequiredArgsConstructor` | `final` フィールドのコンストラクタを自動生成 |
| 依存グラフ | Bean 同士の依存関係。Spring が自動解決 |

---

## `@Configuration` と `@Bean`（第6節）

| 用語 | 意味 |
|---|---|
| `@Configuration` | 設定クラスを示すアノテーション |
| `@Bean` | メソッドの戻り値を Bean として登録する |
| `@Value("${...}")` | プロパティの値を注入する |
| `@ConfigurationProperties` | プロパティのまとまりをレコード/クラスにマッピング |
| `application.properties` / `application.yml` | Spring Boot の設定ファイル |

---

## つまずきと運用（第7節）

| 用語 | 意味 |
|---|---|
| 循環依存 | A → B → A の依存ループ。設計の見直しサイン |
| `@Lazy` | 遅延注入で循環を回避する最終手段 |
| Singleton スコープ | Bean は1つだけ作って使い回される（既定） |
| ステートレス | フィールドに状態を持たない設計 |
| `@SpringBootTest` | Spring 全体を起動する重いテスト。乱用注意 |

---

## おわりに ― これで「業務システムの土台」が見えてきました

第36章で、DI と Spring の基本がそろいました。
ここまでで、

- **テストの書き方**（第32〜33章）
- **設計原則**（第34〜35章）
- **DI コンテナ**（第36章）

を学び、業務システムを書くための**土台**が見えてきました。

次の第37章では、本書で初めて、**本物のデータベース**を扱います。
**ORM**（Object-Relational Mapping）と呼ばれる技術と、Spring Data JPA を使って、Java のオブジェクトと SQL を橋渡しする世界へ踏み込みます。
これで、第33章の「DB との会話」の話を、**実コードに落とせる**ようになります。

それでは、次の章でお会いしましょう。

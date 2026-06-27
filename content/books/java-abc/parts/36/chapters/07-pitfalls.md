---
title: よくあるつまずき
llm: true
co-author: ["Claude Opus 4.7"]
---

## よくあるつまずき

Spring と DI で、初心者がはまりやすいポイントを整理します。

---

## 1. `@Component` を付け忘れる

最頻出のエラーです。

```text
Parameter 0 of constructor in com.example.shop.OrderService required a bean
of type 'com.example.shop.UserRepository' that could not be found.
```

実装クラス（`InMemoryUserRepository`）に **`@Repository` を付け忘れた**だけで、このエラーが出ます。

### 対処

- 実装クラスに `@Component` / `@Service` / `@Repository` を付ける
- ファイル全体を確認 ―― **interface 側ではなく、実装クラス側**に付ける
- 「単数の Bean が必要だが見つからない」というメッセージは、これが大半

---

## 2. `@SpringBootApplication` が下位パッケージにある

スキャン起点を間違えると、**自分のクラスがスキャンされない**事故が起きます。

```text
com.example.shop
├── service/
│   └── OrderService.java         ← @Service が付いている
└── boot/
    └── ShopApplication.java       ← @SpringBootApplication ← 起点
```

`ShopApplication` が `boot` パッケージにあるので、スキャン対象は `com.example.shop.boot` 以下だけ。
`OrderService` は**見つかりません**。

### 対処

- **`@SpringBootApplication` は最上位パッケージに置く**
- `com.example.shop.boot` ではなく、`com.example.shop` の直下

---

## 3. 同じ型の Bean が複数ある（曖昧)

第4節でも見ました。

```text
required a single bean, but 2 were found:
        - consoleMailSender
        - smtpMailSender
```

### 対処

- **`@Primary`** で、デフォルトを 1 つ決める
- **`@Qualifier("名前")`** で、使う場所で名前を指定する
- 本当に複数使うなら **`List<MailSender>`** で受け取る

---

## 4. 循環依存（Circular Dependency）

`A` が `B` に、`B` が `A` に依存する状態です。

```java
@Service
public class A {
    public A(B b) {}
}

@Service
public class B {
    public B(A a) {}
}
```

これだと、Spring はどちらも先に作れません。
起動時に、こんなエラーが出ます。

```text
The dependencies of some of the beans in the application context form a cycle:
   a → b → a
```

### 対処

- **本当に循環が必要か**、設計を見直す（だいたい必要ない）
- **共通のロジックを 3 つ目のクラス**に切り出して、両者がそこに依存するようにする
- どうしても解消できないときは、**`@Lazy`** で遅延注入する（最終手段）

```java
public A(@Lazy B b) { ... }   // ← 起動時には作らない
```

ただし、`@Lazy` は**設計の悪臭の証**でもあります。リファクタリング検討が先です。

---

## 5. フィールド注入で `final` が使えない

```java
@Service
public class OrderService {
    @Autowired
    private UserRepository userRepository;   // ← final にできない
}
```

`final` にできないと、

- 再代入される可能性が残る
- スレッド安全が保証されない
- テストで `new` できない（リフレクションが必要）

### 対処

- **コンストラクタ注入に変える**（第5節）

```java
private final UserRepository userRepository;

public OrderService(UserRepository userRepository) {
    this.userRepository = userRepository;
}
```

これだけで、すべての問題が解決します。

---

## 6. テストで Spring のコンテキストを丸ごと立ち上げる

「DI のテストをしたい」と思って、何でも `@SpringBootTest` を付けてしまうケース。

```java
@SpringBootTest                  // ← Spring 全体を起動
class OrderServiceTest {
    @Autowired OrderService service;
    ...
}
```

`@SpringBootTest` は、

- 実行に**数秒〜数十秒**かかる
- 余計な Bean まで初期化される
- テストの独立性が失われがち

という欠点があります。
ロジックだけ確かめたいなら、第33章のような Mockito ベースのテストで十分です。

### 対処

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    @Mock UserRepository userRepository;
    @Mock MailSender mailSender;
    @InjectMocks OrderService service;
    ...
}
```

Spring を起動せずに、**コンストラクタ注入と Mockito** で完結させます。
速く、独立で、書きやすい ―― 三拍子そろいます。

`@SpringBootTest` は、Web 層の結合テスト（第38章）などで使います。

---

## 7. Bean のスコープを誤解する

Spring の Bean は、デフォルトで **Singleton スコープ**です。
つまり、**1 つだけ作って、ずっと使い回す**設定です。

このため、Bean に**状態（フィールド）**を持たせるのは危険です。

```java
@Service
public class CounterService {
    private int count = 0;     // △ 全リクエストで共有されてしまう
}
```

複数のリクエストが、同じ `count` を読み書きする ―― **競合状態**になります。

### 対処

- Bean は基本的に**状態を持たない**（ステートレス）
- 状態は、データベースや、リクエストスコープの Bean で管理する
- リクエストごとに変える状態は、**メソッドの引数**で渡す

---

## 8. `@Autowired` を Setter に付けて遊んでしまう

セッター注入は、可能だけれど、現代では推奨されません。

```java
@Service
public class OrderService {
    private UserRepository userRepository;

    @Autowired
    public void setUserRepository(UserRepository userRepository) {   // △ 古い書き方
        this.userRepository = userRepository;
    }
}
```

セッターから「あとから渡す」のは、

- 必須かどうかが分かりにくい
- 注入忘れに気づきにくい
- final にできない

ため、コンストラクタ注入を使いましょう。

---

## 9. アノテーションの import を間違える

`@Component` や `@Service` の import が、Spring 以外（昔の Java EE / Jakarta EE）から来ていると、

- Spring の DI に登録されない
- それなのに、コンパイルは通る

という、**気づきにくい不具合**になります。

### 対処

- `@Component` は `org.springframework.stereotype.Component`
- `@Service` は `org.springframework.stereotype.Service`
- `@Repository` は `org.springframework.stereotype.Repository`
- `@Controller` は `org.springframework.stereotype.Controller`

「**全部 `org.springframework`**」と覚えておくと、わかりやすいです。

---

## 10. application.properties / yml を間違える

Spring Boot の設定ファイルには 2 種類あります。

| 形式 | ファイル名 |
|---|---|
| プロパティ形式 | `application.properties` |
| YAML 形式 | `application.yml`（または `application.yaml`） |

両方が同時にあると、**プロパティ形式が優先**されます。
「設定したのに反映されない」ときは、**両方のファイルがないか**確認しましょう。

書き方の好みで選んでよいですが、**ネストする値が多いなら YAML**、シンプルなら properties、というのが目安です。

---

## まとめ

- 実装クラスに `@Component` 系の**付け忘れ**は、最頻出エラー
- `@SpringBootApplication` は**最上位パッケージ**に置く
- 同じ型の Bean が複数あれば、**`@Primary` / `@Qualifier`** で解決
- **循環依存**は、設計の見直しサイン
- **コンストラクタ注入**で `final`、テスト容易性を確保
- 軽いユニットテストは **`@SpringBootTest` を使わない**
- Bean は**ステートレス**が基本
- アノテーションは **`org.springframework`** からインポート

次は、この章で学んだ言葉を、用語集としてまとめます。

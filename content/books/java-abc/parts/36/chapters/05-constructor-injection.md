---
title: コンストラクタ注入
llm: true
---

## コンストラクタ注入

第1節で、DI の方法は 3 種類あると説明しました。

1. **コンストラクタ注入** ← 推奨
2. セッター注入
3. フィールド注入

ここでは、いちばん使う**コンストラクタ注入**の書き方と、注意点を整理します。

---

## 基本形

```java
@Service
public class OrderService {
    private final UserRepository userRepository;
    private final MailSender mailSender;

    public OrderService(UserRepository userRepository, MailSender mailSender) {
        this.userRepository = userRepository;
        this.mailSender = mailSender;
    }
}
```

`OrderService` がコンストラクタ引数で `UserRepository` と `MailSender` を要求していると、
Spring が、それらの型を持つ Bean を**自動で探して渡します**。

これだけで、注入は完了します。
`@Autowired` を付ける必要も、特別な設定もありません。

---

## `@Autowired` は省略してよい

古いコード（Spring 4 までのコード）では、こんなふうに書かれていました。

```java
@Service
public class OrderService {

    @Autowired                                  // ← 古い書き方では必須だった
    public OrderService(UserRepository userRepository, MailSender mailSender) {
        ...
    }
}
```

ですが、Spring 4.3 からは、

> **コンストラクタが 1 つしかなければ、`@Autowired` を省略してよい**

という挙動になりました。
そして、**コンストラクタが 1 つだけ**なのが、ふつうのケースです。
そのため、いまの Spring では `@Autowired` を**書かない**のが推奨です。

---

## `final` を使う ― 不変性の確保

コンストラクタ注入の真価は、**フィールドを `final` にできる**ことです。

```java
private final UserRepository userRepository;   // 不変
```

`final` には、次のメリットがあります。

| メリット | 説明 |
|---|---|
| 再代入できない | コンストラクタ以外で書き換える事故が防げる |
| スレッド安全（不変オブジェクトなら） | 並行アクセスでも安全 |
| コンストラクタで必ず初期化 | 「あとで設定する」忘れがない |

セッター注入やフィールド注入では、`final` を使えないため、これらのメリットが失われます。

---

## 「複数のコンストラクタ」がある場合

コンストラクタが**2 つ以上**あるときは、**どれで注入するか**を Spring が決められなくなります。
このときは、明示的に `@Autowired` を 1 つに付けます。

```java
@Service
public class OrderService {
    private final UserRepository userRepository;
    private final MailSender mailSender;

    @Autowired                                  // ← この方を使ってね
    public OrderService(UserRepository userRepository, MailSender mailSender) {
        this.userRepository = userRepository;
        this.mailSender = mailSender;
    }

    // テスト用のコンストラクタ（@Autowired は付けない）
    public OrderService(UserRepository userRepository) {
        this(userRepository, new ConsoleMailSender());
    }
}
```

ただし、コンストラクタが複数になるのはそもそも**設計の匂い**であることが多いです。
ふつうは、コンストラクタは 1 つに絞り、テストにはモックを使うのが現代風です。

---

## Lombok で短く書く（補足）

実務でよく見るのが、**Lombok**（ロンボック）というライブラリを使った書き方です。

```java
@Service
@RequiredArgsConstructor                    // ← Lombok のアノテーション
public class OrderService {
    private final UserRepository userRepository;
    private final MailSender mailSender;

    // コンストラクタは Lombok が自動生成
}
```

`@RequiredArgsConstructor` を付けると、`final` フィールドを引数に持つ**コンストラクタを自動生成**してくれます。
書く量が減り、フィールドの順序ともずれないので、人気の書き方です。

ただし、

- 学習コストがあがる（マクロ的なライブラリへの慣れ）
- IDE で追加設定が必要
- 標準 Java ではない

ため、**本書では Lombok を前提にしない**で書きます。
現場で見かけたら、「`@RequiredArgsConstructor` = `final` フィールドのコンストラクタを自動生成」と覚えておけば大丈夫です。

---

## 注入順序 ― Spring が解決してくれる

依存先が、さらに別の Bean に依存していたら、どうなるでしょうか?

```java
@Service
public class OrderService {
    public OrderService(UserRepository userRepo, MailSender mailSender) { ... }
}

@Repository
public class JpaUserRepository implements UserRepository {
    public JpaUserRepository(EntityManager em) { ... }   // EntityManager に依存
}
```

Spring は、この**依存の依存**を**自動で順番に解決**してくれます。

1. `OrderService` を作るには、`UserRepository` が必要
2. `UserRepository` の実装は `JpaUserRepository`
3. `JpaUserRepository` を作るには、`EntityManager` が必要
4. `EntityManager` を先に作る
5. → `JpaUserRepository` を作る
6. → `OrderService` を作る

―― この**依存グラフの解決**を、利用者の代わりにやってくれるのが、Spring の本領です。
私たちは「**何が必要か**」だけ書けば、組み立て順は Spring が勝手にやってくれます。

---

## テストでの活用 ― コンストラクタ注入の真価

第33章で書いた Mockito のテストが、ここで活きます。

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock UserRepository userRepository;
    @Mock MailSender mailSender;
    @InjectMocks OrderService orderService;        // 自動でコンストラクタ注入

    @Test
    void placesOrder() {
        when(userRepository.findById(1L)).thenReturn("taro@example.com");

        orderService.placeOrder(1L, "本");

        verify(mailSender).send("taro@example.com", "ご注文 [本] を受け付けました");
    }
}
```

`@InjectMocks` が **コンストラクタを見て** `@Mock` を差し込んでくれる、という第33章の流れが、**そのまま Spring Bean に対しても効きます**。
コンストラクタ注入は、**Spring を使わないユニットテスト**でも、抜群に書きやすいのです。

---

## なぜ「フィールド注入」が嫌われるのか

第1節で「フィールド注入は非推奨」と言いました。
コンストラクタ注入と比べて、何がダメか整理します。

```java
@Service
public class OrderService {
    @Autowired
    private UserRepository userRepository;       // フィールド注入
}
```

| 比較項目 | コンストラクタ注入 | フィールド注入 |
|---|---|---|
| `final` にできるか | ⭕ | ❌ |
| 必須依存の強制 | ⭕（注入されないと作れない） | ❌（null のまま使われる） |
| 依存の可視性 | ⭕（コンストラクタを見れば全部） | ❌（フィールドを全部見る必要がある） |
| Spring 抜きでテストできるか | ⭕（`new` で組み立て可） | ❌（リフレクション必要） |
| 循環依存に気づきやすいか | ⭕（起動時にエラー） | ❌（実行時まで気づかない） |

「コードの正しさを、コンパイル時／起動時に強制できるかどうか」が、すべてです。
フィールド注入は、**問題を遅く見つける**ため、推奨されないのです。

---

## まとめ

- **コンストラクタ注入**が、現代の Spring 公式の推奨
- コンストラクタが 1 つなら、**`@Autowired` を省略**できる
- フィールドは **`final`** にして、不変・安全に
- Lombok の **`@RequiredArgsConstructor`** で、書く量を減らせる（現場で見たら覚える）
- 依存の依存（依存グラフ）も、Spring が**自動で解決**してくれる
- フィールド注入は、**問題発見が遅れる**ため非推奨

次の節では、**自分で作ったクラスではない**もの（標準ライブラリ、サードパーティ）を、Bean として登録する方法を学びます。

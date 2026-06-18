---
title: DI とは何か
llm: true
---

## DI とは何か

**DI**（Dependency Injection、依存性の注入）とは、

> 「**クラスが必要とする依存（他のクラス）を、自分で作るのではなく、外から渡してもらう**」

という設計手法です。

DIP（依存性逆転原則、第35章）を、コードの形で実現する具体的な技法、と言ってもいいでしょう。

---

## 依存を「自分で作る」と何が困るか

第33章でも見ましたが、もう一度確認します。

```java
// △ 自分で new
public class OrderService {
    private final UserRepository userRepo;
    private final MailSender mailSender;

    public OrderService() {
        this.userRepo   = new MySqlUserRepository("jdbc:mysql://...");
        this.mailSender = new SmtpMailSender("smtp.example.com");
    }
}
```

このクラスは、

- **テストで、本物の MySQL や SMTP に繋ぐ**ことになる
- 設定（URL）を**直書き**してしまっている
- `MySqlUserRepository` を `PostgresUserRepository` に変えるには、`OrderService` を直すしかない

という、**強い結合**が生まれています。

---

## 依存を「外から受け取る」=DI

これを、外から渡してもらう形に変えます。

```java
// ◯ 外から注入
public class OrderService {
    private final UserRepository userRepo;
    private final MailSender mailSender;

    public OrderService(UserRepository userRepo, MailSender mailSender) {  // 外から受け取る
        this.userRepo = userRepo;
        this.mailSender = mailSender;
    }
}
```

これで、`OrderService` は「**自分が何の実装を使うか**」を知りません。
ただ「**`UserRepository`・`MailSender` を、外から渡してね**」と言うだけです。

これが、DI の核心です。

---

## DI の 3 つの注入方法

依存を外から渡す方法は、3 つあります。

### 1. コンストラクタ注入（推奨）

これまで見てきた書き方です。
**コンストラクタの引数**で依存を受け取り、`final` フィールドに保存します。

```java
public class OrderService {
    private final UserRepository userRepo;

    public OrderService(UserRepository userRepo) {     // ← ここで受け取る
        this.userRepo = userRepo;
    }
}
```

特徴は、

- **必須**の依存を強制できる（コンストラクタで全部渡さないとインスタンスを作れない）
- **`final` で再代入禁止**にできる（テスト中に変えられない・スレッド安全）
- **コンストラクタを見れば、すべての依存が分かる**

これらの理由で、**いまの Spring 公式も「コンストラクタ注入」を推奨**しています。

### 2. セッター注入

```java
public class OrderService {
    private UserRepository userRepo;

    public void setUserRepository(UserRepository userRepo) {  // ← セッターで渡す
        this.userRepo = userRepo;
    }
}
```

セッターで後から差し替えられる柔軟さがありますが、

- 必須かどうかが**コードから分からない**
- 注入し忘れると、**実行時に NullPointerException**

など、欠点が多いため、いまはあまり使われません。

### 3. フィールド注入（非推奨）

```java
public class OrderService {
    @Autowired   // ← Spring の機能
    private UserRepository userRepo;
}
```

フィールドに `@Autowired` を付けて、Spring に直接フィールドにセットしてもらう書き方です。

- `final` にできない
- 依存が**外から見えない**（コンストラクタを見ても何が必要かわからない）
- テストで `new` するとき、**リフレクションが必要**になる

ということで、Spring 公式に**非推奨**とされています。
古いコードでよく見かけますが、新規では使わないようにしましょう。

---

## DI と DIP の関係

第35章の DIP は「**抽象に依存する**」と言いました。
DI は、その抽象への依存を**コードの形で実現する方法**です。

| 抽象的な原則 | コードでの実現 |
|---|---|
| DIP（依存性逆転原則） | DI（依存性の注入） |
| 「抽象に依存する」 | `interface` 型のフィールド |
| 「下位が抽象に合わせる」 | `implements` で抽象を実装 |
| 「上位の都合で抽象を決める」 | 上位パッケージに `interface` を置く |

DI を実践していると、自然と DIP に従う形になります。

---

## DI コンテナが解決すること

ここまでで、

```java
public OrderService(UserRepository userRepo, MailSender mailSender) {
    this.userRepo = userRepo;
    this.mailSender = mailSender;
}
```

までは書けるようになりました。
ですが、これを**呼ぶ側**は、こうなります。

```java
UserRepository userRepo = new MySqlUserRepository(...);
MailSender mailSender = new SmtpMailSender(...);
OrderService orderService = new OrderService(userRepo, mailSender);
```

依存が増えると、この「**組み立て**」だけで膨大なコードになります。

| 場所 | 担当 |
|---|---|
| 各クラスの中 | 「自分が必要なもの」を**コンストラクタで受け取る**ように書くだけ |
| ★ ここを誰がやる? | 「**誰を、誰に、どう渡すか**」の組み立て |

この「組み立て」の役目を引き受けるのが、**DI コンテナ**です。

```text
DI コンテナ:
  「私が、すべての部品を覚えておきます。
   どこかで OrderService が必要になったら、
   必要な UserRepository と MailSender を、私が探して、組み立てて、渡します」
```

Spring は、まさにこの「組み立て役」をやってくれるライブラリです。
次の節から、それを具体的に見ていきます。

---

## なぜ DI コンテナ「フレームワーク」なのか

「ただの `new` を肩代わりするだけなら、自分で書けばいいのでは?」と思うかもしれません。
DI コンテナが提供してくれるのは、`new` の代行**だけ**ではありません。

- **依存の自動解決**（順序を考えずに済む）
- **スコープ管理**（Singleton / Prototype / Request など）
- **ライフサイクル管理**（起動時の初期化、終了時のクリーンアップ）
- **AOP**（共通の処理を横断的に差し込む。第40章で触れる）
- **設定の外部化**（プロパティ・YAML から値を取り込む）

これらが**1 つの仕組み**として手に入るのが、Spring を使う最大のメリットです。

---

## まとめ

- **DI**（Dependency Injection）は、依存を**外から受け取る**設計手法
- 注入方法は、**コンストラクタ注入が推奨**
- セッター注入・フィールド注入は、いまは非推奨
- DI は、**DIP のコードでの実現**
- 依存の組み立ては、**DI コンテナ**に任せると楽

次の節では、Spring の基本 ―― **Bean と DI コンテナ**について学びます。

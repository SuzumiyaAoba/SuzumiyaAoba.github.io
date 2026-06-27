---
title: なぜモックが必要か
llm: true
co-author: ["Claude Opus 4.7"]
---

## なぜモックが必要か

具体的な例を見ながら、「**なぜモックが必要なのか**」を理解していきましょう。

---

## 依存があるクラスの例

ユーザーに、お知らせメールを送るサービスを考えます。

```java
public class UserService {
    private final UserRepository repository;     // ① DB アクセス
    private final MailSender mailSender;          // ② メール送信

    public UserService(UserRepository repository, MailSender mailSender) {
        this.repository = repository;
        this.mailSender = mailSender;
    }

    public void notifyUser(long id, String message) {
        User user = repository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("ユーザーが見つかりません: " + id));
        mailSender.send(user.email(), "お知らせ", message);
    }
}
```

`UserService` は、

- `UserRepository`（DB から `User` を取ってくる）
- `MailSender`（実際にメールを送る）

の **2 つの依存**を持っています。

そして、`notifyUser` のロジック自体は単純です。

- ID で `User` を引いてくる
- 見つからなければ例外
- 見つかれば、その `email` に向けてメールを送る

このメソッドを**そのままテストする**には、次のものが必要になります。

- 本物のデータベース
- 本物のメールサーバー（または SMTP）

これは、ユニットテストとしては**重すぎ**ます。

---

## 本物を使うと、何が困るのか

`UserService` のテストで、本物の DB とメールサーバーを使うと、こうなります。

| 問題 | 何が起きるか |
|---|---|
| **遅い** | DB 接続だけで数百ミリ秒。テスト 100 個で 1 分以上 |
| **不安定** | DB に接続できない・SMTP が応答しない、で落ちる |
| **再現性がない** | DB のデータが変わるとテスト結果が変わる |
| **副作用** | テストのたびに本物のメールが送信される（事故） |
| **テストが書けない** | そもそも CI 環境に本物の DB / SMTP がない |

要するに、ユニットテストには、**本物の依存は重すぎる**のです。

---

## 「身代わり」を差し込むという発想

そこで考えるのが、「**本物のかわりに、テスト用の偽物を差し込む**」という方法です。

```text
本番:    UserService ──→ 本物の UserRepository ──→ MySQL
                  ──→ 本物の MailSender    ──→ SMTP

テスト:  UserService ──→ 偽物の UserRepository（決まった User を返す）
                  ──→ 偽物の MailSender   （何もしない・呼ばれたことだけ覚えている）
```

「偽物」がやることは、テストのために**ちょうどよくふるまうこと**だけです。

- `repository.findById(1L)` が呼ばれたら、`Taro` を返す
- `mailSender.send(...)` が呼ばれたら、何もしない（記録だけ取る）

これで、`UserService` のロジックを**まわりから切り離して**検証できるようになります。

---

## 「身代わり」の作り方 ― 3つの選択肢

実は、「身代わり」を用意する方法は、**3 つあります**。

### 1. 自分で偽物のクラスを書く

たとえば、`UserRepository` インターフェースを実装した `FakeUserRepository` を、テスト用に手で書きます。

```java
class FakeUserRepository implements UserRepository {
    @Override
    public Optional<User> findById(long id) {
        if (id == 1L) {
            return Optional.of(new User(1L, "Taro", "taro@example.com"));
        }
        return Optional.empty();
    }

    @Override
    public void save(User user) {
        // テストでは何もしない
    }
}
```

これは**動きます**。ですが、テストごとに「この入力では、この戻り値」を書き分けたくなると、**偽物が増えすぎて**しまいます。

### 2. ライブラリでモックを動的に作る ← この章のテーマ

**Mockito** などのモックライブラリは、インターフェースから**自動で偽物のインスタンス**を作ってくれます。

```java
UserRepository repository = mock(UserRepository.class);
when(repository.findById(1L))
    .thenReturn(Optional.of(new User(1L, "Taro", "taro@example.com")));
```

`mock(UserRepository.class)` で、**何もしない偽物**ができ、
`when(...).thenReturn(...)` で、**ある呼び出しに対する返り値**を仕込めます。

書く量が少なく、テストごとに自由に挙動を変えられるのが強みです。

### 3. 本物っぽいけれど軽量な「フェイク」を使う

DB なら **H2**（インメモリ DB）、メールなら **GreenMail**（テスト用 SMTP サーバー）などです。
依存を完全に切るわけではなく、「本物に近い軽量な実装」をテスト用に使います。

第37章（DB アクセス）で、また登場します。

---

## モックを使う前提 ― 「インターフェース越し」の依存

モックは、「**インターフェース越しに依存している**」と、ぐっと使いやすくなります。

先ほどの `UserService` を、もう一度見てみましょう。

```java
public class UserService {
    private final UserRepository repository;     // ← インタフェース型
    private final MailSender mailSender;          // ← インタフェース型

    public UserService(UserRepository repository, MailSender mailSender) {
        this.repository = repository;
        this.mailSender = mailSender;
    }
}
```

ここでは、依存を**インターフェース型**で持っていて、**コンストラクタで受け取って**います。
このようなコードなら、テストでは「**インターフェースのモック**」をコンストラクタに渡すだけで、依存を差し替えられます。

```java
UserRepository fakeRepo = mock(UserRepository.class);
MailSender fakeMail   = mock(MailSender.class);
UserService service   = new UserService(fakeRepo, fakeMail);  // 偽物を注入
```

このように「**外から依存を注入する**」設計を、**依存性の注入**（Dependency Injection、DI）と呼びます。
DI は第36章で本格的に学びますが、**モックと相性が抜群によい設計パターン**だと、ここで覚えておいてください。

---

## モックでテストできること

モックが使えるようになると、次のようなテストが書けます。

### 1. **依存先がこう答えたら、対象クラスがこう動く**ことの検証

```text
repository.findById(1L) が Taro を返したとき、UserService は taro@example.com にメールを送る
```

これは**正常系**のテストです。

### 2. **依存先が失敗したら、対象クラスがどう振る舞うか**の検証

```text
repository.findById(99L) が Optional.empty を返したとき、UserService は例外を投げる
```

これは**異常系**のテストです。
本物の DB で「存在しない ID」を再現するのは、データ準備が必要で大変ですが、モックなら 1 行で再現できます。

### 3. **依存先が正しく呼ばれたか**の検証

```text
正常系で、mailSender.send は taro@example.com 宛に「ご注文ありがとう」というメールを送っているはず
```

これは**振る舞いベース**のテストです。
Mockito の **`verify`** を使って、「ちゃんと呼んだか」を確認できます。

これら 3 種類のテストを、これからの節で順番に書いていきます。

---

## まとめ

- 依存があるクラスをテストするには、**身代わり**が必要です
- 本物の DB やメールを使うと、テストが遅い・不安定・副作用がある
- Mockito は、**インターフェースから動的にモックを作る**ライブラリです
- モックは、**コンストラクタで依存を受け取る**設計と相性がよいです
- モックでできるテストは、**正常系・異常系・振る舞い**の 3 つに整理できます

次の節では、いよいよ Mockito を使って、はじめてのモックテストを書いてみます。

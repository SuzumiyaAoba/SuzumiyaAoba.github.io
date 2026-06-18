---
title: テストしやすい設計
llm: true
---

## テストしやすい設計

ここまで Mockito の書き方を学んできました。
ですが、**「モックを使いやすいかどうか」は、そもそも本番コードの書き方で決まります**。

この節では、ユニットテストが書きやすくなる設計の話を、少しだけ紹介します。

---

## モックしやすい設計 = テストしやすい設計

第1節で見たような `UserService` は、

- 依存を**インタフェース**として持つ
- 依存を**コンストラクタで受け取る**

という形をしていました。
この 2 つを満たしているコードは、モックを使ったテストが**そのまま書ける**設計です。

逆に、これを満たしていないコードは、テストが極めて書きにくくなります。

---

## アンチパターン1 ― 直接 `new` する

たとえば、こんなコードがあるとします。

```java
public class UserService {

    public void notifyUser(long id, String message) {
        UserRepository repository = new UserRepositoryImpl();    // ① 直接 new
        MailSender mailSender   = new SmtpMailSender();           // ② 直接 new

        User user = repository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("..."));
        mailSender.send(user.email(), "お知らせ", message);
    }
}
```

ロジックは同じです。ただ、依存先を**メソッドの中で直接 `new`** しています。

これだと、テスト時に偽物に差し替える**スキマがありません**。
本物の `UserRepositoryImpl`（DB に繋ぐ）と、本物の `SmtpMailSender`（メール送る）が、テストでも勝手に動いてしまいます。

**「テストできないコード」の典型**です。

---

## アンチパターン2 ― `static` メソッドにロジックを書く

```java
public class MailUtil {
    public static void send(String to, String subject, String body) {
        // 本物の SMTP に送信
    }
}

public class UserService {
    public void notifyUser(...) {
        MailUtil.send(user.email(), "お知らせ", message);   // static 呼び出し
    }
}
```

`static` メソッドは、**インスタンスを差し替えることができません**。
Mockito でも `mockStatic`（モッキート静的モック）という技がありますが、

- テストごとに開いて閉じる手間がある
- 仕組みが複雑で、ハマりやすい
- そもそも「`static` を多用するコードは設計が悪い」シグナル

ということで、本書では基本的に**`static` メソッドにロジックは書かない**方針を推奨します。

---

## 解決策 ― コンストラクタで依存を受け取る

第1節で見たように、依存を**コンストラクタで外から受け取る**形にします。

```java
public class UserService {
    private final UserRepository repository;
    private final MailSender mailSender;

    public UserService(UserRepository repository, MailSender mailSender) {
        this.repository = repository;
        this.mailSender = mailSender;
    }

    public void notifyUser(long id, String message) {
        // ... 同じロジック ...
    }
}
```

ポイントは 3 つです。

1. **インタフェース型のフィールド**を持つ（`UserRepository` / `MailSender`）
2. **コンストラクタで受け取る**（`new` しない）
3. **`final`** で再代入禁止

これで、

- 本番では、**本物の実装**（`new UserRepositoryImpl()` / `new SmtpMailSender()`）を渡す
- テストでは、**モック**（`@Mock UserRepository repository;`）を渡す

という**切り替え**ができるようになります。
これが、第36章で本格的に学ぶ**依存性の注入**（Dependency Injection、DI）の入り口です。

---

## ロジックを引数で受け取る ― 純粋関数として書ける場面

依存性の注入よりも、もっと根本的な解決もあります。
**ロジックそのものを純粋にして、依存を持たないクラスに切り出す**ことです。

```java
public class MessageFormatter {
    public String format(String userName, String body) {
        return "%s さま、%s".formatted(userName, body);
    }
}
```

このクラスは、

- 引数しか見ない
- フィールドも持たない
- 戻り値が決定的

という、ごく純粋なロジックです。
こうしたクラスは、モックなしで素朴にテストできます。

```java
@Test
void formatsMessage() {
    var formatter = new MessageFormatter();
    assertEquals("Taro さま、こんにちは", formatter.format("Taro", "こんにちは"));
}
```

**「モックが必要ないなら、それに越したことはない」**のです。
ロジックは可能なかぎり、純粋に切り出すことを心がけましょう。

---

## モックの使いどころ ― 外の世界との接点だけ

モックが本当に必要なのは、次のような「**外の世界**」との接点だけです。

- データベース（`UserRepository`）
- HTTP API（`PaymentClient`）
- メール / SMS（`MailSender` / `SmsSender`）
- ファイルシステム（`FileStorage`）
- 時刻（`Clock`）
- 乱数（`Random`）

これら**境界**にあたるインタフェースをモック化することで、
中間の**ビジネスロジック**は、自由に検証できるようになります。

逆に、**自分が書いたただの値オブジェクトやドメインクラス**は、モック化する必要はありません。
本物のインスタンスを `new` して使うほうが、テストは健全になります。

---

## 「テストを書きにくい」と感じたら設計を疑う

実務で、「このクラスのテストを書きたいのに、なぜか書きにくい……」と感じたら、それは**設計のサイン**です。

- 依存が多すぎる → クラスの責務が大きすぎるかも
- モックを 5 個も注入している → 切り分けたほうがよいかも
- 例外の道を試すのに、複雑な仕込みが必要 → ロジックがネストしすぎているかも

「**テストの書きやすさ**」は、設計の質の**いちばんわかりやすい指標**のひとつです。
モックを書きやすいかどうかを軸に、本番コードを見直すクセをつけましょう。

---

## まとめ

- 依存を**インタフェース**として、**コンストラクタで受け取る**設計が、モックしやすい
- 直接 `new` や `static` メソッド乱用は、テスト不能なコードのもと
- 純粋なロジックは、モックなしで素直にテストできる
- モックが要るのは、**外の世界との接点**（DB・HTTP・メールなど）だけ
- テストが書きにくいときは、**設計を見直すサイン**

次の節は、Mockito を使うときに初心者がはまりやすい **よくあるつまずき**をまとめます。

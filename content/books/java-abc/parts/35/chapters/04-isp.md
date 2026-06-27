---
title: インターフェース分離原則（ISP）
llm: true
co-author: ["Claude Opus 4.7"]
---

## インターフェース分離原則（ISP）

**Interface Segregation Principle**（ISP、インターフェース分離原則）は、

> **「クライアントは、自分が使わないメソッドに依存させられるべきではない」**

という原則です。

ひとことで言うと、

> **「大きい interface を、小さく分けよう」**

ということです。

---

## ダメな例 ― 巨大インターフェース

たとえば、こんな大きな interface があるとします。

```java
public interface UserService {
    User findById(long id);
    void save(User user);
    void deleteAll();
    void exportToCsv(Path path);
    void importFromCsv(Path path);
    void sendNewsletter(String message);
    void resetPassword(long userId);
    void enableTwoFactorAuth(long userId);
    // ... まだ続く
}
```

この `UserService` を**実装する側**は、上に書かれた**全部のメソッド**を埋めなければなりません。
たとえ「うちは CSV 関係は使わない」「2段階認証なんてやらない」としても、です。

そして、`UserService` を**使う側**も困ります。

```java
public class LoginController {
    private final UserService userService;
    // 必要なのは findById と resetPassword だけなのに、巨大な interface に依存
}
```

`LoginController` は、`UserService` 全体の存在を知ることになります。
**自分が使わないメソッドの変更にも、巻き込まれる**わけです。

これは、

- テストで `UserService` をモックするとき、**たくさんのメソッドを `when` する必要がある**
- 巨大 interface に**新しいメソッドが追加**されると、すべての実装クラスを直す羽目になる

という、典型的な「**結合が強すぎる**」状態です。

---

## ISP に従う ― 利用側ごとに分ける

「**この機能を、使う人は誰か?**」で、interface を**小さく**分けます。

```java
public interface UserReader {
    User findById(long id);
}

public interface UserWriter {
    void save(User user);
    void deleteAll();
}

public interface UserImportExport {
    void exportToCsv(Path path);
    void importFromCsv(Path path);
}

public interface PasswordService {
    void resetPassword(long userId);
}

public interface NewsletterSender {
    void sendNewsletter(String message);
}
```

そして、利用側は**必要なものだけを依存先に取る**。

```java
public class LoginController {
    private final UserReader userReader;
    private final PasswordService passwordService;

    public LoginController(UserReader userReader, PasswordService passwordService) {
        this.userReader = userReader;
        this.passwordService = passwordService;
    }
}
```

これで、`LoginController` は **CSV やニュースレターのことを知らない**まま動けます。
モック化するときも、`UserReader` と `PasswordService` だけスタブすればよくなります。

---

## 1 クラスが複数の interface を実装してもよい

ISP で interface を分けても、**実装クラスは 1 つ**でかまいません。

```java
public class UserServiceImpl implements
    UserReader, UserWriter, UserImportExport,
    PasswordService, NewsletterSender {

    @Override public User findById(long id) { ... }
    @Override public void save(User user) { ... }
    @Override public void deleteAll() { ... }
    @Override public void exportToCsv(Path path) { ... }
    @Override public void importFromCsv(Path path) { ... }
    @Override public void resetPassword(long userId) { ... }
    @Override public void sendNewsletter(String message) { ... }
}
```

実装側はまとめても、**利用側からは小さい interface だけが見える**ようにする ―― これが ISP の使い方です。

---

## 標準ライブラリでも、ISP は意識されている

Java の標準ライブラリには、ISP を意識した設計があちこちにあります。

| インターフェース | 役割 |
|---|---|
| `Iterable<T>` | for-each で回せる |
| `Collection<T>` | サイズ・追加・削除 |
| `List<T>` | 順序つき。インデックスアクセス可 |
| `Set<T>` | 重複なし |

`List` を受け取りたいだけのメソッドが、わざわざ全機能を要求しないように、

```java
void print(Iterable<String> items) { ... }   // for-each さえできれば何でもよい
```

と、**もっとも小さい interface** を引数の型に使う、というのが、ISP に沿った書き方です。

---

## ISP と SRP の関係

ISP は、第1節で学んだ **SRP の interface 版**とも言えます。

| | SRP | ISP |
|---|---|---|
| 対象 | クラス | インターフェース |
| 主張 | クラスは1つのことだけする | インターフェースは1つの目的だけ持つ |
| 効果 | 変更の影響を局所化 | 依存の影響を局所化 |

両方を意識すると、**「巨大なものは作らない」**という、健康なコードベースが育ちます。

---

## やりすぎ注意 ― マイクロインターフェースの罠

ISP を真に受けて、メソッド 1 つごとに interface を切るのは、過剰です。

```java
// △ やりすぎ
interface UserFinderById { User findById(long id); }
interface UserFinderByEmail { User findByEmail(String email); }
interface UserSaver { void save(User user); }
interface UserUpdater { void update(User user); }
interface UserDeleter { void delete(long id); }
```

`UserRepository` ひとつでまとまる責務を、**5 つの interface**に細切れにするのは、読み手にとっては地獄です。

判断基準は、

> **「いっしょに使われるメソッド群か?」**

です。
`findById` と `findByEmail` は、たいてい同じ場面で必要になります。
そういうものは、**1 つの interface** にまとめます。

---

## 実例 ― ロギングと監査ログを分ける

業務システムで「ログを書く」と一言で言っても、

- **アプリケーションログ**（開発者向け、デバッグ用）
- **監査ログ**（業務記録、改竄不可、後で監査される）

は、**呼ぶ場所も・要件も・保存先も**まったく違うことがあります。

```java
// △ 一緒くたの interface
interface Logger {
    void log(String msg);
    void audit(String userId, String action);
}
```

これだと、`audit` を使わないコードでも `audit` の存在を知ってしまいます。
ISP に従って、

```java
interface AppLogger { void log(String msg); }
interface AuditLogger { void audit(String userId, String action); }
```

と分けるのが、ふつうの解決です。

---

## まとめ

- **ISP** は、「**使わないメソッドに依存させない**」原則
- 巨大な interface は、**利用側ごとに分ける**
- 実装クラスは、複数の interface を**まとめて持ってよい**
- 標準ライブラリも、`Iterable` / `Collection` / `List` の階層で ISP を実践している
- SRP の **interface 版**と考えると分かりやすい
- ただし、**マイクロインターフェース化**は過剰

次の節は、いよいよ最後の原則 **DIP** ―― 依存性逆転原則です。

---
title: コンポーネントスキャン
llm: true
co-author: ["Claude Opus 4.7"]
---

## コンポーネントスキャン

`@Service` や `@Component` を付けたクラスを、Spring が**勝手に見つけてくれる**仕組みが、**コンポーネントスキャン**（component scan）です。

ここでは、その動きと、つまずきやすいポイントを整理します。

---

## どこから、どこまでをスキャンするのか

スキャンの**起点**は、**`@SpringBootApplication` が付いたクラスのパッケージ**です。
そこから**下のすべて**を再帰的にスキャンします。

```text line-numbers=false
com.example.shop                  ← ShopApplication.java（@SpringBootApplication）
com.example.shop.order            ← スキャン対象
com.example.shop.user             ← スキャン対象
com.example.shop.infra.mail       ← スキャン対象
com.example.other                 ← スキャン対象外
com.bar                            ← スキャン対象外
```

逆にいうと、**起点より上**にあるパッケージは**スキャンされません**。
このため、

> **`@SpringBootApplication` は、プロジェクトの最上位パッケージに置く**

のが、Spring Boot の鉄則です。

---

## スキャンされるアノテーションたち

スキャン対象になるのは、次のアノテーションが付いたクラスです。

| アノテーション | 用途 |
|---|---|
| `@Component` | 汎用的な Bean |
| `@Service` | ビジネスロジック |
| `@Repository` | データアクセス |
| `@Controller` | Web のリクエスト処理（第38章） |
| `@RestController` | REST API（第38章） |
| `@Configuration` | 設定クラス（第6節） |

これらは**ほぼ同じ役割**ですが、第2節で説明したとおり、**読み手に意図を伝える**ために使い分けます。
内部的には、すべて `@Component` がベースになっています。

---

## スキャン対象を変更したいとき

ふつうは、`@SpringBootApplication` の位置を変えるだけで十分です。
ですが、たとえば「**特定のパッケージだけスキャンしたい**」場合は、`@SpringBootApplication` に属性を付けます。

```java
@SpringBootApplication(scanBasePackages = {"com.example.shop", "com.example.shared"})
public class ShopApplication { ... }
```

これで、`com.example.shared` も追加で対象にできます。
ただし、**ふつうのプロジェクトでは、この設定はあまり使いません**。
構造が複雑になっている時点で、リファクタリングを考えたほうがよいことも多いです。

---

## 同じ型の Bean が 2 つあったら?

たとえば、`MailSender` の実装が**2 つ**あったとします。

```java
@Component
public class ConsoleMailSender implements MailSender { ... }

@Component
public class SmtpMailSender implements MailSender { ... }
```

そして、`OrderService` が `MailSender` を求めると、Spring はどちらを渡すか**選べません**。
起動時に、

```text line-numbers=false
Field mailSender in com.example.shop.OrderService required a single bean,
but 2 were found:
        - consoleMailSender: defined in file [...]
        - smtpMailSender: defined in file [...]
```

というエラーが出て、起動に失敗します。

### 対処方法

3 つの選択肢があります。

### 1. `@Primary` で、優先する Bean を 1 つ決める

```java
@Component
@Primary
public class SmtpMailSender implements MailSender { ... }   // ← こちらが優先

@Component
public class ConsoleMailSender implements MailSender { ... }
```

`@Primary` が付いた Bean が、デフォルトで選ばれます。
「**ふつうはこっち**、テスト時だけ別」という使い分けで便利です。

### 2. `@Qualifier` で、明示的に選ぶ

```java
@Component("smtp")
public class SmtpMailSender implements MailSender { ... }

@Component("console")
public class ConsoleMailSender implements MailSender { ... }
```

```java
@Service
public class OrderService {
    public OrderService(@Qualifier("smtp") MailSender mailSender) {
        ...
    }
}
```

利用側で `@Qualifier("smtp")` と指定して、**名前で**選びます。
複数の実装を**使い分けたい**ときの基本テクニックです。

### 3. すべてを `List<MailSender>` で受け取る

```java
@Service
public class OrderService {
    private final List<MailSender> mailSenders;

    public OrderService(List<MailSender> mailSenders) {
        this.mailSenders = mailSenders;   // 全部のリストが渡される
    }
}
```

`MailSender` 型の Bean を**全部欲しい**ときの書き方です。
Strategy パターンを **複数同時に動かす**ような場面（通知を Email も Slack も SMS も全部送る）で使えます。

---

## スキャンで見つからないと、どうなる?

`@Component` を付け忘れたクラスは、Bean として登録されません。
それを依存として要求しているクラスを起動しようとすると、こんなエラーが出ます。

```text line-numbers=false
Parameter 0 of constructor in com.example.shop.OrderService required a bean
of type 'com.example.shop.UserRepository' that could not be found.
```

「`OrderService` のコンストラクタ第1引数（=`UserRepository`）の Bean が見つからない」というメッセージです。

### 対処

- **`@Repository` / `@Component` の付け忘れ**を確認する
- 実装クラスが、**スキャン対象のパッケージにあるか**を確認する
- `pom.xml` で、**必要な依存ライブラリ**が入っているかを確認する

このエラーは、Spring 初心者の**いちばんよくある停止理由**です。

---

## デフォルトの Bean 名

`@Component` 系のアノテーションは、Bean を登録するときに**名前**を付けます。
名前を指定しなければ、**クラス名の頭文字を小文字にしたもの**が名前になります。

| クラス | デフォルト Bean 名 |
|---|---|
| `OrderService` | `orderService` |
| `InMemoryUserRepository` | `inMemoryUserRepository` |
| `ConsoleMailSender` | `consoleMailSender` |

名前を明示したいときは、

```java
@Service("orderProcessor")
public class OrderService { ... }
```

と、引数に渡します。
ただし、ふつうはデフォルトで十分です。

---

## まとめ

- コンポーネントスキャンの起点は、**`@SpringBootApplication` のパッケージ**
- そこから**下のすべて**が再帰的にスキャンされる
- だから、**`@SpringBootApplication` は最上位パッケージに置く**
- `@Component` / `@Service` / `@Repository` / `@Controller` がスキャン対象
- 同じ型の Bean が複数あれば、**`@Primary`** か **`@Qualifier`** で選ぶ
- 見つからないと、**Bean のないコンストラクタ引数**のエラーで起動失敗

次の節では、現代の Spring で**推奨される注入方法**である、**コンストラクタ注入**を改めて整理します。

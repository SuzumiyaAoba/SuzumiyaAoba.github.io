---
title: Spring の基本
llm: true
---

## Spring の基本

Spring は、Java の世界でもっとも広く使われているフレームワークです。
**Spring Framework**（中核ライブラリ）と、その上に乗る数多くのモジュール（Spring Web、Spring Data、Spring Security、...）の集合体です。

そして、それらを**設定不要で動かせる**ようにまとめたのが、**Spring Boot** です。
本書では、基本的に Spring Boot を使って学んでいきます。

---

## Spring の中心は「DI コンテナ」

Spring がやってくれることは数多くありますが、**中心は DI コンテナ**です。
DI コンテナのことを、Spring の世界では **`ApplicationContext`** とも呼びます。

`ApplicationContext` は、

1. **Bean**（管理対象のオブジェクト）を、リストにして保管する
2. それぞれの Bean が**どんな依存を必要としているか**を把握する
3. 起動時に、Bean を**順番に組み立てて**注入する

という、**「組み立て役」**の責務を担います。

---

## Bean とは何か

**Bean**（ビーン、豆）は、Spring のコンテナが**管理してくれるオブジェクト**のことです。
クラスそのものではなく、コンテナに登録されている**インスタンス**を指します。

Spring に「これは Bean ですよ」と伝える方法は、いくつかあります。

| 方法 | どう伝えるか |
|---|---|
| アノテーション | `@Component` / `@Service` / `@Repository` / `@Controller` |
| 設定クラス | `@Configuration` + `@Bean` メソッド |
| XML（古い書き方） | `applicationContext.xml`（いまは使わない） |

本書では、**アノテーション**と**設定クラス**だけを扱います。

---

## いちばん小さな Spring の例

ここから具体的に動かしていきます。
たとえば、`OrderService` を Bean として登録してみます。

```java
@Service          // ← これを付けると、Spring が Bean として登録してくれる
public class OrderService {
    private final UserRepository userRepo;
    private final MailSender mailSender;

    public OrderService(UserRepository userRepo, MailSender mailSender) {
        this.userRepo = userRepo;
        this.mailSender = mailSender;
    }

    public void placeOrder(long userId, String item) {
        // ...
    }
}
```

```java
@Repository       // ← Repository としての Bean
public class InMemoryUserRepository implements UserRepository { ... }

@Component        // ← 汎用的な Bean
public class ConsoleMailSender implements MailSender { ... }
```

これで、

- `InMemoryUserRepository` が「`UserRepository` 型の Bean」として登録される
- `ConsoleMailSender` が「`MailSender` 型の Bean」として登録される
- `OrderService` が「`OrderService` 型の Bean」として登録される

そして、Spring は `OrderService` のコンストラクタを見て、

- 「`UserRepository` が必要だな → `InMemoryUserRepository` を渡そう」
- 「`MailSender` が必要だな → `ConsoleMailSender` を渡そう」

と、**自動で組み立て**てくれます。
コードのどこにも `new OrderService(...)` を書かなくてよくなります。

---

## 4 種類のステレオタイプアノテーション

`@Service`・`@Repository`・`@Component`・`@Controller` ―― これら 4 つは、本質的には**ぜんぶ同じ**働きをします。
どれも、「**このクラスを Bean として登録してね**」と Spring に伝えるためのものです。

ですが、**役割を伝えるための慣習的な使い分け**があります。

| アノテーション | 役割 | 例 |
|---|---|---|
| `@Component` | 汎用的な Bean | `ConsoleMailSender`、`Clock`、ユーティリティクラスなど |
| `@Service` | ビジネスロジック | `OrderService`、`UserService` |
| `@Repository` | データアクセス | `InMemoryUserRepository`、`JpaOrderRepository` |
| `@Controller` | Web のリクエスト処理 | `OrderController`（第38章） |

「`@Service` を付けないと動かない」というわけではありません。
**読み手に「これは何の役割か」を伝える**ために、適切なものを選びます。

`@Repository` には、データアクセス例外を Spring の例外に変換する追加機能もあります（第37章）。
細かい差はありますが、**まずは「役割を表すラベル」**として覚えれば十分です。

---

## DI コンテナの仕事のイメージ

Spring の中で起きていることを、図にするとこうなります。

```text
[起動]
  ApplicationContext が、@Component などの付いたクラスを探す
        ↓
  すべての Bean を、リストアップ
        ↓
  各 Bean のコンストラクタを見て、依存する Bean を解決
        ↓
  依存の少ない Bean から順番に、new していく
        ↓
  必要な場所に注入して、すべての Bean を組み立てる
        ↓
  起動完了

[実行中]
  Bean をリクエストされたら、コンテナから取り出して返す
```

このすべてを、私たちは**コードで書かない**で済みます。
書くのは、ステレオタイプアノテーション（`@Service` など）と、コンストラクタだけ。
あとは Spring がやってくれます。

---

## なぜ「コンテナ」と呼ぶのか

英語の **container** は「容器」「入れ物」の意味です。
Spring の `ApplicationContext` は、**Bean たちを入れておく入れ物**であり、必要なときに取り出して使えるしくみです。

DI コンテナのことを、**IoC コンテナ**（Inversion of Control Container、制御反転コンテナ）とも呼びます。
`IoC`（制御の反転）とは、

> 「**フレームワークが流れを管理する**。利用者はパーツを埋めるだけ」

という、Template Method パターン（第34章）の発想を、もっと大きな規模に広げたものです。
DI コンテナは、その典型例です。

---

## 設定はどこで決まるのか?

「Bean がリストアップされる」と言いましたが、**どこから探すのか**気になるかもしれません。

Spring Boot の場合、**`@SpringBootApplication` が付いたクラスのパッケージ**を起点として、**そこから下のパッケージ全体**を自動でスキャンします。
これを **コンポーネントスキャン**（component scan）と呼びます。詳しくは第4節で扱います。

```text
com.example.shop              ← @SpringBootApplication
com.example.shop.order        ← スキャンされる
com.example.shop.user         ← スキャンされる
com.example.other             ← スキャンされない
```

このため、**`@SpringBootApplication` クラスは、プロジェクトの最上位パッケージに置く**のが慣習です。

---

## まとめ

- Spring の中心は、**DI コンテナ**（`ApplicationContext`）
- コンテナが管理するオブジェクトを、**Bean** と呼びます
- Bean を登録する方法は、`@Component` 系のアノテーション
- `@Service`・`@Repository`・`@Controller` は、**役割を伝える**ための区別
- Spring Boot は、`@SpringBootApplication` クラス**以下**を自動でスキャンします

次の節では、実際に Spring Boot プロジェクトを作って、動かしてみます。

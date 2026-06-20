---
title: はじめに ― この章で学ぶこと
llm: true
---

## はじめに ― この章で学ぶこと

第35章で、SOLID 原則の最後にあたる **DIP（依存性逆転原則）** を学びました。
ポイントは、

- 上位は、**抽象（interface）**に依存する
- 下位は、その抽象を**実装する**
- 実装は、コンストラクタで**外から注入**する

という形でした。

ですが、依存が増えてくると、次のような問題が出てきます。

```java
// ◯ SOLID には従っているが…
public static void main(String[] args) {
    UserRepository userRepo = new MySqlUserRepository(...);
    OrderRepository orderRepo = new MySqlOrderRepository(...);
    MailSender mailSender = new SmtpMailSender(...);
    PaymentStrategy payment = new CreditCardPayment(...);
    OrderService orderService = new OrderService(userRepo, orderRepo, mailSender);
    OrderController controller = new OrderController(orderService);
    // ... 数十行つづく ...
}
```

「**誰が、何を、誰に渡すか**」の組み立て作業（**配線**）が、`main` の中で膨大になります。
そして、

- 依存が変わるたびに、`main` を直す
- テスト用の `main` も別に書くことになる
- 設定ごとに `main` を増やしたくなる

という、新たな複雑さが生まれます。

---

## DI コンテナがこの組み立てを引き受ける

そこで活躍するのが、**DI コンテナ**（Dependency Injection Container）です。

- 必要なクラスを「**部品**」として登録しておく
- どの部品が、どの抽象を実装しているか、コンテナが**把握**する
- アプリ起動時に、コンテナが**自動で組み立て**て、必要な場所に注入する

Java の世界で、もっとも広く使われている DI コンテナが **Spring**（スプリング）です。
そして、それをかんたんに使えるようにしたフレームワークが、**Spring Boot**（スプリング・ブート）です。

---

## この章のテーマ

本書のサンプルは、**Spring Boot 3.5 系・Java 25** で実機検証しています。

`pom.xml` に、次の依存を追加して使います。

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.5.3</version>
</parent>

<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

`spring-boot-starter-parent` を継承すると、Spring Boot の **おすすめバージョン**が自動で適用されます。
個別のライブラリのバージョンを書かなくてよいので、`pom.xml` がすっきりします。

---

## この章で学ぶこと

第36章は、次の8つの節で構成されています。

| 節 | タイトル | 内容 |
|---|---|---|
| 1 | DI とは何か | 配線地獄からの解放 |
| 2 | Spring の基本 | Bean と DI コンテナ |
| 3 | Spring Boot プロジェクト | `@SpringBootApplication` で始める |
| 4 | コンポーネントスキャン | `@Component` で登録する |
| 5 | コンストラクタ注入 | 推奨される注入方法 |
| 6 | `@Configuration` と `@Bean` | 自分以外のクラスを Bean 化する |
| 7 | よくあるつまずき | スコープ・循環依存 |

前半（1〜3節）で、Spring Boot の**最小構成**を作ります。
中盤（4〜6節）で、DI の基本的な書き方をすべて学びます。
最後（7節）に、よくある落とし穴を集めます。

---

## この章を読み終えると

第36章を読み終えるころには、次のことができるようになっています。

- DI コンテナが、何をしてくれるかを自分の言葉で説明できる
- Spring Boot プロジェクトを作って、`@SpringBootApplication` で起動できる
- `@Service` / `@Repository` / `@Component` でクラスを Bean 化できる
- コンストラクタ注入で、抽象に依存するコードを Spring に組み立てさせられる
- `@Configuration` と `@Bean` で、外部ライブラリのクラスも Bean として扱える
- 循環依存などの典型的な失敗を、エラーメッセージから見抜ける

---

> **補足: なぜ Spring か?**
>
> Java の DI コンテナは Spring 以外にもありますが、Spring は**業務システムでのデファクトスタンダード**です。
> 第38章で扱う Spring Boot を使った REST API、第37章のデータベースアクセスも、すべて Spring が基盤になります。
> 業務で Java を書くなら、Spring の基本は避けて通れません。

それでは、最初の節「DI とは何か」から始めましょう。

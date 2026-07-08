---
title: Spring Boot プロジェクト
llm: true
co-author: ["Claude Opus 4.7"]
---

## Spring Boot プロジェクト

実際に、Spring Boot プロジェクトを作って、動かしていきます。
本節のサンプルは、**Spring Boot 3.5・Java 25・Maven** で実機検証済みです。

---

## プロジェクト構成の全体像

これから作るのは、次のような構成のプロジェクトです。

```text line-numbers=false
shop/
├── pom.xml
└── src/
    └── main/
        └── java/com/example/shop/
            ├── ShopApplication.java        ← 起動クラス
            ├── OrderService.java
            ├── UserRepository.java
            ├── InMemoryUserRepository.java
            ├── MailSender.java
            └── ConsoleMailSender.java
```

第2節で紹介した `OrderService` などを、すべて入れてあります。

---

## ステップ1 ― `pom.xml`

第31章で学んだ Maven の `pom.xml` を、Spring Boot 用にします。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.5.3</version>
        <relativePath/>
    </parent>

    <groupId>com.example</groupId>
    <artifactId>shop</artifactId>
    <version>1.0.0</version>

    <properties>
        <java.version>25</java.version>
        <maven.compiler.release>25</maven.compiler.release>
    </properties>

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

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

ポイントを見ていきます。

### `<parent>` ― Spring Boot のおすすめ設定を継承する

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.5.3</version>
</parent>
```

これがあると、

- Spring Boot に**合うバージョン**のライブラリが、自動で揃う
- 個別の依存に **`<version>` を書かなくてよい**
- Maven プラグインの設定が、いい感じに整う

という恩恵があります。

### `spring-boot-starter` ― Spring Boot の基本

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter</artifactId>
</dependency>
```

これだけで、

- Spring Framework（`spring-context`、`spring-core` ほか）
- ロギング（SLF4J + Logback）
- YAML 設定読み込み

など、Spring Boot の基本機能がすべて入ります。
「Starter」は、関連する依存をまとめた**詰め合わせパック**だと思ってください。

### `spring-boot-starter-test` ― テスト用詰め合わせ

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
```

これを入れると、

- JUnit 5
- Mockito
- AssertJ（流暢に書ける Assertion ライブラリ）
- Spring のテスト機能（`@SpringBootTest` など）

がまとめて使えます。
第32〜33章で書いていた **`junit-jupiter` も `mockito-core` も別途書かなくてよい**のがミソです。

### `spring-boot-maven-plugin` ― 実行可能 JAR を作る

```xml
<plugin>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-maven-plugin</artifactId>
</plugin>
```

このプラグインを入れると、

- `mvn spring-boot:run` で、アプリを起動できる
- `mvn package` で、**実行可能 JAR**（`java -jar` だけで動くもの）を作れる

ようになります。
Spring Boot ならではの便利機能です。

---

## ステップ2 ― 起動クラス `ShopApplication`

すべての Spring Boot アプリには、`@SpringBootApplication` を付けた**起動クラス**が 1 つあります。

```java
package com.example.shop;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ShopApplication implements CommandLineRunner {

    private final OrderService orderService;

    public ShopApplication(OrderService orderService) {
        this.orderService = orderService;
    }

    public static void main(String[] args) {
        SpringApplication.run(ShopApplication.class, args);
    }

    @Override
    public void run(String... args) {
        orderService.placeOrder(1L, "Java入門書");
    }
}
```

このクラスがやっているのは、

1. `main` で `SpringApplication.run(...)` を呼ぶ → Spring Boot が起動し、コンテナができる
2. **コンストラクタ注入**で、`OrderService` を受け取る
3. `CommandLineRunner` の `run` メソッドが、**起動完了後に自動で呼ばれる**

という流れです。

### `@SpringBootApplication` は 3 つの合わせ技

`@SpringBootApplication` は、次の 3 つを兼ねたショートカットです。

| 含まれるアノテーション | 役割 |
|---|---|
| `@Configuration` | このクラス自体を設定クラスにする（第6節） |
| `@EnableAutoConfiguration` | Spring Boot のオートコンフィグ機能を有効化 |
| `@ComponentScan` | このクラスのパッケージ以下をスキャン（第4節） |

3 つを書かずに 1 つでまとめられるのが、Spring Boot のうれしさです。

### `CommandLineRunner` は「起動後にやること」

`CommandLineRunner` を実装すると、Spring Boot が**起動完了直後に `run` メソッドを呼んでくれます**。
本格的な Web アプリでは使いませんが、

- ちょっとした動作確認
- 初期データの投入
- バッチ処理のエントリーポイント

として、便利な仕組みです。

---

## ステップ3 ― 部品クラスたち

第2節で見たコードを、すべて配置します。

```java
package com.example.shop;

public interface UserRepository {
    String findById(long id);
}
```

```java
package com.example.shop;

import org.springframework.stereotype.Repository;

@Repository
public class InMemoryUserRepository implements UserRepository {
    @Override
    public String findById(long id) {
        return "user-" + id + "@example.com";
    }
}
```

```java
package com.example.shop;

public interface MailSender {
    void send(String to, String body);
}
```

```java
package com.example.shop;

import org.springframework.stereotype.Component;

@Component
public class ConsoleMailSender implements MailSender {
    @Override
    public void send(String to, String body) {
        System.out.println("[MAIL to " + to + "] " + body);
    }
}
```

```java
package com.example.shop;

import org.springframework.stereotype.Service;

@Service
public class OrderService {
    private final UserRepository userRepository;
    private final MailSender mailSender;

    public OrderService(UserRepository userRepository, MailSender mailSender) {
        this.userRepository = userRepository;
        this.mailSender = mailSender;
    }

    public void placeOrder(long userId, String item) {
        String user = userRepository.findById(userId);
        mailSender.send(user, "ご注文 [" + item + "] を受け付けました");
    }
}
```

---

## ステップ4 ― 動かす

プロジェクトルートで、

```text line-numbers=false
$ mvn spring-boot:run
```

実機での出力（抜粋）。

```text line-numbers=false
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/

 :: Spring Boot ::                (v3.5.3)

INFO  com.example.shop.ShopApplication        : Starting ShopApplication using Java 25.0.2
INFO  com.example.shop.ShopApplication        : Started ShopApplication in 0.263 seconds
[MAIL to user-1@example.com] ご注文 [Java入門書] を受け付けました
```

`[MAIL to ...]` の行が表示されました。
これは、`OrderService` が `MailSender` を呼び、`ConsoleMailSender` が動いた結果です。

注目すべきは、**`new OrderService(...)` を、私たちが一行も書いていない**ことです。
すべて、Spring の DI コンテナが**勝手に組み立てて**くれました。

---

## 何が起きたのか ― Spring の動き

起動から表示までの流れを、整理しておきます。

1. `main` で `SpringApplication.run(...)` を呼ぶ
2. Spring が、`com.example.shop` パッケージ以下を**スキャン**
3. `@Service` / `@Repository` / `@Component` を付けたクラスを見つけ、Bean として登録
4. 各 Bean のコンストラクタを見て、**依存を解決**
5. すべての Bean を組み立てる
6. `ShopApplication` の `run` メソッドが呼ばれる
7. `orderService.placeOrder(...)` が実行され、`[MAIL to ...]` が表示される

私たちは、

- **クラスを書いて**
- **アノテーションを付けた**

だけです。
DI の組み立ては、すべて Spring の中で起きています。

---

## まとめ

- Spring Boot プロジェクトは、`pom.xml` + `@SpringBootApplication` クラスで始まる
- **`spring-boot-starter-parent`** で、おすすめ依存を一括取得
- **`spring-boot-starter`** が、基本機能の詰め合わせ
- **`@SpringBootApplication`** は、`@Configuration` + `@EnableAutoConfiguration` + `@ComponentScan`
- **`CommandLineRunner`** で、起動後に処理を実行できる
- **`new` をどこにも書かない**まま、DI で組み立てられる

次の節では、Bean を登録する核となる**コンポーネントスキャン**を、もう少し詳しく見ます。

---
title: `@Configuration` と `@Bean`
llm: true
---

## `@Configuration` と `@Bean`

ここまでは、自分で書いたクラスに `@Service` や `@Repository` を付けて Bean にしてきました。
ですが、

- 標準ライブラリのクラス（`Clock`、`ObjectMapper`、`HttpClient` など）
- サードパーティのライブラリ（ソースを直せない外部 JAR）

を Bean として使いたいことがあります。
こういうとき、**自分のコードに `@Component` を付けて回る**ことはできません。

そこで使うのが、**`@Configuration` と `@Bean`** です。

---

## 基本形

`@Configuration` を付けたクラスの中に、`@Bean` を付けたメソッドを書きます。

```java
package com.example.shop;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TimeConfiguration {

    @Bean
    public Clock systemClock() {
        return Clock.systemDefaultZone();
    }
}
```

これで、

- `Clock` 型の Bean が、Spring コンテナに登録される
- どこかで `Clock` を要求すると、`systemClock()` の戻り値が注入される

ようになります。
利用側は、これまでと同じ書き方です。

```java
@Service
public class OrderService {
    private final Clock clock;

    public OrderService(Clock clock) {
        this.clock = clock;
    }
}
```

---

## `@Bean` メソッドの中身

`@Bean` メソッドは、**`return` した値が、そのまま Bean になります**。
何を `return` してもよいので、

- 標準ライブラリの `Clock.systemDefaultZone()`
- サードパーティの `new ObjectMapper().registerModule(...)`
- 自作クラスの `new Foo(設定値, ...)`

なんでも書けます。
これは「`@Configuration` クラスの中で、`new` で組み立てたものを Bean として渡せる」ということです。

---

## 別の Bean に依存させる

`@Bean` メソッドの引数も、**ふつうに DI されます**。

```java
@Configuration
public class HttpConfiguration {

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());   // 第25章の java.time 対応
        return mapper;
    }

    @Bean
    public HttpClient httpClient(ObjectMapper mapper) {   // ← 別の Bean が注入される
        return new HttpClient(mapper);
    }
}
```

`httpClient` を作るときに、`objectMapper` が必要 ―― それを引数で受け取るだけで、Spring が解決してくれます。
**Bean 同士の依存も、引数で表せる**のがポイントです。

---

## なぜ「`@Component`」ではダメなのか

自分のコードなら `@Component` で済むのに、なぜ `@Configuration` + `@Bean` が必要なのでしょうか。

- `@Component` は、**そのクラス自身**を Bean にする
- 標準ライブラリの `Clock` クラスには、**自分でアノテーションを付けられない**
- しかも、`Clock.systemDefaultZone()` のように、**ファクトリーメソッド**で生成したいこともある

これを実現するために、`@Configuration` + `@Bean` のしくみがあります。
**「自分以外のクラスを、Bean に変換するための翻訳所」**だと思えば、わかりやすいです。

---

## `@Configuration` クラスの位置

`@Configuration` クラスも、コンポーネントスキャンの対象になります（実は `@Configuration` は内部で `@Component` を含んでいます）。
だから、`@SpringBootApplication` の下に置けば、自動で読み込まれます。

慣習として、

```text
com.example.shop
├── ShopApplication.java
├── OrderService.java
├── ...
└── config/                               ← ここにまとめるとわかりやすい
    ├── TimeConfiguration.java
    └── HttpConfiguration.java
```

のように、`config` パッケージにまとめておくのが整理しやすいです。

---

## プロパティから値を受け取る

「タイムゾーンを設定で変えたい」とか、「URL を環境ごとに変えたい」というとき、Spring Boot は**外部プロパティ**から値を受け取れます。

```yaml
# src/main/resources/application.yml
app:
  default-zone: Asia/Tokyo
  api:
    base-url: https://api.example.com
```

```java
@Configuration
public class AppConfiguration {

    @Bean
    public Clock appClock(@Value("${app.default-zone}") String zone) {
        return Clock.system(java.time.ZoneId.of(zone));
    }
}
```

`@Value("${...}")` で、プロパティの値を**コンストラクタや `@Bean` メソッドの引数**に注入できます。
これによって、**コードを直さずに動作を変える**ことができるようになります。

---

## `@ConfigurationProperties` ― 型安全に設定を扱う

プロパティが増えてくると、`@Value` が散らばって読みにくくなります。
そこで、**設定をまるごと一つのクラスにまとめる**書き方が、`@ConfigurationProperties` です。

```java
@ConfigurationProperties(prefix = "app")
public record AppProperties(String defaultZone, ApiProperties api) {
    public record ApiProperties(String baseUrl) {}
}
```

`prefix = "app"` で、YAML の `app.*` の値が、レコードの**フィールド名と対応**して、自動でセットされます。
そして、

```java
@Configuration
@EnableConfigurationProperties(AppProperties.class)
public class AppConfiguration {

    @Bean
    public Clock appClock(AppProperties props) {
        return Clock.system(java.time.ZoneId.of(props.defaultZone()));
    }
}
```

と、レコードを Bean として注入できるようになります。
設定が**型安全**になり、リネームやリファクタリングがしやすくなります。

---

## アノテーション vs `@Bean` の使い分け

ここまでの話を、整理しておきます。

| こんなとき | こうする |
|---|---|
| 自分が書いたクラスを Bean にしたい | `@Component` / `@Service` / `@Repository` |
| 自分が書いた**設定クラス**を Bean にしたい | `@Configuration` |
| 標準ライブラリのインスタンスを Bean にしたい | `@Configuration` + `@Bean` |
| サードパーティのクラスを Bean にしたい | 同上 |
| ファクトリーメソッドで作りたい | 同上 |
| プロパティから値を受け取りたい | `@Value` または `@ConfigurationProperties` |

両方を、必要に応じて組み合わせるのが、Spring Boot のふつうの使い方です。

---

## まとめ

- 自分のコードでないクラスを Bean にするには、**`@Configuration` + `@Bean`** を使う
- `@Bean` メソッドの**戻り値**が Bean として登録される
- `@Bean` メソッドの**引数**は、他の Bean が DI される
- プロパティから値を受け取るには、**`@Value`** または **`@ConfigurationProperties`**
- `@Configuration` クラスは、`config/` パッケージにまとめると見やすい

次の節は、Spring の DI 周辺で、初心者がはまりやすい**よくあるつまずき**をまとめます。

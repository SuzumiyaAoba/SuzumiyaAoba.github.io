---
title: 設定とローテーション
llm: true
---

## 設定とローテーション

ここまでは、Spring Boot のデフォルト設定 + `application.yml` の簡易設定で進めてきました。
本物の運用では、もう一段詳しい設定が必要になります。
この節では、**Logback の設定ファイル**と、ログファイルの**ローテーション**について学びます。

---

## 設定ファイルの場所

Spring Boot の場合、**`src/main/resources/logback-spring.xml`** に Logback の設定ファイルを置くと、起動時に自動で読み込まれます。

```text
src/main/resources/
├── application.yml
└── logback-spring.xml          ← この章で書くファイル
```

> **`logback.xml` ではなく `logback-spring.xml`?**
>
> Spring Boot では、**`logback-spring.xml`** という名前を推奨しています。
> こちらは、Spring Boot のプロパティ（`${spring.profiles.active}` など）を**読み込んでから**初期化されます。
> Spring Boot 環境では、必ず **`-spring`** 付きを使いましょう。

---

## 最小の設定ファイル

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>

    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} %-5level [%X{traceId:-}] %logger{30} - %msg%n</pattern>
        </encoder>
    </appender>

    <root level="INFO">
        <appender-ref ref="CONSOLE"/>
    </root>

</configuration>
```

要素を順番に見ていきます。

### `<appender>` ― 出力先

`appender`（アペンダー、追加する人）は、**ログをどこに出すか**を表します。

- **`ConsoleAppender`** … 標準出力
- **`FileAppender`** … ファイル
- **`RollingFileAppender`** … ローテーション付きファイル
- **`SyslogAppender`** … syslog

複数の `appender` を並べることもできます。
たとえば、「**コンソールと、ファイルの両方に出力**」も可能です。

### `<encoder>` ― 出力フォーマット

`encoder` は、ログを**どう書き出すか**の指定です。
ここで、第3節で見た **`%d`・`%-5level`・`%X{traceId}`** などの**パターン**を定義します。

| パターン | 意味 |
|---|---|
| `%d{HH:mm:ss.SSS}` | タイムスタンプ |
| `%-5level` | ログレベル（5文字でパディング） |
| `%logger{30}` | ロガー名（30文字に省略） |
| `%X{key}` | MDC の値 |
| `%msg` | メッセージ本文 |
| `%n` | 改行 |
| `%thread` | スレッド名 |

`%n` を最後に必ず付けないと、改行されずに 1 行に続いてしまいます。

### `<root>` ― デフォルトのレベル

```xml
<root level="INFO">
    <appender-ref ref="CONSOLE"/>
</root>
```

「**デフォルト（root）ロガーは、INFO 以上のログを CONSOLE に流す**」という意味です。
個別パッケージのレベルを上書きしたいときは、`<logger>` を追加します。

```xml
<logger name="com.example.shop" level="DEBUG"/>
<logger name="org.hibernate.SQL" level="DEBUG"/>
```

これで、自社パッケージは DEBUG、Hibernate の SQL も DEBUG、その他は INFO、という設定になります。

---

## ファイルにログを書き出す

業務システムでは、**ログをファイルにも残す**のが基本です。
`RollingFileAppender` を使います。

```xml
<appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>logs/app.log</file>

    <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
        <fileNamePattern>logs/app.%d{yyyy-MM-dd}.%i.log</fileNamePattern>
        <maxFileSize>100MB</maxFileSize>
        <maxHistory>30</maxHistory>
        <totalSizeCap>10GB</totalSizeCap>
    </rollingPolicy>

    <encoder>
        <pattern>%d{ISO8601} %-5level [%X{traceId:-}] %logger{30} - %msg%n</pattern>
    </encoder>
</appender>

<root level="INFO">
    <appender-ref ref="CONSOLE"/>
    <appender-ref ref="FILE"/>
</root>
```

ポイントを見ていきます。

### `<file>`

書き込み中のログファイル名です。
`logs/app.log` に、いまのログがリアルタイムに書き込まれます。

### `<rollingPolicy>` ― ローテーション

ログファイルが**無限に肥大化しない**ように、**ローテーション**します。
`SizeAndTimeBasedRollingPolicy` は、サイズと時間の両方でローテーションする戦略です。

| 設定 | 意味 |
|---|---|
| `fileNamePattern` | アーカイブされたログのファイル名パターン |
| `maxFileSize` | 1 ファイルの最大サイズ |
| `maxHistory` | 保持するアーカイブの日数 |
| `totalSizeCap` | 全アーカイブの合計サイズの上限 |

この例だと、

- 1 ファイル **100MB** に達したらローテーション
- アーカイブは **30 日**保持
- 合計サイズが **10GB** を超えたら、古いものから削除

という運用になります。
業務システムでは、**ディスクが埋まる事故**が意外と多いので、必ず上限を設定しましょう。

---

## 環境ごとの設定 ― Spring プロファイル

開発と本番で、ログの設定を変えたいことがよくあります。
Spring Boot では、**プロファイル**で切り替えられます。

```xml
<springProfile name="dev">
    <root level="DEBUG">
        <appender-ref ref="CONSOLE"/>
    </root>
</springProfile>

<springProfile name="prod">
    <root level="INFO">
        <appender-ref ref="FILE"/>
    </root>
</springProfile>
```

起動時に `--spring.profiles.active=prod` を指定すると、`prod` の設定が使われます。

| プロファイル | 用途 |
|---|---|
| `dev` | 開発時。DEBUG + コンソール |
| `staging` | ステージング。INFO + ファイル |
| `prod` | 本番。INFO + ファイル + JSON |

開発時はコンソールで素早く確認、本番はファイルに JSON で出して集約システムへ ―― という運用がよくあります。

---

## JSON ログ（構造化ログ）の設定

第4節で触れた **`logstash-logback-encoder`** の JSON ログを、本格的に設定するならこうです。

```xml
<appender name="JSON" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>logs/app.json</file>
    <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
        <fileNamePattern>logs/app.%d{yyyy-MM-dd}.json.gz</fileNamePattern>
        <maxHistory>30</maxHistory>
    </rollingPolicy>
    <encoder class="net.logstash.logback.encoder.LogstashEncoder"/>
</appender>
```

これで、`logs/app.json` に JSON 形式のログが流れます。
日次ローテーションし、過去ログは **gzip 圧縮**して保存する設定です。

---

## 非同期出力 ― 性能向上

大量のログが出るシステムでは、**ログの書き込みでアプリが遅くなる**こともあります。
これを避けるために、**非同期出力**にできます。

```xml
<appender name="ASYNC" class="ch.qos.logback.classic.AsyncAppender">
    <appender-ref ref="FILE"/>
    <queueSize>1024</queueSize>
    <discardingThreshold>0</discardingThreshold>
</appender>

<root level="INFO">
    <appender-ref ref="ASYNC"/>
</root>
```

`AsyncAppender` は、ログ呼び出しを**バックグラウンドスレッド**で処理するアダプターです。
アプリの本処理は、ログ書き込みを待たずに進めます。

`queueSize` を超えると、デフォルトでは**新しいログを破棄**します。
`discardingThreshold` を `0` にすると、`WARN` 以上は必ず残ります。

---

## どこまで設定するか?

入門段階では、

1. **コンソール + `application.yml` だけ**で始める
2. ファイル出力が必要になったら **`logback-spring.xml`**
3. 構造化ログ・JSON が必要になったら、Logstash エンコーダを追加
4. 性能が問題になったら、非同期出力

の順番で、徐々に拡張すれば大丈夫です。
**最初から全部やる**必要はありません。

---

## まとめ

- 設定は **`logback-spring.xml`** に書く
- `appender` が**出力先**、`encoder` が**フォーマット**
- ファイル出力には **`RollingFileAppender`** を使い、**サイズ・時間でローテーション**
- 環境ごとに **`<springProfile>`** で設定を切り替え
- 構造化ログは **`LogstashEncoder`**
- 大量ログには **`AsyncAppender`**
- 必要に応じて、段階的に設定を拡張

次の節は、ロギングでよくあるつまずきを整理します。

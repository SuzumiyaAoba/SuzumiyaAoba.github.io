---
title: Singleton パターン
llm: true
co-author: ["Claude Opus 4.7"]
---

## Singleton パターン

**Singleton**（シングルトン、唯一）パターンは、**「アプリケーション全体で、そのクラスのインスタンスを 1 つだけしか作らせない」**ことを保証するパターンです。

「設定情報」「ロガー」「カウンタ」「キャッシュ」など、**1 つに固定したいオブジェクト**を表現するために使われます。

---

## 解きたい問題

たとえば、アプリ全体で 1 つだけ持ちたい「設定情報」があるとします。

```java
public class AppConfig {
    private String dbUrl;
    private int maxConnections;
    // ... ゲッターやセッター ...
}
```

これを、あちこちで `new AppConfig()` するとどうなるでしょうか。

- インスタンスが**いくつもできてしまう**
- それぞれが**別の値**を持ち始める
- 「あれ、設定変えたつもりが効いてない…」となる

「**たくさん作られると困る**」 ―― これを構造的に防ぐのが、Singleton です。

---

## 古典的な書き方 ― そして落とし穴

GoF が紹介した、いちばん基本的な形がこちらです。

```java
public class AppConfig {
    private static AppConfig instance;

    private AppConfig() {
        // private にして、外から new させない
    }

    public static AppConfig getInstance() {
        if (instance == null) {
            instance = new AppConfig();
        }
        return instance;
    }
}
```

ポイントは 3 つ。

1. **`private` コンストラクタ** ―― 外から `new` できない
2. **`static` フィールド** ―― クラス全体で 1 つ
3. **`getInstance()`** ―― 受け取り口を 1 本にする

呼び出し側はこう書きます。

```java
AppConfig config = AppConfig.getInstance();
```

`new` は使わない、というのが Singleton の入口です。

### 落とし穴 1: スレッド安全でない

複数のスレッドが**同時に**`getInstance()` を呼ぶと、`instance == null` のチェックを**両方とも通り抜けて**、`new` が 2 回呼ばれる ―― という競合が起きえます。
「1 つしか作らない」と言いながら、**2 つ作ってしまう**わけです。

### 落とし穴 2: シリアライズで複製される

`Serializable` を実装していると、デシリアライズ時に**新しいインスタンスができる**。

### 落とし穴 3: リフレクションで破られる

`Constructor#setAccessible(true)` で `private` コンストラクタも呼べてしまいます。

---

## スレッドセーフな Singleton

「3 重チェックロック」（Double-Checked Locking, DCL）と呼ばれる、定番の書き方があります。

```java
public class AppConfig {
    private static volatile AppConfig instance;   // volatile が必須

    private AppConfig() {}

    public static AppConfig getInstance() {
        AppConfig local = instance;               // 1 回だけ読む
        if (local == null) {
            synchronized (AppConfig.class) {
                local = instance;
                if (local == null) {
                    local = new AppConfig();
                    instance = local;
                }
            }
        }
        return local;
    }
}
```

ポイントは `volatile`（第43章）です。`volatile` がないと、別スレッドから「中身が完成する前のインスタンス」が見えてしまう可能性があります。

もっと簡単な選択肢として、「**初期化オンデマンドホルダ**」というイディオムもあります。
クラスのロードが**遅延される**ことを利用した、**ロック不要**の Singleton です。

```java
public class AppConfig {
    private AppConfig() {}

    private static class Holder {
        static final AppConfig INSTANCE = new AppConfig();
    }

    public static AppConfig getInstance() {
        return Holder.INSTANCE;
    }
}
```

JVM が **クラスローダのスレッド安全性**を保証してくれるので、`synchronized` も `volatile` もいりません。

---

## いちばん簡潔で安全 ― enum で書く Singleton

『Effective Java』（Joshua Bloch 著）が**最良の方法として推奨**するのが、`enum` で書く Singleton です[^effective-java-singleton]。

```java
public enum AppConfig {
    INSTANCE;

    private String dbUrl = "jdbc:postgresql://localhost/app";

    public String dbUrl() {
        return dbUrl;
    }
}
```

呼び出し側は、

```java
String url = AppConfig.INSTANCE.dbUrl();
```

`enum` は仕様で、

- インスタンスが**ただ 1 つ**であること
- **リフレクションで破られない**
- **シリアライズで複製されない**
- **スレッドセーフ**

がすべて保証されています。
「Singleton を書く必要が出たら、まず `enum` を考える」――これが現代の定石です。

> **補足**: `enum` を Singleton として使うのは、本来の「列挙」とは別の用法ですが、Java の仕様としては正当な書き方です。
> 値が 1 つしかない `enum` ＝ 1 つしかインスタンスがない型、という考え方です。

---

## Singleton のアンチパターンと代替案

Singleton は強力ですが、**安易に使うと設計を壊します**。

### グローバル変数化する

`AppConfig.getInstance()` をあちこちで呼ぶようになると、依存関係が**コード全体に染み出します**。
これは「**グローバル変数**を関数呼び出しで隠したもの」と変わりません。

### テストが書きにくい

Singleton はインスタンスが固定なので、テストで**差し替えにくい**。モックを入れたくても、`INSTANCE` の中身は変えられません。

### 代替案 ―― DI コンテナに任せる

現代の Java では、**DI コンテナ**（第36章）に「このクラスはアプリ内で 1 つだけ」と教えるのが標準的です。

```java
@Component   // Spring に「1 つだけ作ってまわす」と伝える
public class AppConfig {
    public String dbUrl() { ... }
}
```

`@Component` を付けたクラスは、Spring が**シングルトンスコープ**で管理してくれます。
「**Singleton にしたい**」と「**自分で Singleton を実装する**」は、別の話です。
DI コンテナを使う場面では、`enum` Singleton も `getInstance()` も書かず、フレームワークに任せます。

---

## いつ Singleton を使うか

純粋な Singleton パターン（`enum INSTANCE` や `getInstance()`）を使うべき場面は、実は**かなり限られます**。

- DI コンテナを使わない**小さなツール**
- ロガー・キャッシュなど、**起動から終了まで本当に 1 つ**で済むユーティリティ
- ライブラリの内部実装

Web アプリやサーバを書くときは、**まず DI コンテナを検討**してください。

---

## まとめ

- **Singleton** は、インスタンスを 1 つだけにするパターン
- 古典的な書き方は **スレッド安全性・リフレクション・シリアライズ**の落とし穴がある
- 現代の Java では **`enum` Singleton** がもっとも簡潔で安全
- 規模のあるアプリでは、自分で書かず **DI コンテナ** に任せるのが標準
- 「**Singleton を実装すべき場面は意外と少ない**」ことを覚えておく

次の章では、生成パターンのもう 1 つの基本 ―― **Factory Method** を学びます。

[^effective-java-singleton]: Joshua Bloch, *Effective Java*, 3rd Edition (Addison-Wesley, 2018, ISBN 978-0-13-468599-1), Item 3 "Enforce the singleton property with a private constructor or an enum type"。"A single-element enum type is often the best way to implement a singleton" として、`enum` シングルトンが推奨されている。

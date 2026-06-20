---
title: Singleton パターン
llm: true
---

## Singleton パターン

**Singleton**（シングルトン、唯一者）は、

> 「**そのクラスのインスタンスを 1 つだけ**にする」

ためのパターンです。
有名で、いちばんよく聞くパターンですが、**使いどころを誤りやすい**パターンでもあります。

---

## 想定する場面

「**1 つだけあればよい / 1 つしか作りたくない**」状況とは、たとえば、

- アプリケーション全体で 1 つだけある**設定オブジェクト**
- アプリケーション全体で 1 つだけの**ログ書き出し器**
- グローバルな**カウンタ** や **キャッシュ**

などです。

ですが、注意してください。
これらは、**「グローバル変数」と同じ匂い**がします。
Singleton は、その「グローバル変数を、ちょっと OOP らしく見せる」だけの場合があるのです。
この節の後半で、その注意点に戻ります。

---

## 古典的な書き方

伝統的な Singleton は、次のように書きます。

```java
public class AppConfig {

    private static AppConfig instance;   // 唯一のインスタンス

    private AppConfig() {                // private なので外から new できない
        // 設定読み込みなど
    }

    public static AppConfig getInstance() {
        if (instance == null) {
            instance = new AppConfig();
        }
        return instance;
    }

    public String getDatabaseUrl() {
        return "jdbc:postgresql://localhost:5432/app";
    }
}
```

使い方は、

```java
String url = AppConfig.getInstance().getDatabaseUrl();
```

ポイントは、

- コンストラクタを **`private`** にして、外から `new` を禁止する
- `static` のフィールドで、**唯一のインスタンス**を保持する
- `getInstance()` で、**いつでも同じインスタンス**を返す

ということです。

---

## マルチスレッドの落とし穴

しかし、上の素朴な実装は、**マルチスレッドで壊れます**。

```java
if (instance == null) {        // ← 2 つのスレッドが、ほぼ同時にここに来ると…
    instance = new AppConfig(); //   両方が new してしまう
}
```

2 つのスレッドが、

1. 同時に「`instance` は null だ」と判断
2. 両方とも `new AppConfig()` を実行
3. **インスタンスが 2 つできてしまう**

という、Singleton の役割を果たさない状況になります。
これを防ぐためには、`synchronized` や **DCL**（ダブルチェックロック）を使う必要があり、書くのがどんどん難しくなります。

---

## おすすめの書き方 ― `enum` シングルトン

Java の世界で「Singleton はこう書け」と推奨される最良の方法が、**`enum` を使う**書き方です。

```java
public enum AppConfig {
    INSTANCE;

    public String getDatabaseUrl() {
        return "jdbc:postgresql://localhost:5432/app";
    }
}
```

`enum` の要素 `INSTANCE` が、**そのクラスの唯一のインスタンス**です。
使い方は、

```java
String url = AppConfig.INSTANCE.getDatabaseUrl();
```

これには、次のメリットがあります。

| メリット | 説明 |
|---|---|
| **スレッドセーフ** | JVM が初期化のスレッド安全性を保証 |
| **シリアライズ安全** | 直列化しても複数のインスタンスにならない |
| **リフレクションでも作れない** | コンストラクタが内部的に保護されている |
| **書き方がシンプル** | フィールドもメソッドも、ふつうの enum と同じ |

GoF の本では言及されていませんが、Java の世界では **Effective Java（Joshua Bloch 著）** が「Singleton は `enum` で書け」と強く推奨しています。
**いまの Java では、これが事実上の標準**です。

---

## 静的メソッドとの違い ― 状態を持つかどうか

「`static` メソッドだけで書けば、`getInstance` も要らないのでは?」と思うかもしれません。

```java
public class AppConfig {
    public static String getDatabaseUrl() {
        return "jdbc:postgresql://localhost:5432/app";
    }
}
```

これも、似たような使い心地です。
違いは、

| | static のクラス | enum Singleton |
|---|---|---|
| 状態を持てるか | ふつうの static フィールド | enum インスタンスのフィールド |
| インタフェース実装 | ❌ できない | ⭕ できる |
| モック化（テスト） | ❌ 難しい | ⭕ インタフェース越しなら可能 |
| 継承 / 拡張 | ❌ できない | △（enum 自体は継承不可、interface 経由ならOK） |

**「interface を実装したい・モック化したい」**なら、**enum Singleton**。
**「純粋なユーティリティ関数しかない」**なら、`static` でもよい。という棲み分けです。

---

## Singleton はアンチパターンか?

実は、Singleton は **「アンチパターンに片足を突っ込んでいる」** という指摘があります。
理由は、

- どこからでも呼べる → **隠れた依存**（テストでモック化しにくい）
- グローバルに状態を持つ → **テストの独立性**が壊れる
- 並行アクセス時の振る舞いが**分かりにくい**

つまり、`AppConfig.INSTANCE` を直接呼んでいるコードは、**`AppConfig` への依存が表に出ない**ため、ユニットテストで切り離しにくいのです。

そのため、現代のおすすめは、

> **「Singleton としてではなく、ふつうのクラスとして書き、DI コンテナで 1 つだけ管理する」**

です。これは第36章で本格的に学びます。
Spring などの DI コンテナは、`@Component` を付けたクラスを「**標準で 1 インスタンス**」として扱います。
これは「Singleton スコープ」と呼ばれます。
利用側からは、ふつうのコンストラクタ注入で受け取るので、テスト時にモックに差し替えられます。

---

## まとめ

- **Singleton** は、**インスタンスを 1 つだけ**にするパターン
- 素朴な実装は**マルチスレッドで壊れる**
- いまの Java では、**`enum` で書く**のが定番（スレッドセーフ・シリアライズ安全）
- ただし、Singleton 自体は「**隠れた依存**」を生むため、**使い過ぎ注意**
- 多くの場合、**DI コンテナの Singleton スコープ**で代用する（第36章）

次は、状態の変化を通知する **Observer** パターンを見ていきます。

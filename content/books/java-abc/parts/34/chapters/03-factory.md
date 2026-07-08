---
title: Factory パターン
llm: true
co-author: ["Claude Opus 4.7"]
---

## Factory パターン

**Factory**（ファクトリー、工場）パターンは、

> 「**オブジェクトの作り方**を、利用側から隠すパターン」

です。
作るのが面倒だったり、種類によって作り方が変わったりするときに、**「作る役」を1か所にまとめる**ためのものです。

---

## 解きたい問題

たとえば、`Payment` の種類を判別して、対応するオブジェクトを作るコードを考えます。

```java
public class PaymentService {
    public void checkout(String method, int amount) {
        PaymentStrategy strategy;

        if (method.equals("CREDIT_CARD")) {
            strategy = new CreditCardPayment("dummy-api-key");   // 引数あり
        } else if (method.equals("BANK_TRANSFER")) {
            strategy = new BankTransferPayment(
                "DUMMY_BANK", "1234567");                          // 引数違い
        } else if (method.equals("POINT")) {
            strategy = new PointPayment();                         // 引数なし
        } else {
            throw new IllegalArgumentException("未知の決済方法: " + method);
        }

        strategy.pay(amount);
    }
}
```

`PaymentService` は、

- 決済処理を**実行する役**でもあり、
- どの決済を**作るかを決める役**でもあります

これは、**1 つのクラスに 2 つの責任が混じっている**状態です。
新しい決済方法が増えるたびに、また `PaymentService` を直すことになります。

---

## Factory の考え方

「作る」専用のクラス、あるいはメソッドを**別の場所に置く**のが Factory パターンです。

```text line-numbers=false
PaymentService ─→ PaymentStrategy
                        ↑
                  PaymentFactory（作る役）
```

`PaymentService` は「`PaymentFactory.create(...)` で作ってもらう」だけ。
新しい決済方法は、**`PaymentFactory` だけを直せばよい**のです。

---

## シンプルファクトリー（Simple Factory）

もっとも単純な書き方です。
GoF の本来の Factory パターンとは少し違いますが、現場でいちばんよく見るのはこれです。

```java
public class PaymentFactory {

    public static PaymentStrategy create(String method) {
        return switch (method) {
            case "CREDIT_CARD"   -> new CreditCardPayment("dummy-api-key");
            case "BANK_TRANSFER" -> new BankTransferPayment("DUMMY_BANK", "1234567");
            case "POINT"         -> new PointPayment();
            default -> throw new IllegalArgumentException("未知の決済方法: " + method);
        };
    }
}
```

`PaymentService` 側は、こうなります。

```java
public class PaymentService {
    public void checkout(String method, int amount) {
        PaymentStrategy strategy = PaymentFactory.create(method);
        strategy.pay(amount);
    }
}
```

これだけで、「**作る役**」が `PaymentService` から消えました。
新しい決済方法を増やすときは、`PaymentFactory.create` の `switch` に**1 行追加**するだけです。

---

## Factory Method パターン ― 古典的な書き方

GoF の Factory Method パターンは、もう少し OOP らしい書き方をします。
**抽象クラスや interface に「作る役のメソッド」を置く**形です。

```java
public abstract class Logger {
    protected abstract Appender createAppender();   // ← Factory Method

    public void log(String message) {
        Appender appender = createAppender();
        appender.write(message);
    }
}

public class FileLogger extends Logger {
    @Override
    protected Appender createAppender() {
        return new FileAppender("app.log");   // ファイルに書く
    }
}

public class ConsoleLogger extends Logger {
    @Override
    protected Appender createAppender() {
        return new ConsoleAppender();         // 標準出力に書く
    }
}
```

サブクラスが、「**どの Appender を作るか**」を決めます。
`Logger#log` 自体は、共通の処理のままです。

これは、本章で次に扱う **Template Method** パターン（第6節）と組み合わせて使われることが多いです。

---

## 現代風 ― Map と関数型でディスパッチ

`switch` で書いていた Simple Factory は、**`Map<String, Supplier<...>>`** で書き直すこともできます。

```java
import java.util.Map;
import java.util.function.Supplier;

public class PaymentFactory {

    private static final Map<String, Supplier<PaymentStrategy>> REGISTRY = Map.of(
        "CREDIT_CARD",   () -> new CreditCardPayment("dummy-api-key"),
        "BANK_TRANSFER", () -> new BankTransferPayment("DUMMY_BANK", "1234567"),
        "POINT",         () -> new PointPayment()
    );

    public static PaymentStrategy create(String method) {
        Supplier<PaymentStrategy> supplier = REGISTRY.get(method);
        if (supplier == null) {
            throw new IllegalArgumentException("未知の決済方法: " + method);
        }
        return supplier.get();
    }
}
```

`Map` から `Supplier` を引いて、`get()` で実体化します。
プラグイン風に**外から登録できる仕組み**にしたいときに、相性のよい書き方です。

---

## Factory のメリット

Factory に切り出すメリットを、まとめておきます。

| 利点 | どう活きるか |
|---|---|
| 利用側を**作り方から守る** | コンストラクタが変わっても利用側に波及しない |
| 種類による分岐を**1 か所に集める** | 似た分岐が散らばらない |
| **作る/使う**の責任分離 | 単一責任原則（第35章）に沿う |
| **テストしやすい** | テスト時には「テスト用の Factory」を差し込める |

---

## いつ使うか・使わなくてよいか

Factory が活きるのは、

- **生成に分岐が必要**（種類別）
- **コンストラクタが複雑**（引数が多い・段取りがある）
- **生成の責任を移したい**（ライブラリ提供側など）

といった場面です。

逆に、

- ふつうに `new Foo(...)` だけで済む
- 種類が**1 つしかない**

なら、わざわざ Factory を作るのは過剰です。
**コンストラクタを直接呼ぶ**ほうが、シンプルで読みやすいです。

---

## まとめ

- **Factory** は、オブジェクトの**作り方**を利用側から隠すパターン
- いちばんよく使うのは **Simple Factory**（`switch` ベース）
- 古典的な **Factory Method** は、サブクラスに作り方を任せる
- **`Map<String, Supplier<T>>`** で、登録ベースの Factory を書ける
- 生成にロジック・分岐があるときに使う。**単純なときは `new` でよい**

次は、有名だけれど扱いに注意が要る **Singleton** パターンを見ます。

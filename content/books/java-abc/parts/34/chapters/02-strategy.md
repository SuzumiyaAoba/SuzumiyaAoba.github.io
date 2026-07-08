---
title: Strategy パターン
llm: true
co-author: ["Claude Opus 4.7"]
---

## Strategy パターン

最初に取り上げるのは、**Strategy**（ストラテジー、戦略）パターンです。
振る舞いに関するパターンの中で、もっとも基本かつよく使うものです。

---

## 解きたい問題

たとえば、決済処理を書いていて、こんなコードに育ってしまったとします。

```java
public class PaymentService {
    public void pay(String method, int amount) {
        if (method.equals("CREDIT_CARD")) {
            // クレジットカードの処理を 30 行
            ...
        } else if (method.equals("BANK_TRANSFER")) {
            // 銀行振込の処理を 30 行
            ...
        } else if (method.equals("POINT")) {
            // ポイント決済の処理を 30 行
            ...
        }
    }
}
```

問題はこの形にあります。

- 決済方法が増えるたびに、`pay` メソッドが**さらに長くなる**
- ある決済方法を直すとき、**ほかの分岐を巻き込んで壊しそう**
- ユニットテストが**書きにくい**（全分岐をモックで通すのが大変）

`pay` ひとつに、**いろんな決済方法のロジックが詰め込まれて**いることが、根本の原因です。

---

## Strategy の考え方

Strategy パターンは、

> 「**取り替え可能なアルゴリズム**を、それぞれ別のクラスに切り出す」

というアイデアです。
インターフェース 1 つを切って、**各アルゴリズムを実装クラスにする**わけです。

```text line-numbers=false
PaymentService ──→ PaymentStrategy（interface）
                        ├── CreditCardPayment
                        ├── BankTransferPayment
                        └── PointPayment
```

このように分けてしまえば、

- 決済方法を増やすときは、**新しいクラスを足すだけ**
- 既存の方法を直しても、**ほかには影響しない**
- 個別のロジックは、**それぞれ単体でテスト**できる

という、変更に強い構造になります。

---

## 古典的な書き方

まず、インターフェースを切ります。

```java
public interface PaymentStrategy {
    void pay(int amount);
}
```

そして、それぞれの決済方法を実装します。

```java
public class CreditCardPayment implements PaymentStrategy {
    @Override
    public void pay(int amount) {
        System.out.println("クレジットカードで " + amount + " 円決済");
    }
}

public class BankTransferPayment implements PaymentStrategy {
    @Override
    public void pay(int amount) {
        System.out.println("銀行振込で " + amount + " 円決済");
    }
}

public class PointPayment implements PaymentStrategy {
    @Override
    public void pay(int amount) {
        System.out.println("ポイントで " + amount + " 円決済");
    }
}
```

呼び出し側は、**インターフェース型**で受け取って、`pay` を呼ぶだけ。

```java
public class PaymentService {
    private final PaymentStrategy strategy;

    public PaymentService(PaymentStrategy strategy) {
        this.strategy = strategy;
    }

    public void checkout(int amount) {
        strategy.pay(amount);
    }
}
```

使う側は、こうなります。

```java
PaymentService service = new PaymentService(new CreditCardPayment());
service.checkout(1000);
// → クレジットカードで 1000 円決済
```

`PaymentService` は、**どの決済方法かを知らない**まま動きます。
これが Strategy の真骨頂です。

---

## 現代風の書き方 ― ラムダ式と関数型インターフェース

`PaymentStrategy` は、メソッドが 1 つだけの**関数型インターフェース**（第22章）です。
ということは、実装クラスを 3 つも書かずに、**ラムダ式で直接渡せる**のです。

```java
PaymentService card = new PaymentService(
    amount -> System.out.println("クレジットカードで " + amount + " 円決済"));
PaymentService bank = new PaymentService(
    amount -> System.out.println("銀行振込で " + amount + " 円決済"));
PaymentService point = new PaymentService(
    amount -> System.out.println("ポイントで " + amount + " 円決済"));

card.checkout(1000);   // クレジットカードで 1000 円決済
bank.checkout(2000);   // 銀行振込で 2000 円決済
```

クラスを 3 つ書かずに、**ラムダ式 3 行**で同じ構造が組めました。

ちなみに、`PaymentStrategy` を新たに作らずに、標準の `java.util.function.IntConsumer`（`int` を受け取って `void` を返す）でも書けます。

```java
public class PaymentService {
    private final IntConsumer strategy;   // 標準の関数型インタフェース

    public PaymentService(IntConsumer strategy) {
        this.strategy = strategy;
    }

    public void checkout(int amount) {
        strategy.accept(amount);
    }
}
```

標準の関数型インターフェース（`Function`・`Consumer`・`Supplier`・`Predicate` ほか）でカバーできる場合は、わざわざ専用の `interface` を作らなくてもよいことが多いです。

---

## どこまでパターン化するか

ラムダで済むなら、わざわざクラスを書く必要はないか?
そうとも限りません。次のような場合は、**クラスにしたほうが読みやすい**です。

- 各アルゴリズムが**内部に状態を持つ**（ポイント残高・APIキーなど）
- ロジックが**長く**、ラムダ式の中に書くと読みにくい
- それぞれに**ユニットテスト**を書きたい

このように、**「データと振る舞いがセット」**ならクラスにし、**「振る舞いだけ」**ならラムダにする ―― これがいまの Java での選び方です。

---

## いつ Strategy を使うか

「**if-else で振る舞いを切り替えている**」コードを見たら、Strategy の候補です。

```java
// △ 分岐が増えるたびに pay の中が肥える
if (method.equals("CREDIT_CARD")) { ... }
else if (method.equals("BANK_TRANSFER")) { ... }
```

を、

```java
// ◯ 分岐をクラス（or ラムダ）として持つ
PaymentStrategy strategy = chooseStrategy(method);
strategy.pay(amount);
```

に直します。

ただし、分岐が**2〜3個で、もう増えない**ことが分かっているなら、無理に Strategy 化する必要はありません。
**「将来も増えそうか」**で判断します。

---

## まとめ

- **Strategy** は、振る舞いを**取り替え可能な部品**として切り出すパターン
- インターフェースを切り、それぞれの振る舞いを**実装クラス**にする
- 現代の Java では、メソッド 1 つの関数型インターフェースなら **ラムダ式で済む**
- 状態を持つ・長い・テストしたい場合は、クラスとして書く
- **`if-else` で振る舞いを切り替えている**コードは、Strategy 化の候補

次の節では、**Factory** パターン ― オブジェクトの**作り方**を整理するパターンを見ます。

---
title: 開放閉鎖原則（OCP）
llm: true
---

## 開放閉鎖原則（OCP）

**Open/Closed Principle**（OCP、開放閉鎖原則）は、

> **「拡張に対しては開いていて、修正に対しては閉じている」**

という、ちょっと不思議な言い回しの原則です。

これだけだと意味が分かりにくいので、噛み砕いて言い直します。

> **「機能を追加するときに、既存のコードを書き換えなくて済むようにしよう」**

これが OCP の心です。

---

## なぜ「既存のコードを書き換えたくない」のか

既存のコードを書き換えると、

- それを使っている**ほかの場所が壊れる**かもしれない
- いままで動いていた**テストが落ちる**かもしれない
- レビューが**重くなる**

といった副作用があります。
**「機能を追加するときは、新しいコードを足すだけ、既存は触らない」** ―― これが理想です。

OCP は、その理想を実現するための原則です。

---

## ダメな例 ― 種類を追加するたびに `if` が増える

第34章の Strategy パターンで見たコードを、もう一度見ます。

```java
public class PaymentService {
    public void pay(String method, int amount) {
        if (method.equals("CREDIT_CARD")) {
            // クレジットカードの処理
        } else if (method.equals("BANK_TRANSFER")) {
            // 銀行振込の処理
        }
        // ← 新しい決済方法を追加したい
    }
}
```

新しい決済方法（たとえば「電子マネー」）を追加するためには、**`pay` メソッドを書き換える**必要があります。
これは、

- 拡張に対しては **閉じている**（新しい振る舞いを入れにくい）
- 修正には **開いている**（毎回書き換える）

という、**OCP に正反対**な状態です。

---

## OCP に従う ― インタフェースと多態を使う

第34章で見たとおり、Strategy パターンで書き換えると、

```java
public interface PaymentStrategy {
    void pay(int amount);
}

public class CreditCardPayment implements PaymentStrategy { ... }
public class BankTransferPayment implements PaymentStrategy { ... }
public class ElectronicMoneyPayment implements PaymentStrategy { ... }  // 新規追加

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

`ElectronicMoneyPayment` を追加するときに、`PaymentService` の中は**一切触らなくて済む**ようになりました。
これが、**「拡張に開き、修正に閉じる」**ということです。

---

## 多態（ポリモーフィズム）が、OCP の核

第15章で学んだポリモーフィズム ―― 「**同じ呼び出しが、相手によって違う動きをする**」 ―― が、OCP を支える技術です。

```java
PaymentStrategy strategy = ...;
strategy.pay(amount);          // 相手によって違う処理になる
```

`strategy.pay(amount)` を呼ぶときに、相手が `CreditCardPayment` だろうが `ElectronicMoneyPayment` だろうが、**呼び出し側は知らないまま**でかまわない、というのが多態のおかげです。

つまり、

| | |
|---|---|
| **多態を使う側**（PaymentService） | 修正に**閉じる** |
| **多態を実装する側**（XxxPayment 群） | 拡張に**開く** |

という形が、自然に実現できます。

---

## OCP と他のパターンの関係

OCP は、第34章で見たほとんどのパターンの根っこにある考えです。

- **Strategy** … 振る舞いの拡張に開き、利用側を修正に閉じる
- **Factory Method** … 生成の拡張に開き、フレームワーク本体を修正に閉じる
- **Observer** … 観察者の追加に開き、Subject を修正に閉じる
- **Template Method** … ステップの拡張に開き、流れを修正に閉じる

逆に言えば、**OCP に従いたい**から、これらのパターンを使うわけです。

---

## やりすぎ注意 ― 想定しない拡張のために interface を切らない

「将来、種類が増えるかも」と言って、**今は使わない `interface`** を切るのはアンチパターンです。

```java
// △ いまは実装が1つしかないのに、interface を切る
interface PaymentStrategy {
    void pay(int amount);
}
class CreditCardPayment implements PaymentStrategy { ... }
// （他に実装クラスがない）
```

第34章でも触れましたが、

- 実装が **1 つしかない**
- いま現在、**追加の予定がない**

なら、`interface` は要りません。**素朴なクラスで十分**です。

OCP は「**必要になったときに**、修正なしで拡張できる構造にしよう」という原則であって、
**「想像上の拡張のために前もって複雑にしておけ」**ではない、ということです。

---

## 「変わるところ vs 変わらないところ」の見極め

OCP を実践するうえで、いちばん大事なのは、

> **「変わるところ」と「変わらないところ」を見抜く**

ということです。

`PaymentService` の例なら、

- **変わらないところ** … 「決済の流れ（戦略を実行する）」
- **変わるところ** … 「具体的にどう決済するか」

を分けたわけです。

別の例で言えば、

| 場面 | 変わらないところ | 変わるところ |
|---|---|---|
| レポート出力 | 「集めて、整形して、出力する」流れ | フォーマット（JSON/CSV/HTML） |
| 通知送信 | 「内容を作って、送信する」流れ | 送信手段（メール / Slack / SMS） |
| バリデーション | 「複数のチェックを順に走らせる」流れ | チェックの内容 |

「**変わるところを部品化して、流れと切り離す**」。これが、OCP の最終目標です。

---

## まとめ

- **OCP** は、「**拡張に開き、修正に閉じる**」原則
- 種類を増やすたびに `if` が増えるコードは、OCP を破っている
- **インタフェース + 多態** で、利用側を**修正なし**にできる
- 第34章の多くのパターンは、OCP を実現する手段
- **「想像上の拡張」**で、いまの設計を複雑にしない
- **「変わるところ」と「変わらないところ」**を見抜くのが鍵

次の節は、継承を使うときに気をつけたい **LSP** ― リスコフの置換原則です。

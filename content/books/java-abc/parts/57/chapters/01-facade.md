---
title: Facade パターン
llm: true
co-author: ["Claude Opus 4.7"]
---

## Facade パターン

**Facade**（正面玄関）パターンは、複雑な内部システムを **1 つの簡素な窓口**にまとめるパターンです。
呼び出し側は、その窓口だけを知っていればよくなります。

---

## 解きたい問題

注文を完了させる、という操作を考えます。内部では、

- 在庫の引き当て
- 支払いの処理
- 配送伝票の発行
- 確認メールの送信

という 4 つの作業が必要です。
これを、呼び出し側に**全部書かせる**と、こうなります。

```java
// 呼び出し側がサブシステムを全部知っている
inventory.reserve(order);
payment.charge(order);
shipping.createLabel(order);
mailer.sendConfirmation(order);
```

問題は、

- 呼び出し側が**手順をすべて知っている**ことになる
- 順番を間違える・抜け漏れが起こる
- 内部を変更すると、**呼び出し側も全部書き直し**

になることです。
**この一連の手順に、ひとつの名前**を付けて、内部の詳細を隠したい ―― これが Facade です。

---

## 実装例 ― サブシステムを束ねる

Facade は、内部のクラスたちを**まとめて使う**だけのシンプルなクラスです。

```java
public class OrderFacade {
    private final InventoryService inventory;
    private final PaymentService payment;
    private final ShippingService shipping;
    private final MailService mailer;

    public OrderFacade(
        InventoryService inventory,
        PaymentService payment,
        ShippingService shipping,
        MailService mailer) {
        this.inventory = inventory;
        this.payment = payment;
        this.shipping = shipping;
        this.mailer = mailer;
    }

    public void placeOrder(Order order) {
        inventory.reserve(order);
        payment.charge(order);
        shipping.createLabel(order);
        mailer.sendConfirmation(order);
    }
}
```

呼び出し側は、こうなります。

```java
OrderFacade facade = new OrderFacade(/* ... 4 つのサービス ... */);
facade.placeOrder(order);
```

「**`placeOrder` 1 行で済む**」ようになりました。
内部の手順が変わっても、呼び出し側は影響を受けません。

---

## Adapter との違い

両方とも「**間に挟むパターン**」なので、混同されがちです。
違いを 1 行で言うと、

- **Adapter**: 形（インターフェース）を**こちらに合わせる**
- **Facade**: 複雑な内部を**シンプルな窓口にまとめる**

| 観点 | Adapter | Facade |
|---|---|---|
| 目的 | 形を合わせる | 複雑さを隠す |
| 対象 | 1 つの既存クラス | 複数のクラス（サブシステム） |
| 出口 | 既存の形に変える | 新しい簡素な口を提供する |

Adapter は**変換**、Facade は**集約**と覚えるとよいでしょう。

---

## Spring の Service 層と Facade

Spring などの Web フレームワークで書く **`@Service`** クラスは、しばしば Facade として機能しています。

```java
@Service
public class OrderService {
    private final InventoryService inventory;
    private final PaymentService payment;
    private final ShippingService shipping;
    private final MailService mailer;

    @Transactional
    public void placeOrder(Order order) {
        inventory.reserve(order);
        payment.charge(order);
        shipping.createLabel(order);
        mailer.sendConfirmation(order);
    }
}
```

`@Controller`（呼び出し側）は、**`OrderService#placeOrder` 1 行を呼ぶだけ**で、注文の全フローを実行できます。
これは、まさに Facade パターンです。

「設計パターンを名乗らずに、自然と Facade が出ている」 ―― それぐらい、現代の Web 開発では当たり前の構造です。

---

## 使いどころと注意点

向く場面:

- 内部に**複数のクラス**があり、それを使う**典型的な手順**がある
- 呼び出し側に、内部構造を**知らせたくない**
- ライブラリの**簡易 API** を作る

注意点:

- Facade を増やしすぎると、**Facade だらけ**で見通しが悪くなる
- 「**便利メソッドを集めただけ**」のものは、Facade と呼べない（凝集度の意識が必要）
- Facade があるからといって、**サブシステムを必ず通すべき**とは限らない（高度な使い方は直接サブシステムを叩いてもよい）

---

## まとめ

- **Facade** は、複雑なサブシステムに**シンプルな入口**を 1 つ用意するパターン
- 「**Service 層**」「**Manager クラス**」など、現代でもよく出現する
- Adapter は**形を変える**、Facade は**まとめて隠す**
- 呼び出し側の**知るべきこと**を減らすのが目的

次の章では、**Decorator** ―― オブジェクトに**機能を着せ重ねる**パターンを見ます。

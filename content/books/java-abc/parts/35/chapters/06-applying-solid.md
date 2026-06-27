---
title: SOLID を実践する
llm: true
co-author: ["Claude Opus 4.7"]
---

## SOLID を実践する

ここまで学んだ 5 つの原則 ―― **SRP、OCP、LSP、ISP、DIP** を、ひとつのコードに当てはめて、段階的に改善していきましょう。

---

## 改善前のコード

題材は、こんなクラスです。

```java
public class OrderService {

    private MySqlConnection db;
    private SmtpMailClient smtp;

    public OrderService() {
        this.db = new MySqlConnection("jdbc:mysql://localhost/shop");
        this.smtp = new SmtpMailClient("smtp.example.com", 587);
    }

    public void placeOrder(long userId, List<Item> items, String paymentMethod) {
        // 1. ユーザーを取ってくる
        User user = db.query("SELECT * FROM users WHERE id = " + userId)
                      .as(User.class);

        // 2. 在庫を引き当てる
        for (Item item : items) {
            int stock = db.query("SELECT stock FROM products WHERE id = " + item.id())
                          .asInt();
            if (stock < item.quantity()) {
                throw new RuntimeException("在庫不足: " + item.id());
            }
        }

        // 3. 決済する
        int total = items.stream().mapToInt(Item::price).sum();
        if (paymentMethod.equals("CREDIT_CARD")) {
            // クレジットカードの処理
        } else if (paymentMethod.equals("BANK_TRANSFER")) {
            // 銀行振込の処理
        }

        // 4. 注文をDBに記録
        db.execute("INSERT INTO orders (user_id, total) VALUES ("
            + userId + ", " + total + ")");

        // 5. 確認メールを送る
        smtp.send(user.email(), "ご注文ありがとうございます", "...");
    }
}
```

これは、`OrderService` という名前ですが、

- DB との会話（SQL を直接書く）
- 決済方法の分岐
- メール送信

を、**ぜんぶ自分でやっています**。

---

## どの原則が破られているか?

整理すると、次のとおりです。

| 違反 | どこが？ |
|---|---|
| **SRP** | DB アクセス、決済、メール、注文ロジックが**一緒くた** |
| **OCP** | 決済方法を増やすには `if` を増やす必要がある |
| **DIP** | `MySqlConnection` と `SmtpMailClient` という**具象**に直接依存 |
| **ISP** | （いまは interface すらない） |
| **LSP** | （継承関係がないので、いまは関係なし） |

ひとつずつ直していきましょう。

---

## ステップ1 ― DIP に従って、抽象を挟む

まず、外部依存の**境界**を `interface` で切り出します。

```java
public interface OrderRepository {
    void save(Order order);
}

public interface UserRepository {
    Optional<User> findById(long id);
}

public interface StockRepository {
    int getStock(long productId);
    void decreaseStock(long productId, int amount);
}

public interface PaymentStrategy {
    void pay(int amount);
}

public interface MailSender {
    void send(String to, String subject, String body);
}
```

これで、上位の `OrderService` は、**`MySqlConnection` や `SmtpMailClient` を直接知らない**で済みます。

---

## ステップ2 ― SRP に従って、責務を分ける

`OrderService` の中身を、**責務ごとに分けます**。

```java
public class StockService {
    private final StockRepository stockRepository;

    public StockService(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }

    public void reserve(List<Item> items) {
        for (Item item : items) {
            int stock = stockRepository.getStock(item.id());
            if (stock < item.quantity()) {
                throw new InsufficientStockException(item.id());
            }
            stockRepository.decreaseStock(item.id(), item.quantity());
        }
    }
}

public class OrderConfirmationMailer {
    private final MailSender mailSender;

    public OrderConfirmationMailer(MailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendConfirmation(User user, Order order) {
        mailSender.send(user.email(),
            "ご注文ありがとうございます",
            "合計金額: " + order.total() + " 円");
    }
}
```

「在庫担当」と「メール送信担当」を、別クラスにしました。
これで、変更の理由が**1 つに絞られる**ようになりました。

---

## ステップ3 ― OCP に従って、決済を Strategy 化する

決済方法の分岐を、**Strategy パターン**（第34章）で書き直します。

```java
public interface PaymentStrategy {
    void pay(int amount);
}

public class CreditCardPayment implements PaymentStrategy {
    @Override public void pay(int amount) { /* ... */ }
}

public class BankTransferPayment implements PaymentStrategy {
    @Override public void pay(int amount) { /* ... */ }
}
```

利用側は、決済方法を**インターフェースで受け取る**。

```java
public class OrderService {
    public void placeOrder(long userId, List<Item> items, PaymentStrategy payment) {
        ...
        payment.pay(total);
        ...
    }
}
```

新しい決済方法が増えても、`OrderService` は触らなくて済みます ―― OCP を満たしました。

---

## ステップ4 ― DI（コンストラクタ注入）に整える

最終的な `OrderService` は、こうなります。

```java
public class OrderService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final StockService stockService;
    private final OrderConfirmationMailer mailer;

    public OrderService(
            UserRepository userRepository,
            OrderRepository orderRepository,
            StockService stockService,
            OrderConfirmationMailer mailer) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.stockService = stockService;
        this.mailer = mailer;
    }

    public void placeOrder(long userId, List<Item> items, PaymentStrategy payment) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException(userId));

        stockService.reserve(items);

        int total = items.stream().mapToInt(Item::price).sum();
        payment.pay(total);

        Order order = new Order(userId, items, total);
        orderRepository.save(order);

        mailer.sendConfirmation(user, order);
    }
}
```

最初のコードと比べてください。

- DB の SQL は**消えました**（具象に依存しない）
- 決済の `if` は**消えました**（Strategy で多態に）
- メール送信のコードは**消えました**（責務が `OrderConfirmationMailer` に移った）
- 100 行近かったメソッドが、**`placeOrder` 1 つで完結**するくらいに整理された

`OrderService` は、**「注文のビジネスロジックを記述する場所」**に純化されました。

---

## テストはどう変わるか

改善前は、`MySqlConnection` と `SmtpMailClient` を本物のまま使う必要があったため、ユニットテストが書けませんでした。

改善後は、すべてが interface 経由なので、**モック**（第33章）で差し替えてテストできます。

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock UserRepository userRepository;
    @Mock OrderRepository orderRepository;
    @Mock StockService stockService;
    @Mock OrderConfirmationMailer mailer;
    @Mock PaymentStrategy payment;

    @InjectMocks OrderService orderService;

    @Test
    void placesOrderSuccessfully() {
        User taro = new User(1L, "Taro", "taro@example.com");
        when(userRepository.findById(1L)).thenReturn(Optional.of(taro));

        orderService.placeOrder(1L, List.of(new Item(100L, 2, 500)), payment);

        verify(stockService).reserve(any());
        verify(payment).pay(1000);
        verify(orderRepository).save(any());
        verify(mailer).sendConfirmation(eq(taro), any());
    }
}
```

これは、SOLID に従った設計の**いちばんわかりやすい恩恵**です。

---

## 5 原則のチェックリスト

最終的な設計を、5 つの原則で点検します。

| 原則 | チェック |
|---|---|
| **SRP** | `OrderService` は注文の流れだけ。在庫・メール・決済は別クラス |
| **OCP** | 決済方法を追加しても、`OrderService` は触らない |
| **LSP** | 各 Strategy・各 Repository 実装は、契約を守る |
| **ISP** | `UserRepository` と `OrderRepository` は別。利用側ごとに分かれている |
| **DIP** | すべての依存は **interface（抽象）** で受け取る |

5 つすべてが、自然に満たされています。

---

## まとめ

- SOLID を意識すると、**SRP → DIP → OCP** の順で適用しやすい
- 最初に**外部依存に抽象（interface）**を切り、SRP で**責務**を分ける
- 分岐は **Strategy** で OCP に従わせる
- 最終形は、**コンストラクタ注入**で**全依存を抽象**として受け取るクラス
- 結果として、**テストが書けるようになる**のが、いちばんの効能

次の節は、SOLID を学んだ初心者がはまりやすい**よくあるつまずき**を整理します。

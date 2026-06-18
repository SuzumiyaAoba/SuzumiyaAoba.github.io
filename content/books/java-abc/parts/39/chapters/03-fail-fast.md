---
title: 早期失敗（Fail-Fast）
llm: true
---

## 早期失敗（Fail-Fast）

**Fail-Fast**（早期失敗）は、

> 「**問題が起きた時点で、すぐ例外を投げて止める**」

という設計のスタイルです。
直訳すると「速く失敗する」。
反対は、「**問題があっても、なんとか続行しようとする**」（ベストエフォート）です。

---

## なぜ「速く失敗する」のがよいのか

問題が起きてからしばらく**動き続けてしまう**と、原因究明が難しくなります。

```java
public void process(Order order) {
    String customerName = order.getCustomer().getName();  // ← order が null だったら、ここで NPE
    sendNotification(customerName);
    saveAuditLog(order);
    // 100 行先で、ようやく「あれ、データがおかしい」と気づく
}
```

`order` が `null` のまま渡されると、その場で NPE になりますが、**そこに至るまでの 100 行先**で気づくと、原因の特定に時間がかかります。

**Fail-Fast** は、**入口で確認して、おかしければすぐ止める**戦略です。

```java
public void process(Order order) {
    if (order == null) {
        throw new IllegalArgumentException("order must not be null");
    }
    if (order.getCustomer() == null) {
        throw new IllegalArgumentException("order.customer must not be null");
    }

    String customerName = order.getCustomer().getName();
    // ...
}
```

これで「`order` が `null` だ」という事実が、**メソッドの入口で、はっきり**わかります。

---

## `Objects.requireNonNull` ― お決まりの書き方

引数の `null` チェックは、Java 標準の `Objects.requireNonNull` を使うのが定番です。

```java
import java.util.Objects;

public OrderService(UserRepository userRepository, MailSender mailSender) {
    this.userRepository = Objects.requireNonNull(userRepository, "userRepository");
    this.mailSender = Objects.requireNonNull(mailSender, "mailSender");
}
```

`Objects.requireNonNull(x, "name")` は、

- `x` が `null` でなければ、そのまま `x` を返す
- `null` なら、`NullPointerException` を投げる（メッセージに `"name"` が入る）

これにより、

- インスタンスを作った瞬間に「**null は入っていない**」が保証される
- フィールドを使うときに、`null` チェックを忘れずに済む

という、**早期失敗の基本パターン**になります。

---

## メソッド冒頭の「ガード節」

引数チェックを、メソッドの**冒頭にまとめて書く**のが、Fail-Fast の定番パターンです。
これを **ガード節**（guard clause）と呼びます。

```java
public Order placeOrder(long userId, List<Item> items) {
    // ガード節
    if (userId <= 0) {
        throw new IllegalArgumentException("userId must be positive: " + userId);
    }
    if (items == null || items.isEmpty()) {
        throw new IllegalArgumentException("items must not be empty");
    }

    // 以下、本処理
    ...
}
```

ガード節があると、

- 本処理は「**事前条件はクリアされている**」前提で書ける
- 例外の発生場所が**メソッドの入口に集中**する
- ネストが浅く読める

入門段階から、この習慣をつけておくと、コードの質が上がります。

---

## 不正な状態への対処 ― `IllegalStateException`

引数ではなく、**オブジェクトの状態**が不正な場合は、`IllegalStateException` を使います。

```java
public class Order {
    private OrderStatus status;

    public void cancel() {
        if (status != OrderStatus.OPEN) {
            throw new IllegalStateException(
                "Order can only be cancelled when OPEN, but was " + status);
        }
        this.status = OrderStatus.CANCELLED;
    }
}
```

「**いまの状態では、この操作はできない**」を伝えるのが `IllegalStateException` です。
ドメイン例外として、もっと意味のある名前（`OrderAlreadyClosedException`）にしてもいいですが、簡単なものは標準例外で十分です。

---

## null を返さない ― `Optional<T>` を返す

メソッドの戻り値に **`null`** を使うのは、**「失敗を遅らせる**」設計です。
呼び出し側は、

- `null` チェックを書き忘れると **NPE** で落ちる
- 書いていても、コードが**ノイズ**だらけになる

ことになります。
第24章で学んだ **`Optional<T>`** を返すのが、現代的な書き方です。

```java
// △ null を返す
public User findByEmail(String email) {
    return em.find(User.class, email);   // 見つからないと null
}

// ◯ Optional を返す
public Optional<User> findByEmail(String email) {
    return Optional.ofNullable(em.find(User.class, email));
}
```

呼び出し側は、**`Optional` が空であること**を意識して扱うようになります。
NPE を**未然に防ぐ**しくみです。

---

## 防御的プログラミングとの違い

「早期失敗」と似た言葉に、**防御的プログラミング**（defensive programming）があります。
両者は、目的が違います。

| | Fail-Fast | 防御的プログラミング |
|---|---|---|
| 目的 | 問題を**早く露呈**させる | 想定外の入力でも**動き続ける** |
| アプローチ | おかしければ例外を投げる | デフォルト値で続行 |
| 向く場面 | バグの早期発見 | エンドユーザー向け UI、外部 API のクライアント |

両者は**対立するわけではなく**、層で使い分けます。

- **境界**（API の入口）では、防御的に振る舞う（不正な入力を**穏やかに**返す）
- **内部**では、Fail-Fast にする（バグの早期発見）

---

## いつ Fail-Fast にしないか?

Fail-Fast は強力ですが、無条件にやると困る場面もあります。

### 1. バッチ処理で 1 件失敗しても続行したい

```java
for (Order order : orders) {
    try {
        process(order);
    } catch (Exception e) {
        log.error("Order {} の処理に失敗", order.getId(), e);
    }
}
```

「**1 件失敗しても、残りは進めたい**」場合は、ループの中で **個別に catch** します。
ただし、失敗した内容は**必ずログに残す**こと。

### 2. リトライ可能なエラー

ネットワークエラーなど、**もう一度試したら成功するかもしれない**ものは、すぐ落とさずに**リトライ**します。

```java
for (int i = 0; i < 3; i++) {
    try {
        return httpClient.send(...);
    } catch (IOException e) {
        if (i == 2) throw new RuntimeException(e);
        Thread.sleep(1000L * (1 << i));   // 指数バックオフ
    }
}
```

業務システムでは、**Resilience4j** などのライブラリで宣言的にリトライを書くこともあります。

### 3. ユーザーに優しく見せたい

エンドユーザー向けのアプリは、

- 「**入力エラーですね、もう一度入力してください**」
- 「**サービスが混み合っています、しばらくしてから**」

のように、**穏やかなメッセージ**で返すことが求められます。
Fail-Fast でいきなり 500 を返すのではなく、**境界**できれいに整える（次節）のが定石です。

---

## まとめ

- **Fail-Fast**（早期失敗）は、問題を**入口で気づく**設計
- 入口でのチェックは、**ガード節**でまとめて書く
- `null` チェックは **`Objects.requireNonNull`** で
- 戻り値の `null` は **`Optional<T>`** で表現
- **不正な状態**には `IllegalStateException`
- 「内部は Fail-Fast、境界は穏やかに」が現実的なバランス
- バッチ・リトライ・UI 配慮では、Fail-Fast を**緩める**判断もある

次の節では、エラーを「**どこで捕まえ、どう記録するか**」の戦略を学びます。

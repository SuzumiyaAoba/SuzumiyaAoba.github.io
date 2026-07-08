---
title: トランザクション
llm: true
co-author: ["Claude Opus 4.7"]
---

## トランザクション

**トランザクション**（transaction、取引）は、データベースで**複数の操作をひとまとめにする**仕組みです。

たとえば「注文を登録する」処理は、

1. `orders` テーブルに INSERT
2. `order_items` テーブルに、商品ごとに INSERT
3. `stock` テーブルから在庫を引く UPDATE

の 3 操作を**ぜんぶまとめて**やる必要があります。
途中で 1 つでも失敗したら、**ぜんぶ巻き戻す**べきです。
「在庫だけ引かれて、注文は記録されていない」は、致命的なバグになります。

---

## トランザクションの 4 つの性質 ― ACID

トランザクションは、**ACID**（エイシッド）と呼ばれる 4 つの性質を持つように設計されます。

| 文字 | 性質 | 意味 |
|---|---|---|
| A | Atomicity（原子性） | 全部やる、または何もしない |
| C | Consistency（一貫性） | データベースが矛盾しない状態に保たれる |
| I | Isolation（独立性） | 同時に走る他のトランザクションの影響を受けない |
| D | Durability（永続性） | コミット後はディスクに残る |

これらをコードレベルで意識せずに済むように、JPA と Spring が支えてくれています。

---

## `@Transactional` ― ひとことで宣言する

Spring では、メソッドに **`@Transactional`** を付けるだけで、そのメソッド全体が**1 つのトランザクション**で実行されるようになります。

```java
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final StockRepository stockRepository;

    public OrderService(OrderRepository orderRepository, StockRepository stockRepository) {
        this.orderRepository = orderRepository;
        this.stockRepository = stockRepository;
    }

    @Transactional
    public void placeOrder(long userId, List<Item> items) {
        Order order = new Order(userId, items);
        orderRepository.save(order);

        for (Item item : items) {
            stockRepository.decreaseStock(item.productId(), item.quantity());
        }
    }
}
```

このメソッドは、

- 入口で **トランザクション開始**
- 出口（正常終了時）で **コミット**
- **例外が投げられたら ロールバック**

という流れになります。
これを手で書く（`connection.setAutoCommit(false); ... commit(); ... rollback();`）と地獄なので、`@Transactional` 1 行のありがたさは大きいです。

---

## どこに `@Transactional` を付けるか

慣習的に、**サービス層（`@Service`）**のメソッドに付けます。

- リポジトリ層に付けると、メソッド呼び出しごとに細かいトランザクションになり、複数操作のまとまりを担保できない
- コントローラ層（`@RestController`）に付けると、HTTP 処理とトランザクションが結びついて、責務がぶれる

```text line-numbers=false
@RestController     ← HTTP のことだけ
       ↓
@Service            ← @Transactional はここ
       ↓
@Repository         ← DB のことだけ
```

「ビジネスの 1 つの取引が、1 つのトランザクション」という原則が、自然と保たれます。

---

## どんなときにロールバックされるか

`@Transactional` のデフォルトでは、

| 投げられた例外 | 振る舞い |
|---|---|
| **非チェック例外**（`RuntimeException` 系） | ロールバック |
| **チェック例外**（`IOException` など） | **コミット**（!） |

これは Spring の独特な仕様で、引っかかりがちです。
チェック例外でもロールバックさせたいときは、

```java
@Transactional(rollbackFor = Exception.class)
public void placeOrder(...) { ... }
```

と、`rollbackFor` を明示します。
業務では、`@Transactional(rollbackFor = Exception.class)` を**デフォルトとして付ける**ことも多いです。

---

## 読み取り専用 ― `readOnly = true`

「データを変えない、取得だけのメソッド」には、`readOnly = true` を付けるとよいです。

```java
@Transactional(readOnly = true)
public List<Book> searchBooks(String keyword) {
    return bookRepository.findByTitleContaining(keyword);
}
```

メリットは、

- Hibernate の**変更追跡を省略**できる（性能向上）
- マスター・スレーブ構成のとき、**読み取り専用 DB に振り分ける**ヒントになる
- 「意図せず更新しない」という**意図の明示**になる

慣習として、読み取り専用のメソッドに `readOnly = true` を付けるプロジェクトも多いです。

---

## 永続コンテキストとフラッシュ

JPA には、**永続コンテキスト**（Persistence Context）という、ちょっと不思議な概念があります。
これは、トランザクションの間だけ存在する**「エンティティの一時保管庫」**です。

```java
@Transactional
public void modifyBook(long id) {
    Book book = bookRepository.findById(id).orElseThrow();
    book.setAuthor("新しい著者");
    // ↑ ここで save() を呼んでいないのに、ちゃんと DB が更新される
}
```

`bookRepository.save(book)` を呼んでいないのに、`author` が変わって DB に保存されます。
なぜか? それは、

1. `findById` で取ってきた `book` は、**永続コンテキストに登録**される
2. その中で**フィールドの変更が追跡**される
3. トランザクション終了時（コミット時）に、Hibernate が**自動で UPDATE 文を発行**する

という流れだからです。

これは、**便利なときと、わかりにくいとき**の両方があります。
入門段階では、

> 「**永続コンテキスト**にあるエンティティを書き換えると、**勝手に DB に反映される**」

と覚えておけば十分です。

---

## トランザクションの分離レベル

複数のトランザクションが**同時に**走るとき、互いをどれくらい遮断するかを **分離レベル**（isolation level）で指定できます。

| レベル | 意味 |
|---|---|
| `READ_UNCOMMITTED` | 未コミットの変更も見える（ダーティリード） |
| `READ_COMMITTED` | コミット済みのみ見える（多くの DB のデフォルト） |
| `REPEATABLE_READ` | 同じトランザクション内では、同じ読み取り結果を保証 |
| `SERIALIZABLE` | 完全にシリアル実行（性能と引き換え） |

```java
@Transactional(isolation = Isolation.SERIALIZABLE)
public void criticalOperation() { ... }
```

ふつうは、デフォルト（`READ_COMMITTED`）のまま使い、必要が出てから上げる、という方針で大丈夫です。
細かい話は、データベース設計の専門書を参照してください。

---

## 入れ子の `@Transactional`

メソッド A から、`@Transactional` 付きのメソッド B を呼ぶと、どうなるでしょうか?

```java
@Service
public class OrderService {

    @Transactional
    public void parent() {
        child();  // ← B
    }

    @Transactional
    public void child() {
        // ← ここは A のトランザクションの中?
    }
}
```

Spring の `@Transactional` のデフォルト（**`Propagation.REQUIRED`**）では、

- 既存のトランザクションがあれば、**それに参加**
- なければ、**新規に開始**

します。
つまり、`parent` の `@Transactional` が外側で開いたトランザクションを、`child` がそのまま使う、という形です。

別のトランザクションを開きたければ、`Propagation.REQUIRES_NEW` を指定します。

```java
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void child() { ... }
```

業務システムでは、ふつう **デフォルト（REQUIRED）**で進めて、特殊な要件があるときだけ変更します。

---

## `@Transactional` の落とし穴 ― 同じクラス内の呼び出し

`@Transactional` は、Spring が**プロキシ**で実現しています。
そのため、**同じクラスのメソッドを直接呼ぶと、`@Transactional` が効きません**。

```java
@Service
public class OrderService {

    public void parent() {
        this.child();   // ← @Transactional が効かない!
    }

    @Transactional
    public void child() { ... }
}
```

`this.child()` は、Spring のプロキシを通らず、生のメソッド呼び出しになるため、トランザクションが始まりません。

### 対処

- **別の Bean に切り出す**
- 親メソッドの方に `@Transactional` を付ける

これは、初心者が**何時間もはまる**典型的なトラップです。覚えておいてください。

---

## まとめ

- トランザクションは、**複数の操作をひとまとめ**にする仕組み
- **ACID**（原子性・一貫性・独立性・永続性）の 4 性質
- **`@Transactional`** をメソッドに付けるだけで、Spring が制御してくれる
- 場所は **`@Service` のメソッド**が定石
- デフォルトは「**非チェック例外でロールバック**」。チェック例外も含めたいなら `rollbackFor`
- 読み取り専用なら **`readOnly = true`** で性能向上
- 永続コンテキストの**変更追跡**で、`save` 呼び出しが省ける
- **同じクラスのメソッド呼び出し**では `@Transactional` が効かない

次の節は、JPA / Spring Data JPA で初心者がはまる**よくあるつまずき**を整理します。

---
title: ドメイン例外を設計する
llm: true
co-author: ["Claude Opus 4.7"]
---

## ドメイン例外を設計する

業務システムの中には、

- ユーザーが見つからない
- 在庫が足りない
- 同じ注文を二重に登録しようとした

といった、**業務的なエラー**がたくさんあります。
これらを、Java の例外で**型として表現**するのが、**ドメイン例外**（domain exception）の設計です。

---

## なぜ「ドメイン例外」を作るのか

ドメイン例外を作らずに、すべて `RuntimeException` や `IllegalStateException` で投げてしまうと、こんなコードになります。

```java
if (stock < quantity) {
    throw new RuntimeException("在庫不足: 商品" + productId);
}
```

これだと、

- 呼び出し側は **`catch (RuntimeException e)`** で大雑把に捕まえるしかない
- メッセージ文字列を `e.getMessage().contains("在庫")` のように**パース**する地獄
- 「在庫不足」と「DB エラー」を**区別できない**

困ります。

そこで、**業務エラーごとに、専用の例外クラス**を作ります。

```java
public class InsufficientStockException extends RuntimeException {
    private final long productId;
    private final int stock;
    private final int requested;

    public InsufficientStockException(long productId, int stock, int requested) {
        super("在庫不足: productId=%d, stock=%d, requested=%d"
              .formatted(productId, stock, requested));
        this.productId = productId;
        this.stock = stock;
        this.requested = requested;
    }

    public long getProductId() { return productId; }
    public int getStock() { return stock; }
    public int getRequested() { return requested; }
}
```

これがあると、

```java
try {
    orderService.placeOrder(...);
} catch (InsufficientStockException e) {
    // 在庫不足のときだけの処理
    notifyOutOfStock(e.getProductId());
}
```

と、**型で分岐**できるようになります。
メッセージ文字列に頼らない、**型安全**な業務エラー処理ができるわけです。

---

## ドメイン例外の構成要素

ドメイン例外クラスは、ふつう次の 4 つを意識して作ります。

### 1. 親クラス ― `RuntimeException` を継承

前節の方針どおり、非チェック例外として作ります。
さらに、ドメイン例外の**共通の親**を作っておくのが定番です。

```java
public abstract class DomainException extends RuntimeException {
    protected DomainException(String message) {
        super(message);
    }
    protected DomainException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

「すべての業務エラーは `DomainException` のサブクラス」とすると、

- 「業務エラーかどうか」を、`catch (DomainException e)` で**まとめて捕まえられる**
- インフラ系の `RuntimeException`（NPE など）と**区別**できる

ようになります。

### 2. メッセージ

人間が見て分かる説明。**第 1 引数**で `super(...)` に渡す。

### 3. 業務的なフィールド

「**何が悪かったか**」を表すデータを、フィールドに持たせます。
たとえば、`InsufficientStockException` なら、

- 商品 ID
- 現在の在庫数
- 要求された数量

など。これがあると、

- ログに**詳細**を出せる
- API レスポンスに**構造化された情報**を入れられる
- リカバリ処理で**業務的に活用**できる

### 4. 原因例外 ― `Throwable cause`

元になった例外があれば、`cause` で連鎖させます。

```java
throw new BookSaveException("...", originalSqlException);
```

これがないと、スタックトレースに**元の原因が出ません**。
ラップするなら、**必ず `cause` を渡す**。

---

## ドメイン例外の階層化

業務エラーが増えてくると、こんな階層を作ります。

```text line-numbers=false
DomainException
  ├── NotFoundException
  │     ├── BookNotFoundException
  │     └── UserNotFoundException
  ├── ConflictException
  │     ├── DuplicateBookException
  │     └── DuplicateOrderException
  └── BusinessRuleException
        ├── InsufficientStockException
        └── OrderClosedException
```

ポイントは、

- **中間の親クラス**（`NotFoundException`、`ConflictException`）に、**HTTP ステータスや業務分類**を持たせる
- 個別の例外は、**具体的な業務状況**を表す

ようにすることです。
これにより、第38章で書いた `@RestControllerAdvice` のような**集約ハンドラ**で、**親クラス単位の処理**ができるようになります。

```java
@ExceptionHandler(NotFoundException.class)
ResponseEntity<...> handleNotFound(NotFoundException e) {
    return ResponseEntity.status(404).body(...);
}

@ExceptionHandler(ConflictException.class)
ResponseEntity<...> handleConflict(ConflictException e) {
    return ResponseEntity.status(409).body(...);
}
```

新しい `Xxx404Exception` を追加しても、ハンドラを増やす必要がない ―― これが階層化のメリットです。

---

## エラーコードを持たせる

業務システムでは、エラーを「**コード**」で識別したいことがよくあります。

```java
public abstract class DomainException extends RuntimeException {
    public abstract String getCode();
    ...
}

public class InsufficientStockException extends BusinessRuleException {
    @Override
    public String getCode() {
        return "STOCK_INSUFFICIENT";
    }
}
```

クライアント（フロントエンド・モバイル）は、`code` を見て**多言語のメッセージ**や**動作の分岐**を組み立てられます。
レスポンスはこんな感じになります。

```json
{
  "status": 409,
  "code": "STOCK_INSUFFICIENT",
  "message": "在庫が不足しています",
  "details": {
    "productId": 100,
    "stock": 3,
    "requested": 10
  }
}
```

`code` を持つかどうかは、API の使われ方次第です。
**多言語対応・自動化されたクライアント**がある場合は、ほぼ必須になります。

---

## 業務的に「正しい入力」と「不正な入力」を分ける

ドメイン例外を設計するうえで、もうひとつ意識したいのが、

- **「形式が不正」**な入力（バリデーション）
- **「業務的に不正」**な入力（ドメインロジック）

の区別です。

| 種類 | 例 | 階層 | ステータス |
|---|---|---|---|
| 形式が不正 | 必須が空、数値が範囲外 | バリデーション層 | 400 |
| 業務的に不正 | 在庫不足、二重注文、期限切れ | ドメイン層 | 409 / 422 |

形式の不正は、**第38章のバリデーション**でカバーします。
業務的な不正は、**ドメイン例外**で表現します。
それぞれ、適切な HTTP ステータスを返すように設計します。

---

## ドメイン例外を投げる場所

ドメイン例外は、**サービス層**（`@Service`）から投げるのが定石です。

```java
@Service
public class OrderService {
    @Transactional
    public Order placeOrder(long userId, List<Item> items) {
        for (Item item : items) {
            int stock = stockRepository.getStock(item.productId());
            if (stock < item.quantity()) {
                throw new InsufficientStockException(
                    item.productId(), stock, item.quantity());
            }
        }
        ...
    }
}
```

リポジトリ層（`@Repository`）からは、**インフラ例外**（DB エラーなど）が、
コントローラ層（`@RestController`）では、**API のお作法**だけ書く ―― という分担にします。

---

## まとめ

- 業務エラーは、**ドメイン例外クラス**として型で表現する
- 共通の親クラス（`DomainException`）を作っておく
- 業務的に意味あるフィールド（ID、状態など）を持たせる
- **階層**（`NotFoundException`、`ConflictException`）でハンドラをまとめる
- **エラーコード**を持たせると、クライアント連携がしやすい
- 「**形式の不正**」と「**業務的な不正**」を区別する
- ドメイン例外は **`@Service` から投げる**のが定石

次の節は、**早期失敗（Fail-Fast）**の考え方を学びます。

---
title: CompletableFuture との使い分け
llm: true
---

## `CompletableFuture` との使い分け

Java 8 で導入された **`CompletableFuture`** は、非同期処理と並行処理の「**メインストリーム**」として長く使われてきました。
Java 25 の `StructuredTaskScope` と、両者をどう使い分けるか ―― この節では、その判断軸を整理します。

---

## `CompletableFuture` のおさらい

`CompletableFuture<T>` は、**非同期処理の結果を表す**型で、関数型のチェーンで合成できます。

```java
CompletableFuture<UserOrder> result = CompletableFuture.supplyAsync(() -> fetchUser(id))
    .thenCombine(
        CompletableFuture.supplyAsync(() -> fetchOrder(id)),
        (user, order) -> new UserOrder(user, order));

UserOrder uo = result.join();
```

特徴的なのは:

- **コールバックを連鎖**できる（`thenApply`、`thenCompose`、`thenCombine` …）
- **非ブロッキング**な合成ができる
- **`whenComplete`** で成功・失敗を 1 か所で扱える
- スレッドプールを `ForkJoinPool` などで**共有**する

---

## どこが違うか ―― 「実行の構造」が違う

両者の根本的な違いは、**「並行処理がどこで終わるか」**です。

| | `CompletableFuture` | `StructuredTaskScope` |
|---|---|---|
| 開始 | `supplyAsync()` で即 | `scope.fork()` でスコープに紐づく |
| 結果取得 | `join()` または非同期チェーン | `scope.join()` + `task.get()` |
| 結果が出るのは | **どこでも**（呼び出し元から見えない場所でも） | **スコープを抜けるとき** |
| ライフサイクル | スコープがない（自由） | **スコープに閉じる** |
| キャンセル伝搬 | 自分で `cancel()` を呼ぶ | **自動** |
| 文脈伝達 | `ThreadLocal` を別途設計 | `ScopedValue` で**自動継承** |
| 制御フロー | 関数型のチェーン | **ふつうの try-catch** |

ひとことで言えば、

- **`CompletableFuture`** は「**非同期処理を関数の値として合成する**」道具
- **`StructuredTaskScope`** は「**並行処理をブロックの構造で束ねる**」道具

似て見えますが、目指している抽象が違うのです。

---

## いつ、どっちを使うか

### `StructuredTaskScope` のほうが向くケース

- **1 つのメソッドで完結する並行処理**（リクエスト処理の中で 2〜3 個の依存サービスを呼ぶ等）
- **エラー時に全部キャンセル**したい
- **入れ子の try-catch** で書きたい
- 仮想スレッドが使える Java 21 以降

```java
// 例: GraphQL のリゾルバ
record UserDetail(User user, List<Order> orders, List<Review> reviews) {}

UserDetail loadUserDetail(long id) throws Exception {
    try (var scope = StructuredTaskScope.open()) {
        var u = scope.fork(() -> userService.find(id));
        var o = scope.fork(() -> orderService.findByUser(id));
        var r = scope.fork(() -> reviewService.findByUser(id));
        scope.join();
        return new UserDetail(u.get(), o.get(), r.get());
    }
}
```

### `CompletableFuture` のほうが向くケース

- **メソッドの境界を越えて**結果を渡したい（非同期 API として公開する）
- **イベント駆動的な合成**（A が終わったら B、その後 C など、長いチェーン）
- **コールバック**で書きたい
- **既存の `CompletableFuture` ベースのライブラリ**（HTTP クライアント、メッセージング）と統合する

```java
// 例: 非同期 API の公開
public CompletableFuture<UserDetail> loadUserDetailAsync(long id) {
    return userService.findAsync(id)
        .thenCombine(orderService.findByUserAsync(id),
                     (user, orders) -> Map.entry(user, orders))
        .thenCombine(reviewService.findByUserAsync(id),
                     (entry, reviews) -> new UserDetail(entry.getKey(), entry.getValue(), reviews));
}
```

---

## 「**ブロッキング vs 非ブロッキング**」 ―― 仮想スレッド後の景色

`CompletableFuture` の登場時、世の中は「**スレッドを減らすために非同期**」 という流れでした。
1 スレッドで多くのリクエストをさばくためには、ブロックしないチェーンが必要だった、ということです。

ところが、仮想スレッドが入ったあと、この前提が**変わりました**。

> 「ブロッキングしても、仮想スレッドなら**安い**。だから、ブロッキングなコードでよい」

`StructuredTaskScope.fork(...)` で**ふつうにブロックする処理**を書いても、内部の仮想スレッドが効率よく動きます。
`thenCompose` の連鎖で頭をひねるより、ふつうの try-catch で書けるほうが、**読みやすい**。

これが、Java 25 で `StructuredTaskScope` が出てきた背景です。
**「読みやすさのために、また同期的なコードに戻る**」 ―― ちょっと懐古的ですが、これが現代の Java の答えです。

---

## 移行戦略 ― 既存の `CompletableFuture` コードをどうするか

「**全部 `StructuredTaskScope` に書き換える**」は不要です。
むしろ、両者の役割を**分けて**整理するのが現実的な指針です。

| レイヤ | 推奨 |
|---|---|
| **公開 API**（ライブラリ・サービス境界） | `CompletableFuture` のままでよい（呼び出し側の柔軟性のため） |
| **内部実装**（メソッド内の並行処理） | `StructuredTaskScope` に移行する価値あり |
| **イベント駆動・コールバック中心** | `CompletableFuture` のまま |
| **リクエスト処理の合成** | `StructuredTaskScope` のほうが**読みやすい** |

「公開 API は `CompletableFuture`、実装は `StructuredTaskScope`」 ―― このバランスで運用するチームも増えてきています。

---

## まとめると

- `CompletableFuture` は「**非同期処理を値として合成**」する道具
- `StructuredTaskScope` は「**並行処理をブロック構造で束ねる**」道具
- **仮想スレッド以後**は、ブロッキングコードのコストが安く、構造化のほうが**読みやすい**
- 使い分けのコツ:
  - **メソッド内で完結 → `StructuredTaskScope`**
  - **境界を越える非同期 API → `CompletableFuture`**
- 全部書き換える必要はない。**役割で分けて共存**させる

次の節では、`StructuredTaskScope` と `ScopedValue` 周辺の **よくあるつまずき**を整理します。

---
title: はじめに ― この章で学ぶこと
llm: true
---

## はじめに ― この章で学ぶこと

第29章で**仮想スレッド**（Virtual Threads）、第43章で**メモリモデル**を学びました。
ここまでで、Java の並行処理を**安全に**書くための、土台は整いました。

第44章で扱うのは、その上に立つ **新しい設計のかたち**です。
キーワードは 2 つ:

- **構造化並行性**（Structured Concurrency） ―― `StructuredTaskScope`
- **スコープ付き値**（Scoped Values） ―― `ScopedValue`

これらは、これまで Java の並行処理で**つらかった部分** ―― エラーハンドリング、キャンセル、文脈伝達 ―― を、**入れ子の構造**として整理し直すものです。

---

## 「並行処理が散らかる」現象

第29章で見た `ExecutorService` には、便利な反面、**コード構造が崩れる**問題がありました。

```java
ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

Future<User> userFuture = executor.submit(() -> fetchUser(id));
Future<Order> orderFuture = executor.submit(() -> fetchOrder(id));

User user = userFuture.get();      // ここで待つ
Order order = orderFuture.get();   // ここで待つ
return combine(user, order);
```

このコード、見た目はシンプルですが、いくつもの問題を抱えています。

- **片方がエラーになっても、もう片方は走り続ける**（リソースの無駄）
- **タイムアウト**を実装するのが面倒
- **キャンセル**の伝搬がうまくできない
- `executor.shutdown()` を呼び忘れて、リソースリーク

そして何より、構造上、**並行処理だけ「制御フローのスコープが消える**」のです。
ふつうのメソッドは「**呼ぶ → 戻る**」の入れ子構造で、エラーやリソースが**スコープ単位で**管理されます。
ですが、`Future.get()` を介した並行処理は、「**いつ終わるか、誰の責任で片付けるか**」が散らかってしまいます。

---

## 「構造化」とは

**構造化並行性**は、この問題を**ふつうの制御フローと同じ「入れ子構造」**で解決します。

> **すべての並行サブタスクは、開始したスコープの中で終わる。**

`try-with-resources` のように、スコープを開いて、その中で並行タスクを fork（生やす）し、スコープを閉じるとき**全部の片付けが終わっている** ―― この約束だけで、構造が単純になります。

```java
try (var scope = StructuredTaskScope.open()) {
    var userTask = scope.fork(() -> fetchUser(id));
    var orderTask = scope.fork(() -> fetchOrder(id));
    scope.join();   // 全タスクの完了 or 失敗を待つ
    return combine(userTask.get(), orderTask.get());
}
// ↑ スコープを抜けた時点で、全タスクが**確実に**片付いている
```

並行タスクが、**メソッドのスコープと同じ構造**を持つようになりました。
これが構造化並行性の見た目です。

> **重要: Java 25 では preview**
>
> `StructuredTaskScope`（JEP 505）は、Java 25 でも依然として **5 回目のプレビュー**です。
> 本番投入はもう少し先になりますが、**API の形はかなり固まってきました**。
> 本書では、起動時に `--enable-preview` を付ける前提で説明します。

---

## 「文脈の伝達」とは

もう 1 つの主役、**`ScopedValue`**（Java 25 で正式機能）は、**文脈（context）の伝達**の問題を解決します。

これまで、リクエスト ID やユーザー情報を、ワーカースレッドに渡すには `ThreadLocal` を使ってきました。
ですが、`ThreadLocal` には、

- スレッドが変わると引き継がれない（**`InheritableThreadLocal`** はあるが、仮想スレッド大量生成と相性が悪い）
- 書き換え可能なので、**いつ・誰が変えたか**追えない
- 第43章で見たとおり、**`remove()` を忘れるとリーク**

という弱点がありました。
`ScopedValue` は、**不変・スコープ限定・自動掃除**で、これらを解決します。

```java
ScopedValue<String> USER = ScopedValue.newInstance();

ScopedValue.where(USER, "alice").run(() -> {
    System.out.println(USER.get());   // "alice"
    doWork();
});
// スコープを抜けた瞬間、USER の値は消える
```

---

## この章で学ぶこと

第44章は、次の7つの節で構成されています。

| 節 | タイトル | 内容 |
|---|---|---|
| 1 | 構造化並行性 ― 並行処理を構造化する | なぜ構造化が必要か、`Future` の散らかり |
| 2 | StructuredTaskScope の基本 | open・fork・join のリズム |
| 3 | ShutdownOnFailure と ShutdownOnSuccess | 失敗時／成功時のポリシー |
| 4 | ScopedValue ― スレッド境界を超える値 | ThreadLocal の正統な後継 |
| 5 | CompletableFuture との使い分け | 既存資産との折り合い |
| 6 | よくあるつまずき | プレビュー API・キャンセル伝搬・例外の扱い |

前半（1〜3節）で、**StructuredTaskScope** をひととおり使えるようにします。
中盤（4節）で、**ScopedValue** の使い方を覚えます。
後半（5〜6節）で、**既存コードからの移行**と落とし穴を整理します。

---

## この章を読み終えると

第44章を読み終えるころには、次のことができるようになっています。

- 構造化並行性が、なぜ「**入れ子構造**」を取り戻すかを説明できる
- `StructuredTaskScope` の **open → fork → join → close** のリズムが書ける
- `ShutdownOnFailure` / `ShutdownOnSuccess` を、ユースケースに合わせて選べる
- `ScopedValue` で、リクエスト ID などの**文脈を安全に**伝達できる
- `CompletableFuture` との**棲み分け**を判断できる
- プレビュー機能を使うときの **`--enable-preview`** の扱いがわかる

それでは、最初の節「**構造化並行性 ― 並行処理を構造化する**」から始めましょう。

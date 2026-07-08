---
title: 構造化並行性 ― 並行処理を構造化する
llm: true
---

## 構造化並行性 ― 並行処理を構造化する

「**構造化**」と聞くと、構造化プログラミング（goto を使わず、if・while・関数で組み立てる）を思い出す方も多いでしょう。
**構造化並行性**は、同じ発想を**並行処理に**持ち込んだものです[^jep505-structured-concurrency]。

---

## ふつうの制御フローには「構造」がある

ふつうのメソッド呼び出しは、**入れ子構造**を持ちます。

```text line-numbers=false
caller()
  ├── work()
  │     ├── stepA()
  │     └── stepB()
  └── cleanup()
```

ここで、

- `stepA` と `stepB` は、`work()` の中で**始まり**、`work()` の中で**終わる**
- `work()` の中で例外が起きれば、`caller()` まで**自然に伝搬**する
- リソースは、`try-with-resources` で**スコープが閉じれば**確実に閉じる

つまり「**始まり**」と「**終わり**」が、コードの構造と一致しています。
これが、ふつうのコードが読みやすい根本理由です。

---

## ところが、並行処理ではこの構造が崩れる

第29章で見た `ExecutorService` のコードを思い出してみます。

```java
ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
try {
    Future<User> userF = executor.submit(() -> fetchUser(id));
    Future<Order> orderF = executor.submit(() -> fetchOrder(id));
    User user = userF.get();
    Order order = orderF.get();
    return combine(user, order);
} finally {
    executor.shutdown();
}
```

このコード、見た目はそれっぽいのですが、構造が**ところどころ崩れて**います。

### 問題1: タスクの「**終わり**」がスコープと一致しない

`executor.submit(...)` で `fetchUser` を開始しても、その**終わり**は

- `userF.get()` で待つまで分からない
- `executor.shutdown()` で待つまで分からない
- `executor.close()` で待つまで分からない

など、複数の経路で発生します。
スコープを抜けた瞬間に「全タスクが終わっている」保証はありません。

### 問題2: 片方が失敗しても、もう片方は走り続ける

`fetchUser` がエラーになっても、`fetchOrder` は**走り続けます**。
`userF.get()` で例外が飛んで finally に行きますが、その時点では `fetchOrder` はまだ動いていて、リソースを使い続けます。
`executor.shutdown()` ではすぐ止まらず、`shutdownNow()` でも仮想スレッド側で割り込みを受け取って終了するまで待つ必要があります。

### 問題3: 例外がきちんと伝わらない

`Future.get()` は **`ExecutionException`** でラップして例外を投げます。
本当の原因例外は `e.getCause()` で 1 段降りる必要があり、業務例外の型を判別するロジックが複雑になります。

### 問題4: 「**全部完了 or どれか 1 つ完了**」の判断が手作業

「**両方終わったら次へ**」「**どれか 1 つ成功すれば終わり**」「**1 つでも失敗したら全部中止**」 ―― こうしたポリシーは、すべて自前で書く必要があります。

---

## 「構造化」の中心ルール

**構造化並行性**は、これらをすべて「**1 つのルール**」で解決します。

> **すべての子タスクは、それを開始したスコープが終わるときには、必ず終わっている。**

「**スコープが終わる**」とは、`try-with-resources` のブロックを抜けることです。
このルールを徹底すると、

- スコープを抜けたら、子タスクの**走り残し**がない（リソースリークなし）
- 失敗時のキャンセル**伝搬**が、スコープ単位でできる
- 例外は、ふつうのメソッド呼び出しと同じく**スコープの呼び出し元へ**飛ぶ

そして、**入れ子のスコープ**を作れば、ふつうの関数呼び出しと同じ「**木構造**」が並行処理にも蘇ります。

---

## まずはイメージを見る

`StructuredTaskScope` を使って、上のコードを書き直すと、こうなります（Java 25・プレビュー）。

```java
import java.util.concurrent.StructuredTaskScope;

User getUserWithOrder(long id) throws Exception {
    try (var scope = StructuredTaskScope.open()) {
        var userTask  = scope.fork(() -> fetchUser(id));
        var orderTask = scope.fork(() -> fetchOrder(id));
        scope.join();    // 全タスク完了を待つ
        return combine(userTask.get(), orderTask.get());
    }
    // ここを抜けた時点で、両タスクは確実に完了している
}
```

注目してほしい点を 3 つ。

1. **`try-with-resources`** で、スコープを開く
2. **`scope.fork(...)`** で、並行タスクを生やす（戻り値は `Subtask<T>`）
3. **`scope.join()`** で、全タスクの完了を待つ

これだけです。
タスクの開始・待ち合わせ・後片付けが、**1 つのブロックの中**に閉じています。

---

## 構造化のうれしさ ― エラー時の挙動

`fetchUser` がエラーになったらどうなるでしょうか?

- `userTask.get()` を呼ぶと、その**例外**がそのまま投げられる
- スコープを抜けるとき、まだ走っている `orderTask` は **自動的にキャンセル**される
- `try-with-resources` の `close()` で、全タスクの終了が確認される

つまり、**ふつうの try-catch と同じノリ**で、並行処理のエラーを書けます。
これが、`StructuredTaskScope` が「**構造化**」と呼ばれる理由です。

> **キャンセルは「割り込み」で行われる**
>
> StructuredTaskScope のキャンセルは、内部で `Thread.interrupt()` を使います。
> 第43章で見たとおり、**ブロッキング操作**（`Thread.sleep`、I/O 待ち）は `InterruptedException` で抜けます。
> **CPU 計算ループ**は、コード側で `Thread.currentThread().isInterrupted()` を時々チェックしないと、止まらないことに注意してください。

---

## 比べてみる

`ExecutorService` と `StructuredTaskScope` の主な違いを表にまとめます。

| 項目 | `ExecutorService` | `StructuredTaskScope` |
|---|---|---|
| 開始 | `executor.submit(...)` | `scope.fork(...)` |
| 待ち合わせ | `Future.get()` を個別に | `scope.join()` で一括 |
| エラー伝搬 | `ExecutionException` ラップ | サブタスクの例外を**そのまま**取得 |
| キャンセル伝搬 | 自分で書く | **自動** |
| 後始末 | `shutdown()` を忘れず | **`try-with-resources`** |
| スコープ | スコープ外でも生存する Future | スコープ内に**閉じる** |
| ライフサイクル | 長寿（プール再利用） | **短寿命**（リクエストごとに作って捨てる） |

`ExecutorService` は、**長期間の固定スレッドプール**を管理するための仕組みでした。
`StructuredTaskScope` は、**短い単位**（リクエスト、トランザクション）の並行処理を構造化するための仕組みです。

両者は競合するものではなく、**目的が違う**と覚えましょう。

---

## 仮想スレッドとの相性

`StructuredTaskScope` は、内部で**仮想スレッド**を使います。
そのため、

- 1 リクエストあたり数百のサブタスクを fork しても、**スレッドプール枯渇**がない
- 待ち系（DB、HTTP、メッセージング）の I/O が**安価に並列化**できる

つまり「**広く・浅く並列化する**」用途と、特に相性がよいです。
たとえば、

- マイクロサービスで、複数の下流 API を**並列に呼ぶ**
- 大量の小さい更新を**並列にトランザクション化**する
- レポートで、複数の DB クエリを**並列に走らせる**

といった用途に、自然に使えます。

---

## まとめると

- 並行処理は、`ExecutorService` + `Future` だと **構造が崩れる**
- 構造化並行性のルール: **「すべての子タスクは、スコープが終わるときには、必ず終わっている」**
- `StructuredTaskScope` は、`try-with-resources` で並行処理を**入れ子構造**に戻す
- エラー伝搬・キャンセル・後始末が**自動**で行われる
- 仮想スレッドと組み合わせて、**広く・浅く**の並列化に向く
- Java 25 でも依然として **preview**（`--enable-preview` 必要）

次の節では、`open` / `fork` / `join` の**基本のリズム**を、もう少し細かく見ていきます。

[^jep505-structured-concurrency]: JEP 505: Structured Concurrency (Fifth Preview), [https://openjdk.org/jeps/505](<https://openjdk.org/jeps/505>)。Java 25 ではプレビュー段階。`StructuredTaskScope` は仮想スレッド（JEP 444）と組み合わせて使う前提で設計され、過去のインキュベーションは JEP 428、JEP 437、JEP 453、JEP 462、JEP 480、JEP 499 を経た。

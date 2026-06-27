---
title: ShutdownOnFailure と ShutdownOnSuccess
llm: true
---

## `ShutdownOnFailure` と `ShutdownOnSuccess`

`StructuredTaskScope` の**ポリシー**は、Java 25 では **`Joiner`** という仕組みで指定します。
Java 21 のプレビューでは、`StructuredTaskScope.ShutdownOnFailure` / `ShutdownOnSuccess` のサブクラスとして提供されていましたが、**API が刷新**されて、より柔軟になりました。

この節では、Java 25 時点での代表的な 4 つのポリシーを、ユースケースとともに見ていきます。

---

## ポリシー1: 全部成功で進む（`allSuccessfulOrThrow`）

**1 つでも失敗したら全停止、全部成功したら次へ進む**ポリシー。
これが**最も使う場面が多い**ポリシーで、`StructuredTaskScope.open()` の既定にも対応します。

```java
import java.util.concurrent.StructuredTaskScope;
import java.util.concurrent.StructuredTaskScope.Joiner;

record UserOrder(User user, Order order) {}

UserOrder fetch(long id) throws Exception {
    try (var scope = StructuredTaskScope.open(Joiner.<Object>allSuccessfulOrThrow())) {
        var userTask  = scope.fork(() -> fetchUser(id));
        var orderTask = scope.fork(() -> fetchOrder(id));
        scope.join();   // 両方成功で戻る、片方失敗ならその例外
        return new UserOrder(userTask.get(), orderTask.get());
    }
}
```

### ユースケース

- **必要な情報を複数取得**して、まとめて返す API
- **複数の前提条件**を並行で確認する処理
- マイクロサービスで、複数の依存サービスを**並列に呼ぶ**

「**全部揃わないと意味がない**」処理に向きます。

---

## ポリシー2: 最初の成功で進む（`anySuccessfulResultOrThrow`）

**1 つでも成功したらその結果で進む**ポリシー。
複数の選択肢を**並行に試して**、誰が成功するか分からないけど**1 つで十分**な場合に使います。

```java
String fetchFromAnyMirror() throws Exception {
    try (var scope = StructuredTaskScope.open(Joiner.<String>anySuccessfulResultOrThrow())) {
        scope.fork(() -> fetchFrom("mirror-jp"));
        scope.fork(() -> fetchFrom("mirror-us"));
        scope.fork(() -> fetchFrom("mirror-eu"));
        return scope.join();   // 最初に成功した結果
    }
}
```

### ユースケース

- **冗長な依存サービス**から、最も速く返ってきた答えを使う
- **異なる戦略**を並行に試して、まず成功したものを採用
- **キャッシュ + DB** を並列に問い合わせ、先に返ったほうを使う

「**速い者勝ち**」のユースケースに向きます。
最初に成功した時点で、他のタスクは**自動キャンセル**されます。

---

## ポリシー3: 全部の結果を集める（`awaitAll`）

成功も失敗も**全部集めて**から返るポリシー。
**個別に成否を判定したい**場合に使います。

```java
import java.util.List;

List<Subtask<String>> fetchAll(List<Long> ids) throws Exception {
    try (var scope = StructuredTaskScope.open(Joiner.<String>awaitAllSuccessfulOrThrow())) {
        var tasks = ids.stream()
            .map(id -> scope.fork(() -> fetchUser(id).toString()))
            .toList();
        scope.join();
        return tasks;
    }
}
```

`Joiner.awaitAllSuccessfulOrThrow()` は「**全部待つ、ただし 1 つでも失敗していたら最初の失敗例外を投げる**」のセマンティクスです。
似た `Joiner.allUntil(...)` などもあり、用途に応じて選びます。

### ユースケース

- バッチ処理で**全件の結果**を集める
- レポートで、複数のソースから**全部取得**して合成する

---

## ポリシー4: 自前のポリシー（カスタム `Joiner`）

`Joiner` インタフェースを実装すれば、独自のポリシーも書けます。
たとえば「**過半数が成功したら進む**」（Quorum）のような分散システム的なポリシーも、`Joiner` を書けば実現できます。

ただし、業務コードで自前 `Joiner` を書くことはまれです。
**まず標準で用意されたものから選ぶ**、足りなければ自前 ―― が現実的な順序です。

---

## 「**部分成功**」をどう扱うか

ポリシーを選ぶときの肝は、「**部分成功（partial success）**」のときに何をしたいか、です。
3 つのパターンに分けて整理します。

### パターンA: 全部揃わないと意味がない

→ `allSuccessfulOrThrow`（最初の失敗で中止）

| 例 | 注文確定（在庫・決済・配送、全部 OK が必要） |

### パターンB: 1 つあれば十分

→ `anySuccessfulResultOrThrow`（最初の成功で中止）

| 例 | 複数の冗長 DNS、複数のキャッシュサーバー、速度比べ |

### パターンC: 部分的に成功でも前へ進める

→ `awaitAll` 系で、後で各タスクの状態を見て判断

| 例 | おすすめ商品（全部失敗しても、空リスト返せる）、ログ集約 |

「**何が起きたら何を返すべきか**」を、まず日本語で書く。
その答えに合わせてポリシーを選ぶ、というのが正しい順序です。

---

## キャンセル時の注意

ポリシーに従って「**中止**」が起きると、まだ走っているタスクには `Thread.interrupt()` が送られます。
第43章で見たとおり、

- **ブロッキング系**（`Thread.sleep`、I/O 待ち、`Lock.lockInterruptibly`）は `InterruptedException` で素直に抜ける
- **CPU 計算ループ**は、自分で `Thread.currentThread().isInterrupted()` を時々チェックしないと、止まらない

たとえば、

```java
scope.fork(() -> {
    long total = 0;
    for (long i = 0; i < 1_000_000_000L; i++) {
        if ((i & 0xFFFF) == 0 && Thread.currentThread().isInterrupted()) {
            throw new InterruptedException();
        }
        total += i;
    }
    return total;
});
```

のように、**ループの中で時々チェック**することで、キャンセルに応答できるようになります。

---

## 「**ぜんぶ並列で投げる**」は要注意

「速くなるから」と、何千、何万のタスクを `fork` するのは、要注意です。
仮想スレッドだからスレッドプールは枯渇しませんが、

- **下流の API・DB** が、その負荷に耐えられるとは限らない
- 一度に大量の I/O を投げると、**通信路がボトルネック**になる
- **結果が大量にメモリに乗る**

ので、現実的には**並列度を制限**したいことが多いです。
たとえば、`Semaphore` で並列度を絞る:

```java
Semaphore limit = new Semaphore(10);   // 同時 10 まで

try (var scope = StructuredTaskScope.open()) {
    for (var id : ids) {
        scope.fork(() -> {
            limit.acquire();
            try {
                return fetchOne(id);
            } finally {
                limit.release();
            }
        });
    }
    scope.join();
}
```

`Semaphore` を共有することで、`fork` は何千個でも、**実際に同時実行**されるのは 10 個だけ、にできます。
バルクリクエストや、レートリミットのある下流 API に対しては、こうした絞り込みを忘れずに。

---

## まとめると

- ポリシーは **`Joiner`** で指定する（Java 25 で API 刷新）
- 代表的なポリシー:
  - **`allSuccessfulOrThrow`** ―― 全成功で進む、1 つ失敗で全停止（既定相当）
  - **`anySuccessfulResultOrThrow`** ―― 1 つ成功で進む、速い者勝ち
  - **`awaitAll` 系** ―― 全部待ってから個別に判定
- 「**部分成功で何を返すか**」を先に決めて、ポリシーを選ぶ
- キャンセルは **`interrupt()`**。CPU ループは自分でチェックを入れる
- 並列度の制限が必要なら **`Semaphore`** で絞る

次の節では、`StructuredTaskScope` の中で**文脈を伝達する**もう 1 つの主役、**`ScopedValue`** を見ていきます。

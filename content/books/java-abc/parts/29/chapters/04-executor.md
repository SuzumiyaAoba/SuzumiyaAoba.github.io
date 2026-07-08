---
title: ExecutorService ― スレッドを管理する
llm: true
co-author: ["Claude Opus 4.7"]
---

## ExecutorService ― スレッドを管理する

`new Thread(...)` でスレッドを直接作るのは、シンプルですが、たくさんのスレッドを扱うには不便です。
そこで、現代の Java では、**`ExecutorService`**（エグゼキューター・サービス）を使って、スレッドを**管理しながら**処理を実行します。
この節では、その使い方を学びます。

（`ExecutorService` は `java.util.concurrent` パッケージにあります。`.java` ファイルでは `import java.util.concurrent.*;` が必要です。）

---

## 直接 Thread を作る問題

`new Thread(...)` を、たくさん作るのには、問題があります。

- スレッドを作るのは、**コストが高い**（メモリも時間も使う）
- 何万ものスレッドを作ると、コンピュータが**パンク**してしまう
- 作ったスレッドの「終了待ち」や「結果の受け取り」を、自分で管理するのが大変

そこで、「**スレッドの管理を、専門の係に任せる**」のが `ExecutorService` です。
私たちは「やってほしい処理（タスク）」を渡すだけで、実行する係が、スレッドをうまく使い回してくれます。

---

## ExecutorService にタスクを渡す

`ExecutorService` は、**`Executors`** の `newFixedThreadPool(数)` などで作ります。
そして、**`submit(...)`** に、やってほしい処理（タスク）を渡します。

```java
import java.util.concurrent.*;

try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
    executor.submit(() -> IO.println("タスク1"));
    executor.submit(() -> IO.println("タスク2"));
    executor.submit(() -> IO.println("タスク3"));
}   // ここ（close）で、すべてのタスクの完了を待つ
IO.println("すべて完了");
```

```text line-numbers=false
（実行の一例 ― 順番は変わりうる）
タスク1
タスク2
タスク3
すべて完了
```

- `Executors.newFixedThreadPool(2)` … スレッドを2つ用意した、実行係（スレッドプール）を作る
- `submit(...)` … やってほしいタスク（`Runnable`）を渡す。係が、空いているスレッドで実行する
- **`try (...)`**（try-with-resources、第20章）で囲むと、**閉じるとき（`close`）に、全タスクの完了を待ってくれる**

`new Thread` を3回書くより、ずっとすっきりしています。
ここでは、スレッドは2つしか用意していませんが、3つのタスクを、うまく使い回して処理してくれます。

> **補足: スレッドプールとは**
>
> `newFixedThreadPool(2)` で作られるのは、**スレッドプール**（thread pool）と呼ばれるものです。
> 「あらかじめ、決まった数のスレッドを用意しておき、それを使い回す」しくみです。
> 毎回スレッドを作り直さないので、効率がよく、スレッドの作りすぎも防げます。

---

## 結果を受け取る ― Future

タスクが「**値を返す**」場合は、その結果を **`Future`**（フューチャー、未来）で受け取ります。
`submit(...)` に、値を返す処理を渡すと、`Future` が返ります。

```java
import java.util.concurrent.*;

try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
    Future<Integer> future = executor.submit(() -> {
        return 3 + 5;        // 時間のかかる計算のつもり
    });

    IO.println("計算を依頼しました");
    int result = future.get();   // 結果が出るまで待って、受け取る
    IO.println("計算結果: " + result);
}
```

```text line-numbers=false
計算を依頼しました
計算結果: 8
```

- `submit(() -> 3 + 5)` … 「`3 + 5` を計算して」と依頼し、`Future<Integer>` を受け取る
- `future.get()` … 結果が出るまで**待って**、値（`8`）を受け取る

`Future` は、「**いまはまだないけれど、いずれ手に入る結果**」を表す引換券のようなものです。
依頼してすぐは結果がなくても、別の作業を進め、必要になったら `get()` で受け取る ―― という書き方ができます。

---

## ExecutorService の流れ

`ExecutorService` を使う流れを、整理しておきましょう。

```text line-numbers=false
1. Executors で実行係（スレッドプール）を作る
2. submit でタスクを渡す（値を返すなら Future を受け取る）
3. （必要なら）Future.get() で結果を受け取る
4. close（try-with-resources）で、全タスクの完了を待つ
```

「スレッドを直接作って管理する」のではなく、「**実行係にタスクを渡し、結果を引換券で受け取る**」――
この考え方が、現代的な並行処理の基本です。

---

## まとめ

- **`ExecutorService`** は、スレッドを**管理しながら**タスクを実行するしくみ
- `Executors.newFixedThreadPool(数)` で実行係（**スレッドプール**）を作る
- **`submit(...)`** にタスクを渡す（スレッドを使い回してくれる）
- 値を返すタスクの結果は、**`Future`** で受け取る（`future.get()` で待って取得）
- **try-with-resources** で囲むと、閉じるときに全タスクの完了を待つ
- 「スレッドを直接作る」より「**実行係にタスクを渡す**」のが、現代的

次の節では、Java 21 の画期的な新機能 ―― **仮想スレッド**を学びます。

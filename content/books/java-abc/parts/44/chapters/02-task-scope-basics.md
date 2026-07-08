---
title: StructuredTaskScope の基本
llm: true
---

## `StructuredTaskScope` の基本

この節では、`StructuredTaskScope` の基本的なリズム ―― **open・fork・join・close** ―― を、ひととおり体に入れます。

> **コンパイル時の注意**
>
> 第44章のサンプルは、すべて **Java 25 のプレビュー機能**を使います。
> コマンドラインなら、コンパイルと実行に **`--enable-preview`** を必ず付けてください:
>
> ```text
> $ javac --enable-preview --release 25 Foo.java
> $ java --enable-preview Foo
> ```

---

## 4 つのリズム ―― open・fork・join・close

`StructuredTaskScope` の基本的な使い方は、ほぼ常にこの形です。

```java
try (var scope = StructuredTaskScope.open()) {   // ① open
    var task = scope.fork(() -> doWork());        // ② fork
    scope.join();                                  // ③ join
    return task.get();                             // ④ 結果取得
}                                                  // ⑤ close（暗黙）
```

順に見ていきます。

### ① open

```java
try (var scope = StructuredTaskScope.open()) { ... }
```

`StructuredTaskScope.open()` は、新しいスコープを作ります。
内部では、サブタスクを動かすための**仮想スレッド用のエグゼキュータ**が用意されます。
**`try-with-resources` で必ず開く** ―― これが最初のお約束です。

### ② fork

```java
var userTask = scope.fork(() -> fetchUser(id));
```

`scope.fork(Callable)` で、新しい仮想スレッドが**スコープ内に生やされ**、サブタスクが開始されます。
戻り値は **`Subtask<T>`** で、後で `task.get()` で結果を取れます。

`fork()` 自体は**非ブロッキング**で、すぐ返ります。実際の処理は、別の仮想スレッドで進みます。

複数の `fork()` を**ふつうの順序で並べる**だけで、全部並行に走ります:

```java
var t1 = scope.fork(() -> stepA());
var t2 = scope.fork(() -> stepB());
var t3 = scope.fork(() -> stepC());
```

### ③ join

```java
scope.join();
```

`scope.join()` は、`fork()` した**全サブタスクの完了**を待ちます。
全部成功で終わるか、ポリシー（次節）に応じて中止されるか、いずれかで戻ってきます。

`scope.join()` を呼ばずにスコープを閉じることはできません（API 仕様）。
**fork したら join** ―― これがリズムです。

### ④ 結果取得

```java
String r = task.get();
```

`Subtask.get()` で、サブタスクの結果を取得します。
`join()` が戻ってから呼ぶのが原則です。
タスクが失敗していた場合は、**実行例外**（タスクの中で投げられた例外）が `IllegalStateException` で包まれて飛んできます。

> `Subtask` の状態は `Subtask.State` で取れます: `UNAVAILABLE` / `SUCCESS` / `FAILED`。
> `.state() == State.SUCCESS` を確認してから `.get()` を呼ぶのが安全です。

### ⑤ close（暗黙）

`try-with-resources` のブロックを抜けるとき、`scope.close()` が自動で呼ばれます。
ここで:

- すべてのサブタスクが**まだ走っていれば、キャンセル**
- 内部のエグゼキュータを**閉じる**

が行われます。「**スコープを抜けた時点で全部終わっている**」というルールが、ここで成り立ちます。

---

## 実機で動かしてみる

最小限の動作確認です。

```java
import java.util.concurrent.StructuredTaskScope;

public class ScopeDemo {
    public static void main(String[] args) throws Exception {
        try (var scope = StructuredTaskScope.open()) {
            var t1 = scope.fork(() -> { Thread.sleep(100); return "A"; });
            var t2 = scope.fork(() -> { Thread.sleep(50);  return "B"; });
            scope.join();
            System.out.println(t1.get() + t2.get());
        }
    }
}
```

```text line-numbers=false
$ javac --enable-preview --release 25 ScopeDemo.java
$ java --enable-preview ScopeDemo
AB
```

`Thread.sleep(100)` と `Thread.sleep(50)` を**直列**で実行すれば 150 ms かかりますが、並行実行なので合計**約 100 ms**で終わります。
`AB` の順序は、`get()` の呼び出し順なので、実際に終わる順序（B のほうが速い）とは関係なく、コードどおり `A` → `B` で結合されます。

---

## ポリシー ―― どこで「全完了」と決めるか

`scope.join()` が**いつ戻るか**は、スコープの**ポリシー**で決まります。
何も指定しない `StructuredTaskScope.open()` の既定ポリシーは「**最初の失敗で全停止、それ以外は全完了を待つ**」です（後述の `ShutdownOnFailure` 相当）。

```text line-numbers=false
[3 つの fork]
   ┌── stepA() ─────► OK
   ├── stepB() ─► OK
   └── stepC() ──► OK

[join() が戻る]
すべて OK で揃ったとき
```

もし `stepB` がエラーになると、

```text line-numbers=false
[3 つの fork]
   ┌── stepA() ─────► OK
   ├── stepB() ─► エラー
   └── stepC() ──► キャンセルされる
                         │
[join() が戻る]
              ◄──────────┘
            最初のエラーが起きた時点で stepC を中止して戻る
```

このポリシーが**最も使う場面が多い**ので、既定です。
別のポリシーが欲しいときは、`open` 時に明示します。

```java
// 「最初の成功で全停止」（並列に試して、誰か成功したらすぐ進む）
try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.anySuccessfulResultOrThrow())) {
    var t1 = scope.fork(() -> tryService1());
    var t2 = scope.fork(() -> tryService2());
    var result = scope.join();   // 最初に成功した結果
    return result;
}
```

第3節で、これらのポリシーをもう少し詳しく見ます。

---

## 例外の流れ

サブタスクで例外が起きると、その例外は **`task.get()` を呼んだとき**に飛んできます。
ただし、既定ポリシーでは、`scope.join()` の時点で

- 失敗したサブタスクの例外を保持し、
- 他のタスクをキャンセルし、
- **`join()` から例外を投げる**（`ExecutionException` でラップしない、原因例外そのもの）

という動きをします。

```java
try (var scope = StructuredTaskScope.open()) {
    var t = scope.fork(() -> { throw new IOException("oops"); });
    scope.join();       // ← ここで IOException が投げられる
}
```

例外は**ラップなし**で飛ぶので、

```java
try {
    try (var scope = ...) { ... }
} catch (IOException e) {
    log.error("外部呼び出し失敗", e);
}
```

のように、**ふつうの try-catch**で扱えます。
`ExecutionException` から `getCause()` で 1 段降りる必要はありません。

---

## タイムアウト

スコープに**タイムアウト**を付けることもできます。

```java
try (var scope = StructuredTaskScope.open(
        StructuredTaskScope.Joiner.<String>allSuccessfulOrThrow(),
        cf -> cf.withTimeout(java.time.Duration.ofSeconds(2)))) {
    var t1 = scope.fork(() -> longRunningCall());
    scope.join();
    return t1.get();
}
```

`withTimeout(...)` を渡すと、その時間内に全タスクが完了しなければ、**スコープが中止**されます。
中止時には、未完了のタスクは**キャンセル**され、`join()` から `TimeoutException` 系の例外が飛びます。

「**全体としてこの時間内に終わらせる**」というユースケースに、ぴったりです。

---

## まとめると

- 基本のリズム: **open → fork → join → close**
- `try-with-resources` で `open`、ブロック内で `fork` を並べ、`join()` で待つ
- `Subtask<T>.get()` で結果を取得。失敗時は例外
- 例外は **`join()`** から原因例外そのものが投げられる（ラップなし）
- 既定ポリシーは「**最初の失敗で全停止**」
- `withTimeout(...)` でスコープ全体にタイムアウトを設定できる

次の節では、`StructuredTaskScope.Joiner` で指定できる **`ShutdownOnFailure` / `ShutdownOnSuccess`** を含むポリシーを掘り下げます。

---
title: 用語集 ― この章で学んだ言葉
llm: true
---

## 用語集 ― この章で学んだ言葉

### 構造化並行性（Structured Concurrency）

並行処理を「**入れ子の構造**」として扱う設計思想。
**すべての子タスクは、それを開始したスコープが終わるときには、必ず終わっている**、というルールが核。

### `StructuredTaskScope`

構造化並行性を実装した Java 25 のプレビュー API（JEP 505）。
`try-with-resources` で開き、`fork()` でサブタスクを生やし、`join()` で待ち合わせる。

### Subtask

`scope.fork(...)` の戻り値型。タスクの**状態**（UNAVAILABLE / SUCCESS / FAILED）と**結果**を表す。

### `Joiner`

`StructuredTaskScope` の**ポリシー**を表す型（Java 25 で API 刷新）。

- **`allSuccessfulOrThrow`** ―― 全成功で進む、1 つ失敗で全停止
- **`anySuccessfulResultOrThrow`** ―― 最初の成功で進む、速い者勝ち
- **`awaitAllSuccessfulOrThrow`** ―― 全部待ち、1 つでも失敗なら最初の例外

### キャンセル伝搬

`StructuredTaskScope` が中止を決めたとき、まだ走っているサブタスクに**自動で`interrupt()` を送る**こと。
ブロッキング操作は `InterruptedException` で抜けるが、**CPU ループは自分でチェック**する必要がある。

### `ScopedValue`

`ThreadLocal` の問題を解決した、Java 25 正式機能（JEP 506）。
**書き換え不可・スコープ限定・自動解放**で、`StructuredTaskScope` の子タスクに自動継承される。

### `ScopedValue.where(...).run(...)` / `.call(...)`

`ScopedValue` の値を設定して、その中でラムダを実行する形式。
`.run()` は戻り値なし、`.call()` は戻り値あり、checked 例外も投げられる。

### `--enable-preview`

プレビュー機能を有効化する javac / java の引数。
プレビュー API（`StructuredTaskScope` など）を使うには、コンパイル時・実行時の両方で必要。

### `CompletableFuture`

Java 8 で導入された、非同期処理を**値として合成**する仕組み。
コールバックチェーンで書ける。`StructuredTaskScope` と用途を**棲み分け**て共存する。

### プレビュー機能

Java の将来バージョンで正式機能になる予定の、**試用**段階の API。
API の形が**変わることがある**ので、本番投入は慎重に。

### 仮想スレッド（Virtual Threads）

第29章で扱った、軽量なスレッド。
`StructuredTaskScope` の内部実装で使われ、**広く・浅く**の並列化と相性がよい。

### 「広く・浅く」の並列化

多数の小さな I/O 待ち（DB クエリ、HTTP 呼び出し）を**並列に**実行する用途。
仮想スレッド + `StructuredTaskScope` の組み合わせで、自然に書ける。

### `Semaphore`

並列度を**制限**するための仕組み。
仮想スレッドだからといって、下流の API を無制限に叩いてよいわけではないので、`Semaphore` で**同時実行数を絞る**。

---

これで第44章の用語整理は終わりです。
次の第45章では、コードベースを**部品単位で組み立てる**仕組み ―― **モジュールシステム（JPMS）**を扱います。

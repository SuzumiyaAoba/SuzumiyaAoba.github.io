---
title: atomic と CAS ― ロックなしで安全に
llm: true
---

## atomic と CAS ― ロックなしで安全に

`synchronized` は安全ですが、ロックを取るぶん**コスト**がかかります。
「**1 つの変数を、安全にカウントアップしたいだけ**」のような単純な用途に、ロックを使うのは大げさです。
そんなときに使うのが、`java.util.concurrent.atomic` パッケージの **アトミック型**と、その背後にある **CAS** という仕組みです。

---

## `AtomicInteger` ―― ロックなしのカウンタ

`AtomicInteger` は、ロックを取らずに**スレッドセーフ**な int 操作を提供します。

```java
import java.util.concurrent.atomic.AtomicInteger;

class SafeCounter {
    private final AtomicInteger counter = new AtomicInteger(0);

    public void increment() {
        counter.incrementAndGet();    // ロックなしで +1
    }
    public int get() {
        return counter.get();
    }
}
```

これは、複数のスレッドから `increment()` を**同時に**呼ばれても、**1 回も漏れなく**カウントアップされます。
`synchronized` でラップしたコードと**同じ安全性**を、**ロックなし**で実現しているわけです。

---

## CAS ―― 「比較して、入れ替える」

なぜロックなしで安全にできるのか?
答えは、CPU 命令レベルの **CAS**（Compare And Swap、比較交換）にあります。

CAS は、次の 3 引数を取る、**1 命令でアトミックな**操作です。

> **CAS(変数のアドレス, 期待する値, 新しい値)**:
> 変数の現在の値が**期待する値**と等しければ、**新しい値**に書き換えて `true` を返す。
> 等しくなければ、書き換えずに `false` を返す。

`AtomicInteger.incrementAndGet()` は、ざっくり次のように動いています。

```java
int v;
do {
    v = atomic.get();           // 現在の値を読む
} while (!atomic.compareAndSet(v, v + 1));   // CAS で書き換えを試みる
return v + 1;
```

1. 現在の値 `v` を読む
2. `v + 1` を書き込もうとする ―― ただし、**「読んだときの値が `v` のままなら」**という条件付き
3. 別スレッドが先に書き換えていたら、CAS は失敗 → 1 に戻ってやり直し

このループは**ふつう 1〜2 回**で成功します。
失敗するのは、別スレッドが**ちょうどそのあいだ**に書き換えた、というレアケースだけです。
そのため、平均的にはロックよりはるかに軽量です。

これを **オプティミスティック・コンカレンシー**（optimistic concurrency、楽観的並行制御）と呼びます。
「**競合は稀**」と楽観し、競合したらリトライする ―― という発想です。

---

## 何ができるか

`AtomicInteger` には、便利な操作がそろっています。

| メソッド | 何をするか |
|---|---|
| `get()` | 現在の値を読む |
| `set(v)` | 値を設定する（`volatile` 相当） |
| `incrementAndGet()` | `++x` 相当（更新後の値を返す） |
| `getAndIncrement()` | `x++` 相当（更新前の値を返す） |
| `addAndGet(d)` | `x += d` 相当 |
| `compareAndSet(expect, update)` | CAS そのもの |
| `updateAndGet(unary)` | ラムダで更新する（例: `x.updateAndGet(v -> v * 2)`） |
| `accumulateAndGet(d, binary)` | ラムダで二項演算 |

特に `updateAndGet` は、複雑な更新（min/max、独自の計算）を**1 行で**書ける優秀な道具です。

```java
AtomicInteger max = new AtomicInteger(0);
max.updateAndGet(v -> Math.max(v, newValue));
```

---

## アトミック型の家族

`AtomicInteger` 以外にも、いろいろあります。

| 型 | 用途 |
|---|---|
| `AtomicInteger` | int |
| `AtomicLong` | long |
| `AtomicBoolean` | boolean |
| `AtomicReference<T>` | 任意の参照 |
| `AtomicIntegerArray` | int[] の要素ごとの CAS |
| `AtomicLongArray` | long[] の要素ごとの CAS |
| `AtomicReferenceArray<T>` | T[] の要素ごとの CAS |

特に **`AtomicReference<T>`** は強力で、「**任意のオブジェクトを差し替える**」操作を CAS で行えます。

```java
AtomicReference<Config> currentConfig = new AtomicReference<>(Config.defaults());

void reload() {
    Config newConfig = loadFromDisk();
    currentConfig.set(newConfig);
}

Config get() {
    return currentConfig.get();
}
```

第3節の「**`volatile` で参照差し替え**」と似ていますが、**`AtomicReference` だと CAS で条件付き差し替え**もできます。

```java
// 「現在の Config が old のままなら、newConfig に差し替える」
currentConfig.compareAndSet(old, newConfig);
```

これは、設定のリロード競合や、**ロックフリーなデータ構造**を作るときに使います。

---

## 「**`Adder` シリーズ**」 ―― 高頻度カウントの最適化

`AtomicLong` でカウンタを作っても、**極めて高頻度**（毎秒数百万回）に書かれると、CAS のリトライが増えて性能が落ちます。
そういう用途のために、**`LongAdder`** という型が用意されています。

```java
import java.util.concurrent.atomic.LongAdder;

private final LongAdder requestCount = new LongAdder();

void onRequest() {
    requestCount.increment();
}
long getTotal() {
    return requestCount.sum();
}
```

`LongAdder` は内部で**複数のセル**を持ち、スレッドが書くときに**自分専用のセル**を使うことで、CAS の競合を減らします。
合計を取るときに、全セルを合算します。

| 項目 | `AtomicLong` | `LongAdder` |
|---|---|---|
| 書き込みが**頻繁** | 競合で遅くなる | **速い**（セル分散） |
| `get()` 時のコスト | O(1) | O(N) ―― セル数ぶん舐める |
| 値の**厳密な整合性** | 強い | やや弱い（読み中も書き続けるなら、瞬間値は揺れる） |

集計用カウンタ（メトリクス、ログ件数など）に向きます。
**「正確な現在値」が大事な用途**（在庫数、残高）には、`AtomicLong` のほうが向きます。

---

## ABA 問題

CAS には、**ABA 問題**という有名な落とし穴があります。

- スレッド A: 値を `X` と読み、書き換えようとする
- スレッド B: `X → Y → X` と 2 回書き換える
- スレッド A: CAS する → 値が `X` のままに見えるので、書き換え成功

「**値が同じ**」なので CAS は成功しますが、実際には**間に違う値が挟まっていた**わけです。
ふつうのカウンタなら問題ありませんが、参照を扱うときに**「同じオブジェクトに見えて、実は中身が違う**」という現象が起きえます。

対策として、Java は `AtomicStampedReference`（参照とバージョン番号のセット）を提供しています。

```java
AtomicStampedReference<Node> head = new AtomicStampedReference<>(start, 0);
int[] stamp = new int[1];
Node old = head.get(stamp);
// 計算...
head.compareAndSet(old, newNode, stamp[0], stamp[0] + 1);
```

バージョン番号を一緒に CAS することで、`X → Y → X` の間に番号が変わっていれば検出できます。
本書ではここまでで十分ですが、「**そういう問題がある**」とだけ覚えておきましょう。

---

## 「使い分けの早見表」

ここまでの内容を、ひとことでまとめます。

| 用途 | 選択 |
|---|---|
| **単純なフラグ・状態** | `volatile` |
| **単一変数のカウンタ・更新** | `AtomicInteger` / `AtomicLong` |
| **高頻度カウンタ（メトリクス）** | `LongAdder` |
| **参照の入れ替え** | `volatile` + 不変オブジェクト、または `AtomicReference` |
| **複数フィールドを一緒に守る** | `synchronized` |
| **複雑な条件 + タイムアウト** | `ReentrantLock` |
| **読み多 / 書き少のコレクション** | `ConcurrentHashMap` などの **`java.util.concurrent`** |

並行処理の道具立てを覚えるコツは、「**まず `synchronized` → 性能か機能で足りなくなったら、より細かい道具に置き換える**」です。
最初から`AtomicReference` のロックフリーに挑む必要はありません。

---

## まとめると

- アトミック型は、**CAS** を使ってロックなしで安全な更新を行う
- CAS = **比較交換**、1 命令で「**期待値と一致したら書く**」を実行する
- `AtomicInteger` / `AtomicLong` / `AtomicReference` が代表
- 高頻度書きには `LongAdder`、複雑な更新には `updateAndGet`
- **ABA 問題**に注意。参照を扱うなら `AtomicStampedReference`
- 道具立ては「**`synchronized` から始め、必要に応じて細かい道具へ**」

次の節では、ここまでの「**守る**」発想を一段超えて、「**そもそも変えない**」 ―― **不変性とスレッド安全性**を扱います。

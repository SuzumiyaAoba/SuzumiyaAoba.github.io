---
title: よくあるつまずき
llm: true
---

## よくあるつまずき

並行処理は、Java の中でも特に**ベテランでも踏む**領域です。
この節では、現場で繰り返し見かける 7 つの典型的なつまずきを整理します。

---

## つまずき1: 二重チェックロック（DCL）の罠

「**ロックを最小化したい**」という発想で書かれる、有名なアンチパターンです。

```java
class Lazy {
    private Heavy instance;
    public Heavy get() {
        if (instance == null) {          // ① 最初の比較（ロックなし）
            synchronized (this) {
                if (instance == null) {  // ② 2 回目の比較（ロックの中）
                    instance = new Heavy();
                }
            }
        }
        return instance;
    }
}
```

「**最初の `null` チェックでロックを避けたい、ロック内で再チェックして安全にしたい**」 ―― 発想は美しいですが、これは**壊れます**。

理由は、`instance = new Heavy()` が、JIT・CPU から見ると次の 3 ステップに分割されうるからです。

1. メモリ確保
2. **`instance` に参照を代入**
3. `Heavy` のコンストラクタ実行

2 と 3 が**並べ替わる**と、`instance != null` だがコンストラクタは未完了、という状態が他スレッドから観測できます。
ロックの外で `instance` を覗いている①が、その状態を読んでしまうのです。

正しい二重チェックロックは、**`volatile` を付ける**こと:

```java
private volatile Heavy instance;   // ← volatile
```

`volatile` の happens-before により、`instance` を書き込む時点で**コンストラクタの完了が保証**されます。
このパターンは、現在では「**volatile 付き DCL**」として、シングルトンの遅延初期化の定番イディオムです。

ただし、**`enum` シングルトン**にすれば DCL の話はそもそも不要になります。
新規コードでは、可能なら `enum` シングルトンを選びましょう。

```java
public enum Singleton {
    INSTANCE;
    // メソッド...
}
```

---

## つまずき2: 「**シングルスレッドで動いたから OK**」

ユニットテストでは、

- スレッドが 1 つしか動いていない
- いつも同じ順序で実行される
- マシン負荷が低い

ので、並行処理のバグは**まず再現しません**。
**ユニットテストで OK = 並行処理が正しい、ではありません**。

並行処理は、

- 高い並列度で繰り返し動かす（**ストレステスト**）
- レアな状況を作る道具（**jcstress** など）

で初めてバグが出ます。
「**ローカルで動いた**」を本番品質と思わないこと ―― これが鉄則です。

---

## つまずき3: 「`Thread.stop()` でスレッドを止める」

`Thread.stop()` は、**Java 1.2 から非推奨**、Java 21 で**完全削除**されました。
それでも検索結果には残っているので、**間違って使う**人がいます。

理由は単純で、`stop()` は**スレッドを途中で殺す**ので、

- 持っているロックを**解放しない**（デッドロックの素）
- 書き換え途中のデータ構造を**壊れた状態のまま**残す

ためです。
スレッドを止めるには、**`interrupt()` を呼ぶ**か、**`volatile` フラグで自発的に止まる**ようにします。

```java
volatile boolean stopped = false;

public void run() {
    while (!stopped && !Thread.currentThread().isInterrupted()) {
        // 仕事
    }
}
```

---

## つまずき4: `Thread.sleep` で「他のスレッドが終わるのを待つ」

```java
worker.start();
Thread.sleep(1000);   // ← 1 秒待てば、たぶん終わってる、はず
// worker の結果を使う
```

「**たぶん**」で書かれた並行処理は、確実に本番で壊れます。
正しくは、**`Thread.join()`** を使います。

```java
worker.start();
worker.join();   // worker が終わるまで待つ
```

`join()` には happens-before の保証（第2節）があるので、**`worker` 内の全書き込みが、join 後から見える**ことが保証されます。

複数スレッドの完了を待つなら、`CountDownLatch`、`Phaser`、`StructuredTaskScope`（第44章）が使えます。

---

## つまずき5: `HashMap` を共有してしまう

```java
class Cache {
    static Map<String, String> cache = new HashMap<>();   // ← 危険
}
```

`HashMap` は**スレッドセーフではありません**。
複数スレッドから同時に書き込むと、

- 内部の連結リストが**ループ**になり、`get()` で**無限ループ**する（古典的なバグ）
- 値が**消える**
- `ConcurrentModificationException` が**たまに**飛ぶ

並行アクセスがあるなら、

- 読み多 / 書き少: **`ConcurrentHashMap`**
- 不変で配って書き換えない: **`Map.of()` + `volatile` で参照差し替え**

を使います。
特に `ConcurrentHashMap` は、内部でセグメント化された CAS を使い、**ロックなしに近い読み**を提供します。

---

## つまずき6: 「**`volatile` だけで充分**」と思い込む

第3節で見たとおり、`volatile` は**可視性**を保証しますが、**複合操作のアトミシティ**は保証しません。

```java
volatile int balance = 0;

void deposit(int amount) {
    balance = balance + amount;   // ← Read-Modify-Write でレース
}
```

「`volatile` だからスレッドセーフ」と思ってこういうコードを書くと、**残高が消える**事故が起きます。
複合操作なら、

- `AtomicInteger` の `addAndGet`
- `synchronized` ブロック
- `LongAdder`

のいずれかが必要です。

---

## つまずき7: 「**ロックを取りっぱなしで I/O する**」

並行処理のパフォーマンスを潰す、代表的なアンチパターン:

```java
synchronized (lock) {
    var result = httpClient.send(...);   // ← I/O！
    cache.put(key, result);
}
```

ロックを持ったまま I/O やデータベースアクセスをすると、

- そのあいだ、他のスレッドが**全員待ち**になる
- I/O のレイテンシが**ボトルネック**になる
- レイテンシ要件のあるシステムでは致命的

ロックは**極小**にするのが原則です。

```java
var result = httpClient.send(...);   // ロックの外で I/O
synchronized (lock) {
    cache.put(key, result);          // ロック内は memory 操作だけ
}
```

「**外で計算、内で更新**」のリズムを覚えておきましょう。

---

## まとめると ―― 5 つの心得

第43章全体を通して、並行処理を扱う 5 つの心得を整理します。

1. **「共有するなら不変、変えるなら共有しない」** ―― 設計の原則
2. **明示的な同期がない読み書きは、何も保証されない** ―― JMM の基本姿勢
3. **`volatile`・`synchronized`・`Atomic` を、目的に合わせて選ぶ**
4. **ロックは極小、I/O はロックの外**
5. **ユニットテストでは見えない。ストレステスト・ツールで叩く**

並行処理は、Java の最も**油断できない**領域ですが、ルールを知って道具を使えば、必ず安全に書けます。
急がず、**1 つずつ確かめながら**書きましょう。

次の節「用語集」で本章の言葉を整理し、第44章では、構造化並行性 ―― 並行処理を「**入れ子の構造**」として扱う、より新しい時代の Java を見ていきます。

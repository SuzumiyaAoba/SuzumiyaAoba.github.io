---
title: synchronized と内部ロック
llm: true
---

## `synchronized` と内部ロック

`volatile` では守れない「**複合操作**」 ―― 「読んで、計算して、書く」 ―― を安全にする道具が、`synchronized` です。
第29章で軽く触れましたが、ここでは JMM の観点から、もう一度しっかり整理します。

---

## どこに付けられるか

`synchronized` は、**2 つの場所**に書けます。

### 1. メソッド全体

```java
public synchronized void increment() {
    counter++;
}
```

このとき、**そのオブジェクト自身**（`this`）のロックを取ります。
`static` メソッドの場合は、**クラスオブジェクト**（`MyClass.class`）のロックです。

### 2. ブロック単位

```java
public void increment() {
    synchronized (lock) {
        counter++;
    }
}
```

`lock` という別のオブジェクトを**鍵**として使う形です。
ロックの粒度を細かくしたいとき、複数のメソッドで同じロックを使いたいとき、こちらが便利です。

---

## ロックが保証する 2 つのこと

`synchronized (lock) { ... }` のブロックは、JMM 上で**2 つのこと**を保証します。

### 1. 排他（mutual exclusion）

同じ `lock` で同期しているブロックは、**一度に 1 つのスレッドだけ**が入れます。
他のスレッドは、入っているスレッドが抜けるまで**待ち**ます。
これにより、ブロック内の操作は**他スレッドに割り込まれずに**最後まで実行されます。

### 2. happens-before の橋

`synchronized (lock) { ... }` の**ブロック終了**は、**同じ `lock` を使う次のブロックの開始**に対して happens-before。

```java
// Thread A
synchronized (lock) {
    x = 1;            // ①
}                     // ② ロック解放

// Thread B
synchronized (lock) {  // ③ ロック取得
    System.out.println(x);  // ④
}
```

② → ③ なので、Thread B では `x == 1` が**確実に**見えます。
ブロックの中で行ったすべての書き込み（① だけでなく、それ以外の `volatile` でない普通のフィールドも）が、**次にロックを取ったスレッドに見える**のがポイントです。

`volatile` が「**ある 1 つの変数**」の可視性を保証するのに対し、`synchronized` は「**ブロック内のすべての操作**」の可視性を保証する ―― これが、`synchronized` の強力さです。

---

## どの「**ロック**」を選ぶか

`synchronized` のロックは、任意のオブジェクトを使えます。
よく使われるパターンを整理しておきます。

### パターン1: `this` を使う

```java
class Counter {
    int count = 0;
    public synchronized void increment() {
        count++;
    }
}
```

最もシンプル。ただし、`this` は**外部にも公開されている**ため、外からも誰でもロックを取れてしまいます。
意図しないロック競合が起きるリスクがあり、ライブラリでは避けることが多いです。

### パターン2: private な lock オブジェクト

```java
class Counter {
    private final Object lock = new Object();
    private int count = 0;

    public void increment() {
        synchronized (lock) {
            count++;
        }
    }
}
```

これが**実務での定石**です。
ロックオブジェクトを外に公開しないので、外部から勝手にロックされる心配がありません。
**`final` で宣言する**のもポイントで、ロックの差し替えを防ぎます。

### パターン3: クラスごとのロック（static）

```java
class GlobalCounter {
    private static final Object lock = new Object();
    private static int total = 0;

    public static void increment() {
        synchronized (lock) {
            total++;
        }
    }
}
```

クラス全体で 1 つの状態を守りたいとき。`synchronized static` でも同じことができますが、`GlobalCounter.class` を外部からロックされるリスクは同じです。
明示的な `static final Object` のほうが、意図が読み取りやすいです。

---

## 「再入可能」(reentrant) という性質

Java の `synchronized` は、**再入可能**（reentrant）です。
これは、**同じスレッドが、既に持っているロックをもう一度取ろうとしても、ブロックされない**、という性質です。

```java
class Recursive {
    public synchronized void outer() {
        inner();    // 同じ this のロックを取りに行く
    }
    public synchronized void inner() {
        // ...
    }
}
```

`outer()` の中から `inner()` を呼んでも、ちゃんと動きます。
内部的には、ロックに「**何回取った**」というカウンタがあり、同じスレッドからの取得は単にカウントを増やすだけです。

再入可能でないロックだと、上のコードは**自分自身でデッドロック**します（自分の持っているロックを自分が待つ）。
Java の `synchronized` は、それを防ぐために再入可能になっています。

---

## デッドロック ―― 待ち合いの輪

`synchronized` を使うとき、最も警戒すべきは**デッドロック**（deadlock、膠着状態）です。

```java
// Thread A
synchronized (lock1) {
    synchronized (lock2) {
        // ...
    }
}

// Thread B
synchronized (lock2) {
    synchronized (lock1) {
        // ...
    }
}
```

このコード、Thread A が `lock1` を取り、Thread B が `lock2` を取った瞬間、

- A は `lock2` を待つ（B が持っている）
- B は `lock1` を待つ（A が持っている）

両者とも、相手が解放するのを待ち続けます。**永遠に**。
これがデッドロックです。

予防の鉄則は、

> **複数のロックを取る順序を、コード全体で一貫させる**

`lock1` → `lock2` の順で取るなら、**どこでもその順番で取る**。
これだけで、上のような輪っかは消えます。

> **`jstack` でデッドロックを見つける**
>
> 本番でアプリが固まったとき、`jstack <pid>` を実行すると、JVM が**スレッドの状態とロックの待ち**を出してくれます。
> 末尾に「**Found one Java-level deadlock**」と出れば、確定です。
> どのスレッドがどのロックを待っているかも書かれているので、原因のロック順序が突き止められます。

---

## `wait` / `notify`（軽く触れる）

`synchronized` ブロックの中では、`Object.wait()` と `Object.notify()` / `notifyAll()` という、**条件待ち**の仕組みが使えます。

```java
synchronized (lock) {
    while (!ready) {
        lock.wait();      // ready が false の間は待つ
    }
    // ready == true
}

// 別スレッド
synchronized (lock) {
    ready = true;
    lock.notifyAll();      // 待っているスレッドを起こす
}
```

これは、現代の Java では**ほぼ書く必要がありません**。
`java.util.concurrent` の `BlockingQueue`、`CountDownLatch`、`Condition` などの高水準 API のほうが、**安全で読みやすい**コードになります。
`wait` / `notify` は、入門書では「**存在する**」とだけ触れるレベルで十分です。

---

## `synchronized` の限界

`synchronized` は強力ですが、限界もあります。

| 制限 | 影響 |
|---|---|
| **タイムアウトつきのロック取得**ができない | 取得できないと、いつまでも待ち続ける |
| **割り込み**で待ちを抜けられない | デッドロックを外部から壊せない |
| **公平性**を選べない | どのスレッドが先にロックを取るかは不定 |
| **try-lock** ができない | ロックが空いてるかチェックだけ、ができない |

これらが必要なときは、より柔軟な **`java.util.concurrent.locks.ReentrantLock`** を使います。

```java
import java.util.concurrent.locks.ReentrantLock;

private final ReentrantLock lock = new ReentrantLock();

public void doWork() {
    if (lock.tryLock()) {       // 取れたらだけ実行
        try {
            // ...
        } finally {
            lock.unlock();
        }
    }
}
```

`ReentrantLock` は、`synchronized` の代わりに使える**より高機能なロック**です。
ただし、**`try-finally` で必ず `unlock()`** を書く必要があり、書き忘れがバグの温床になります。
シンプルな排他なら、`synchronized` を優先 ―― これがバランスの取れた選択です。

---

## 仮想スレッド（Virtual Threads）と `synchronized`

第29章で紹介した**仮想スレッド**（Java 21〜）と `synchronized` の関係には、注意があります。
Java 24 までは、`synchronized` の中で**ブロッキング I/O 待ち**になると、その仮想スレッドは**プラットフォームスレッドにピン留め**されてしまい、軽量さが失われていました。

これが Java 25（JEP 491）で**解消**され、`synchronized` の中で待っても、仮想スレッドはちゃんと**プラットフォームスレッドを離す**ようになりました。
仮想スレッドを使うコードでも、`synchronized` を**安心して使える**ようになっています。

---

## まとめると

- `synchronized` は、**排他**と **happens-before の橋**の 2 つを保証する
- ロック先は **`this`・private な final Object・`Class<?>`** のいずれか。実務では **private final Object** が定石
- Java の `synchronized` は**再入可能**（自分自身のロックを再取得できる）
- 複数ロックは**順序を一貫**させて、デッドロックを防ぐ
- `wait` / `notify` は古い仕組み、現代では `java.util.concurrent` の高水準 API を使う
- 高機能なロックは `ReentrantLock`。`try-finally` で `unlock()` を必ず書く
- 仮想スレッドと `synchronized` の組み合わせは、Java 25 で**問題が解消**

次の節では、ロックを使わずに、より速く、より柔軟に「**読んで・書く**」を実現する手段 ―― **atomic と CAS** を見ていきます。

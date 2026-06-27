---
title: happens-before 関係
llm: true
---

## happens-before 関係

JMM の核となる概念が、**happens-before**（ハプンズ・ビフォア、「先に起きた」関係）です。
名前のとおり「**A が B より先に起きた**」という関係を、JMM が**保証する**形で定めます[^jls-jmm]。
この関係を読み解けるようになると、並行処理コードの正しさを「**雰囲気**」ではなく、**ルール**で判断できるようになります。

---

## 「先に起きた」とは

A から B への happens-before 関係（記号で **A → B** と書きます）が成立しているとき、JMM は次のことを保証します。

> A が「行ったこと」（書き込み・読み込み・命令の実行）は、B から見たときに**完了している**。

これは「**プログラム上の順序**」ではなく、**観測可能性**の話です。
A → B が成立しているなら、

- B が読む値は、**A 以降の値**
- B から見たとき、A の書き込みは**並べ替えられない**

ということを保証します。

逆に、A → B の関係が**ない**ときは、

- B が読む値は、**A の前の値**（古い値）かもしれない
- B から見ると、A の中の命令が**並べ替わって**見えるかもしれない

ということです。

---

## 「単一スレッド」での happens-before

まず、最も素朴な happens-before 関係です。

> **同じスレッド内**で、ソースコード上の前の文は、後の文に対して happens-before。

つまり、シングルスレッドで動かしているコードは、

```java
int x = 1;
int y = x + 1;
```

このような書き方でも、**自分自身からは**ちゃんと `y == 2` に見えます。
ただしこれは、「**他のスレッドから見たとき**」は別の話です。
他のスレッドが happens-before の関係なしに割り込めば、`x == 1` を観測する前に `y == 2` が見えるような並べ替えが**起こりえます**。

---

## 8 つの基本的な happens-before 関係

JLS §17.4 と §17.5 で定められた、ほぼすべての happens-before 関係を 8 つに整理しました。
最初は理解できなくてかまいません。読み返すための辞書として置いておきます。

### 1. プログラム順序

同じスレッド内で、ソースコード上の前の文 → 後の文。

### 2. モニタロック（synchronized）

`synchronized (lock) { ... }` の**解放**は、**同じロックを取った**次のブロックに対して happens-before。

```java
// Thread A
synchronized (lock) {
    x = 1;        // ①
}                 // ② ロック解放

// Thread B
synchronized (lock) {    // ③ ロック取得
    System.out.println(x);  // ④
}
```

② → ③ なので、③ から見て ① は**完了済み**。④ では必ず `1` が見える。

### 3. volatile

`volatile` 変数への**書き込み**は、その後の**同じ変数への読み込み**に対して happens-before。

```java
volatile boolean ready = false;

// Thread A
data = build();
ready = true;        // ①

// Thread B
while (!ready) {}    // ②
use(data);
```

① → ② が成立するので、② で `ready == true` を観測した後の `data` の読み込みは、必ず ① の前の `data = build()` の結果が見える。

### 4. スレッドの開始と終了

- `Thread.start()` の呼び出しは、**そのスレッドの最初の動作**に対して happens-before
- スレッドの最後の動作は、別のスレッドが `Thread.join()` から戻る瞬間に対して happens-before

```java
sharedData = "hello";   // ①
Thread t = new Thread(() -> {
    System.out.println(sharedData);   // ②
});
t.start();
```

① → `t.start()` → ② が成立。`hello` が必ず見える。

### 5. interrupt と検出

`Thread.interrupt()` の呼び出しは、対象スレッドが割り込みを検出すること（`InterruptedException` を投げる、`isInterrupted()` が true を返す等）に対して happens-before。

### 6. final フィールド

コンストラクタが完了するまでに**確定**した `final` フィールドへの書き込みは、コンストラクタ完了後の**そのオブジェクトの任意のスレッドからの読み込み**に対して happens-before。

```java
class Box {
    final int x;
    Box(int x) { this.x = x; }
}
```

別スレッドから `box.x` を読んでも、ちゃんと `x` の最終値が見えます。
**`final` は同期なしで安全に読める**、という強力な保証です。

### 7. デフォルト値

`new` でオブジェクトを作った直後の各フィールドは、**型のデフォルト値**（`0`・`false`・`null`）に**初期化済み**。
これも「**`new` の完了** → **デフォルト値の読み込み**」という happens-before として捉えられます。

### 8. 推移律（transitivity）

A → B かつ B → C なら、A → C。

これは当たり前のようでいて、**極めて重要**です。
たとえば、

- A → `volatile` 書き込み → `volatile` 読み込み → C

の経路が成立すれば、A → C が成り立ち、A の書き込みは C から見えるようになります。
複数の同期手段を**組み合わせて**、安全な順序を作ることができます。

---

## 図で覚える happens-before

happens-before は、図で覚えるのが速いです。

```text
   Thread A                Thread B
   ────────                ────────
   data = "x"     ①
   ready = true   ②  ─┐
   　　　　　　　　　   │ volatile
   　　　　　　　　    └─►③  while (!ready) ...
                          ④  print(data)
```

② → ③ が happens-before（`volatile` の書き込み → 読み込み）。
さらに ① → ②（プログラム順序）、③ → ④（プログラム順序）。
推移律で、① → ④ が成立し、④ で `"x"` が見える。

このように、**矢印をつないで**「**A から B に道が通っているか**」を確かめるのが、happens-before の読み方です。

---

## 「データレース」とは

happens-before の道がつながっていない 2 つのアクセスが、

- **同じ変数**にアクセスしていて
- **少なくとも片方が書き込み**である

とき、それは**データレース**（data race）と呼ばれる状態です。

データレースのあるプログラムは、JMM が**何も保証しない**ので、

- 古い値を読むかもしれない
- 並べ替えで命令が前後するかもしれない
- 64-bit 型は半分だけ書き込まれた値を読むかもしれない

といった、**未定義**の振る舞いをします。
データレースは「**バグ**」ではなく「**未定義**」 ―― つまり、何が起きてもおかしくない、と覚えてください。

---

## ここから先の節の見取り図

happens-before を作る道具立てを、次の節以降で見ていきます。

| 道具 | 何を保証するか |
|---|---|
| `volatile`（第3節） | 個別の変数について、**書き込み → 読み込み**の happens-before |
| `synchronized`（第4節） | クリティカルセクション全体の**排他**と、**ロック解放 → 取得**の happens-before |
| `AtomicXxx`（第5節） | **CAS** によるロックなしの**読み・更新・書き**の不可分実行 |
| `final` と不変性（第6節） | 「**そもそも変更しない**」ことで、ロックなしで安全に |

「**どの道具を使えば、目的の happens-before が引けるか**」 ―― これを意識して、第3節以降を読んでください。

---

## まとめると

- happens-before（**→**）は、JMM が保証する「**先に起きた**」関係
- A → B のとき、A の効果は B から**必ず見える**
- 基本ルール: **プログラム順序・モニタロック・volatile・start/join・final・推移律**
- happens-before の道がつながっていない 2 つのアクセス + 一方が書き込み = **データレース**
- データレースは「**未定義**」 ―― 何が起きてもおかしくない

次の節では、最も軽量な同期手段 ―― **`volatile`** を見ていきます。

[^jls-jmm]: *The Java® Language Specification, Java SE 25 Edition*, §17.4 "Memory Model," <https://docs.oracle.com/javase/specs/jls/se25/html/jls-17.html#jls-17.4>。Java Memory Model（JMM）は JSR 133（Java SE 5）で根本的に改訂された。happens-before、volatile、final、synchronized の意味論が形式的に定義されている。Manson, Pugh, Adve, "The Java Memory Model," *POPL 2005* も参照。

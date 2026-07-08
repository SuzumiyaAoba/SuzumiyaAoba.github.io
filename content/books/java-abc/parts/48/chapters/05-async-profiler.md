---
title: async-profiler との使い分け
llm: true
---

## async-profiler との使い分け

JFR と並ぶ、もう一つの**本番投入できる**Java プロファイラが、**async-profiler** です。
オープンソースのコミュニティプロジェクトで、JFR とは少し違った視点を提供します。

---

## async-profiler とは

**async-profiler** は、Linux / macOS の **`perf` イベント**や、JVM 内部の `AsyncGetCallTrace` を活用した、低オーバーヘッドの Java プロファイラです。

GitHub: https://github.com/async-profiler/async-profiler

特徴を要約すると:

| 項目 | |
|---|---|
| オーバーヘッド | **極めて小さい**（< 1 %） |
| サンプリング基盤 | OS のパフォーマンスカウンタ（perf）または `AsyncGetCallTrace` |
| 主な出力 | **フレームグラフ**（SVG） |
| 言語 | C++（コアエンジン）+ Java（API） |

JFR が「**JVM 内部のイベント記録**」中心なのに対し、async-profiler は「**OS の CPU プロファイラを Java の世界に持ち込んだもの**」と覚えると、関係が分かりやすいです。

---

## なぜ async-profiler を選ぶか

JFR と機能が重なる部分もありますが、async-profiler を選ぶ理由として、

### 1. ネイティブのスタックも見える

JFR は基本的に**Java のスタック**を記録します。
async-profiler は、OS のパフォーマンスカウンタを使うので、

- **JNI 呼び出し**の先の C/C++ コード
- **kernel** のシステムコール
- **JVM 自身**の C++ コード

までスタックに現れます。
「**ネイティブまで深く見たい**」とき、async-profiler は強力です。

### 2. フレームグラフが綺麗

async-profiler の標準出力は、**SVG 形式のフレームグラフ**です。
ブラウザで開いて、ズーム・絞り込み・検索ができる対話的な UI が、すぐ使えます。

```text line-numbers=false
$ ./profiler.sh -d 60 -f flame.html <pid>
```

これで `flame.html` が出来上がり、ブラウザで開くだけ。
JFR + JMC のセットアップより**シンプル**です。

### 3. 設定が極めて軽い

`./profiler.sh start <pid>`、`./profiler.sh stop <pid>` という感じで、**コマンド 1 つ**で完結。
JVM 起動時のオプションは不要です（ロードに `LD_PRELOAD` や `-agentpath` が必要なケースはありますが、基本は不要）。

---

## JFR と async-profiler の使い分け

両者を比べて、判断軸を整理します。

| やりたいこと | 推奨 |
|---|---|
| **CPU のホットメソッドが知りたい** | どちらでも可、async-profiler のフレームグラフが見やすい |
| **GC ・ JIT 等の JVM 内部イベント**を見たい | **JFR** |
| **ネイティブコード**まで降りたい | **async-profiler** |
| **本番で常時 ON** にしたい | **JFR**（連続記録モード） |
| **業務イベント**を JVM イベントと一緒に分析 | **JFR**（カスタムイベント） |
| **コンテナ内**で簡単に取りたい | async-profiler のほうがセットアップ簡単 |
| **GUI で分析**したい | JFR + JMC |

ふたつは補完的なので、「**どちらかだけ**」ではなく、**両方使える**ようにしておくのが理想です。

---

## 「**フレームグラフ**」の読み方

async-profiler の主な出力、**フレームグラフ**（flame graph）の読み方を整理します。

```text line-numbers=false
    │
    │ [Foo.process]
    │     [Foo.parse]
    │         [HashMap.get]
    │         [HashMap.hash]
    │     [Foo.validate]
    │ [Foo.cleanup]
時間軸 →
```

- **x 軸** ―― CPU 時間（の比率）
- **y 軸** ―― 呼び出し階層（下が呼び出し元、上が呼ばれた先）
- **幅** ―― そのメソッドが CPU を使った時間（広いほど多い）

「**頂上の最も広いブロック**」が、**最もホットなメソッド**です。
最初は階層が深くて混乱しますが、慣れると**一目で**ボトルネックが分かるようになります。

---

## アロケーションプロファイル

async-profiler は、CPU だけでなく**アロケーション**もプロファイルできます。

```text line-numbers=false
$ ./profiler.sh -e alloc -d 60 -f alloc.html <pid>
```

`-e alloc` で、TLAB の割り当てを記録します。
**「どこで多くオブジェクトを作っているか**」が、フレームグラフで見えます。
JFR の TLAB Allocations と同じ情報ですが、**SVG 1 枚で完結**するのが便利です。

---

## ロックプロファイル

ロック競合のプロファイルもあります。

```text line-numbers=false
$ ./profiler.sh -e lock -d 60 -f lock.html <pid>
```

`synchronized` ロック・`ReentrantLock`・`LockSupport.park` などの**待ち時間**を可視化します。
スレッド競合のホットスポットを探すのに使えます。

---

## 「**何を測るか**」を間違えない

プロファイラを使うとき、最もよくある失敗は、

> **CPU プロファイルを取ったが、本当のボトルネックは I/O だった**

というものです。
プログラムが「遅い」原因が CPU か I/O かは、まず判別が必要です。

```text line-numbers=false
$ top -p <pid>
```

で CPU 使用率を見て、

- **80% 以上** → CPU バウンド、**CPU プロファイル**を取る
- **数 %** → I/O バウンド、**JFR の Socket I/O・File I/O** を取る

「**CPU で遅いのか、待ちで遅いのか**」 ―― これを最初に判定するだけで、プロファイルの取り方が決まります。

---

## まとめると

- **async-profiler** は、OS のパフォーマンスカウンタを使う低オーバーヘッドプロファイラ
- **ネイティブまで深く**見える、**フレームグラフ**が綺麗
- JFR と用途が重なる部分もあるが、**補完的**に使うのがおすすめ
- **CPU・アロケーション・ロック**の 3 種が主な計測対象
- 計測前に「**CPU バウンドか I/O バウンドか**」を判定するのが重要

次の節では、JFR と async-profiler を**実際の問題**にどう適用するか、典型的な分析パターンを見ていきます。

---
title: GC ログを読む
llm: true
---

## GC ログを読む

GC は、自分が動くたびに**ログを出します**。
このログを読めるようになると、本番で何が起きているか ―― ヒープがリークしているのか、GC が間に合っていないのか ―― が**目で見える**ようになります。

---

## まずはログを出す

GC ログは、起動オプションで取得します。Java 9 以降は `-Xlog:gc` という統一フォーマットになりました。

```text line-numbers=false
# 最低限のログ
$ java -Xlog:gc MyApp

# 詳細なログ（マイナー / メジャー の内訳まで）
$ java -Xlog:gc* MyApp

# ファイルに書き出す
$ java -Xlog:gc:file=gc.log MyApp

# ローテーション付き（運用ではほぼこれ）
$ java -Xlog:gc:file=gc.log::filecount=10,filesize=10M MyApp
```

`-Xlog:gc` で最低限、`-Xlog:gc*`（アスタリスク）でより詳細です。
本番では、**最低限の `-Xlog:gc` をファイルに出力**しておく ―― これだけでも、後でトラブル調査の決定打になります。

---

## 1 行を読み解く

実機で `GcDemo2.java`（毎ループで 100 KB の `byte[]` を確保）を、`-Xmx64m` で動かしたログです。

```text line-numbers=false
[0.004s][info][gc] Using G1
[0.019s][info][gc] GC(0) Pause Young (Normal) (G1 Evacuation Pause) 35M->4M(64M) 0.612ms
```

それぞれの部分を分解してみましょう。

| 部分 | 意味 |
|---|---|
| `[0.019s]` | JVM 起動からの経過時間 |
| `[info][gc]` | ログレベルとカテゴリ |
| `GC(0)` | 0 回目の GC（連番） |
| `Pause Young` | **マイナー GC**（Young 領域の停止回収） |
| `(Normal)` | 通常のマイナー（緊急ではない） |
| `(G1 Evacuation Pause)` | G1 のエヴァキュエーション（生きてるオブジェクトをコピー）フェーズ |
| `35M->4M(64M)` | **回収前 35 MB → 回収後 4 MB / 全体 64 MB** |
| `0.612ms` | この GC でかかった時間（STW 時間） |

つまり「マイナー GC が 1 回走り、35 MB から 4 MB まで減らした。所要時間は 0.6 ms」と読めます。
**31 MB ぶんのゴミが回収できた**わけです。

---

## マイナーかメジャーか

`Pause` のあとに続く語で、GC の種類が分かります。

| 表記 | 種類 |
|---|---|
| `Pause Young` | **マイナー GC**（Young のみ） |
| `Pause Full` | **フル GC**（Young + Old + Metaspace） |
| `Pause Initial Mark` | G1 の同時マーク開始（マイナーに乗ることが多い） |
| `Pause Remark` | G1 の同時マーク確定 |
| `Pause Cleanup` | G1 のリージョン整理 |
| `Concurrent Mark Cycle` | 並行マーク（**STW なし**） |
| `Concurrent Undo Cycle` | 並行で同時マークをやり直し |

`Concurrent` が付くものは**並行**（アプリと同時に動く）なので、停止時間に含まれません。
`Pause` が付くものが**STW**で、ここがレイテンシに直撃します。

---

## OOM 直前のログ ―― リークの足跡

「メモリリークがある」状態をログから見破る練習をしてみましょう。
`-Xmx64m` で、参照を `List` に貯め続けるアプリを動かすと、OOM 直前にこんなログが出ます。

```text line-numbers=false
[0.022s][info][gc] GC(4) Pause Young (Prepare Mixed) (G1 Humongous Allocation) (Evacuation Failure: Allocation) 61M->61M(64M) 0.228ms
[0.023s][info][gc] GC(5) Pause Full (G1 Compaction Pause) 61M->61M(64M) 1.205ms
[0.023s][info][gc] GC(6) Pause Young (Concurrent Start) (G1 Evacuation Pause) 62M->62M(64M) 0.106ms
[0.024s][info][gc] GC(7) Pause Full (G1 Compaction Pause) 62M->62M(64M) 0.932ms
[0.024s][info][gc] GC(9) Pause Young (Concurrent Start) (G1 Humongous Allocation) 62M->62M(64M) 0.085ms
[0.025s][info][gc] GC(12) Pause Full (G1 Compaction Pause) 63M->63M(64M) 0.877ms
[0.027s][info][gc] GC(13) Pause Full (G1 Compaction Pause) 63M->63M(64M) 1.367ms
...
Exception in thread "main" java.lang.OutOfMemoryError: Java heap space
```

このログから読み取れる**異常な兆候**は、3 つあります。

1. **`Pause Full` が連発**している ―― 通常はめったに起きないフル GC が、立て続けに発生
2. **`61M->61M` → `62M->62M` → `63M->63M`** ―― GC で**ほとんど何も回収できていない**
3. **GC の所要時間が積み重なる** ―― 短時間に何回も GC が走り、アプリが進まない

特に 2 つめの「**GC を走らせても、Before と After のサイズがほぼ同じ**」は、メモリリークの**強力なシグナル**です。
ヒープに溜まっているオブジェクトが、すべて参照されていて回収できない、という状態です。

このパターンを覚えておくと、**OOM が出る前に**「リークしてるな」と気づけるようになります。

---

## 「`GC overhead limit exceeded`」も同じ兆候

`-Xmx` を超えそうになる前に、JVM 自身が「**もう GC ばっかりで進まないぞ**」と諦めて投げてくる例外があります。

```text line-numbers=false
java.lang.OutOfMemoryError: GC overhead limit exceeded
```

これは「**CPU 時間の 98 % 以上を GC に費やし、それでも 2 % 以下しかヒープを回収できない**」状態が続いた、という意味です。
ヒープの数値上はまだ少し空きがあっても、**実質詰みかけ**ということでこの例外を投げます。

「リークしている → 連発するフル GC → 進まない → `GC overhead limit exceeded`」が、典型的なリーク死亡フローです。

---

## ZGC のログを覗いてみる

ZGC のログは、G1 とはだいぶ違います。

```text line-numbers=false
$ java -XX:+UseZGC -Xlog:gc -Xmx256m MyApp
[0.012s][info][gc] Using The Z Garbage Collector
[1.234s][info][gc] GC(0) Garbage Collection (Major Collection (Allocation Rate)) 132M(51%)->24M(9%) 0.823ms
```

注目してほしいのは、

- **「Pause」がほとんど登場しない**: STW フェーズが極端に短く、ログでは「Garbage Collection」だけで括られる
- **回収率（%）も併記**: ヒープ全体の何 % か、が直感的にわかる

ZGC は、**Pause なしの並行回収が中心**なので、ログの趣も「**何 ms 止めた**」より「**いつ・どれくらい回収したか**」という見せ方になっています。

---

## GC ログ視覚化ツール

ログを目視で読むのには限界があります。
本番運用では、ログを**視覚化ツール**にかけてグラフ化するのが一般的です。

| ツール | 概要 |
|---|---|
| **GCViewer** | オープンソース。GC ログ全体を時系列グラフ化 |
| **GCEasy.io** | Web サービス。ログをアップロードして分析レポート |
| **JFR + JMC**（第48章） | JFR 経由で取った GC イベントを Java Mission Control で可視化 |

特に GCEasy.io は「**こういう問題があり、これを試すと良い**」というアドバイスまで出してくれるので、最初の取っ掛かりに向いています。

---

## まとめると

- GC ログは `-Xlog:gc` で取得。本番ではファイルにローテーション付きで出力する
- 1 行で「**経過時間・種類・Before → After (Heap)・所要時間**」が読み取れる
- `Pause Young` がマイナー GC、`Pause Full` がフル GC、`Concurrent` は並行（STW なし）
- **Before ≒ After のフル GC 連発**は、**リークの強力な兆候**
- ZGC のログは G1 と趣が違う ―― STW 時間より回収状況を中心に読む
- 視覚化は GCViewer / GCEasy / JMC で

次の節では、ここまで触れた**ヒープサイズ**と**目標**から、GC の**チューニング**を考えます。

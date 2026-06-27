---
title: Java の GC たち ― G1・ZGC・Parallel・Serial
llm: true
---

## Java の GC たち ― G1・ZGC・Parallel・Serial

Java 25 の HotSpot JVM には、複数の GC が同梱されています。
それぞれ**設計のねらい**が違うので、用途で使い分けます。
この節では、よく使われる 4 種類を紹介します。

---

## 「どれが既定?」

Java 9 以降、HotSpot JVM の**既定 GC は G1**（Garbage-First）です[^jep248-g1]。
実機で確認してみます。

```text
$ java -XX:+PrintFlagsFinal -version | grep -E "UseG1GC|UseZGC|UseParallelGC|UseSerialGC"
bool UseG1GC                = true                {product} {ergonomic}
bool UseParallelGC          = false               {product} {default}
bool UseSerialGC            = false               {product} {default}
bool UseZGC                 = false               {product} {default}
```

`UseG1GC = true {ergonomic}` の `ergonomic` は、「JVM がハードウェア構成から**自動的に**選んだ」という意味です。
別の GC を使いたいときは、起動オプションで明示します。

| GC | 起動オプション |
|---|---|
| G1 GC | `-XX:+UseG1GC`（既定） |
| ZGC | `-XX:+UseZGC` |
| Parallel GC | `-XX:+UseParallelGC` |
| Serial GC | `-XX:+UseSerialGC` |

---

## G1 GC（Garbage-First）

**現代の Java の標準**です。Java 9 で既定になり、以後ずっとこの座を守っています。

### 特徴

| 項目 | |
|---|---|
| 設計のねらい | レイテンシとスループットの**バランス** |
| ヒープの分割 | **リージョン**（既定 1〜32 MB の小区画、約 2000 個） |
| 世代別 | あり（リージョンに Young / Old / Humongous の役割を割り振る） |
| STW | あり（マークの一部は並行、コピーは STW） |
| 向いている用途 | **大半の Web アプリ、業務システム**、ヒープ数 GB〜数十 GB |

### 「Garbage-First」の名の由来

「**ゴミがいちばん多いリージョンから優先的に回収する**」 ―― これが名前の由来です。
ヒープ全体を一度に回るのではなく、

1. ヒープを 2000 個ほどのリージョンに分割
2. 各リージョンに、Young / Survivor / Old / Humongous の**役割を動的に割り当てる**
3. GC のとき、「**生きてるオブジェクトが少ない（＝ゴミが多い）**」リージョンから回収
4. 制限時間（**目標停止時間**）の中で、回収できるだけ回収する

これにより、ヒープが大きくても、1 回の GC で**狙った時間内**に終わらせやすくなりました。
目標停止時間は `-XX:MaxGCPauseMillis=200`（既定 200 ms）で指定します。

### 弱点

- 圧倒的な低レイテンシは出ない（最悪ケースは数十〜数百 ms）
- 巨大ヒープ（数百 GB〜TB）には、ZGC のほうが向く

---

## ZGC

**超低レイテンシ**を狙った GC です。Java 11 で実験的に、Java 15 で本番投入可能になりました[^jep377-zgc]。
そして Java 21 で**世代別 ZGC**（Generational ZGC、`-XX:+ZGenerational`）が追加され、Java 23 でそれが**既定**になりました[^jep439-generational-zgc]。

### 特徴

| 項目 | |
|---|---|
| 設計のねらい | **STW を 1 ms 以下**に抑える |
| ヒープサイズ | **数 MB〜数 TB** まで |
| 世代別 | **あり**（Java 23 以降） |
| STW | 極小（マークもコピーも、ほぼ並行で実行） |
| 向いている用途 | レイテンシ最優先（広告配信、トレーディング、リアルタイムシステム） |

### どうして 1 ms 以下が可能か

ZGC は、参照を辿る・オブジェクトを移動する処理を、**アプリケーションスレッドと並行**で進めます。
鍵になるのが、**読み取りバリア**（read barrier）と**カラー付きポインタ**（colored pointers）という仕組みです。

ざっくり言うと、参照を読むたびに「**この参照は GC が移動中ではないか**」を低コストでチェックし、移動中なら新しい場所にこっそり書き換える ―― ということをやっています。
そのため、GC で**全体を止める必要がない**のです。

### 弱点

- スループットは、G1 より**やや低い**ことがある
- メモリオーバーヘッドは、G1 より少し多い
- 小さいヒープ（数百 MB）では恩恵が出にくい

---

## Parallel GC

**スループット最優先**の GC です。Java 8 までの既定でした。

### 特徴

| 項目 | |
|---|---|
| 設計のねらい | **GC の合計時間を最小化**（＝アプリの処理量を最大化） |
| 世代別 | あり（Young はコピー GC、Old はマーク&コンパクト） |
| STW | あり、しかも**長め**。ただし**並列**に複数スレッドで実行 |
| 向いている用途 | バッチ、データ処理、レイテンシより**総処理時間**が大事なジョブ |

「**Parallel**」は「**マルチスレッドで並列に GC を実行**」という意味です。
名前のとおり、CPU を全力で使って GC を片付けます。

「**少々止まっても、合計で速いほうがいい**」というジョブには、今でも有力な選択肢です。

---

## Serial GC

**シングルスレッド**で動く、最もシンプルな GC です。

### 特徴

| 項目 | |
|---|---|
| 設計のねらい | **小さなフットプリント**と**シンプルさ** |
| 世代別 | あり |
| STW | あり（しかもシングルスレッドなので、回収中は他に何もできない） |
| 向いている用途 | **コンテナの中の小さなサービス**、CPU 1 コアしかない環境 |

「Serial」は **シングルスレッド**（直列） の意味です。
CPU が 1〜2 コアしかない、ヒープも数百 MB の環境では、Parallel や G1 の**並列化のオーバーヘッド**より、Serial のシンプルさのほうが効率的なことがあります。

`-XX:+UseSerialGC` で明示的に指定するか、JVM が「CPU 少なくメモリ少ない」と判断したときに自動的に選ばれます。

---

## 比べてみる

各 GC の特徴を、ひとことで比べると：

| GC | レイテンシ | スループット | ヒープサイズ | 向く用途 |
|---|---|---|---|---|
| **Serial** | △ | △ | 〜数百 MB | 小さなコンテナ |
| **Parallel** | △ | ◎ | 数 GB | バッチ・分析 |
| **G1** | ○ | ○ | 数 GB〜数十 GB | **大半の Web/業務** |
| **ZGC** | ◎ | ○ | 数百 MB〜数 TB | 低遅延が必須 |

「とりあえず迷ったら G1」、レイテンシで困ったら ZGC を試す ―― これがおおまかな指針です。

---

## おまけ: Epsilon GC ―― 何もしない GC

**Epsilon GC**（`-XX:+UseEpsilonGC -XX:+UnlockExperimentalVMOptions`）という変わり種もあります。
これは「**まったく回収しない**」 GC です。割り当てだけして、ヒープが尽きたら `OutOfMemoryError` で落ちます。

なぜそんなものが?
というと、

- 超短命のジョブ（一瞬で終わるバッチ）で、GC のオーバーヘッドを完全にゼロにしたい
- GC の影響を排除したパフォーマンス計測の基準値を取りたい

といった用途のためです。本番の汎用 GC としては**選びません**。

---

## 「コンテナの中の Java」と GC

Docker や Kubernetes 内で Java を動かすとき、JVM は**コンテナの cgroups から CPU / メモリの上限を読み取って**、自動的に GC を選んでくれます（Java 10 以降の **コンテナ対応**機能）。

| 環境 | 自動選択される傾向 |
|---|---|
| CPU 2 コア以上、メモリ 1.5 GB 以上 | **G1** |
| それより小さい | **Serial** |

意図せず Serial が選ばれて「**コンテナ内の Web アプリの止まりが長い**」と困ったら、`-XX:+UseG1GC` を明示するのが第一歩です。

また、コンテナでは `-Xmx` を直接指定するか、`-XX:MaxRAMPercentage=75.0` のような**割合指定**を使います。
これを忘れると、Java はホストのメモリを見てしまい、コンテナ上限を超えて OOM Killer に殺される、という事故が起きます。

---

## まとめると

- Java 25 の標準 GC は **G1**。`ergonomic` で自動選択される
- **G1** はリージョンベース、レイテンシとスループットのバランス型
- **ZGC** は STW 1 ms 以下を狙う、低レイテンシ特化
- **Parallel** はスループット最優先、バッチ向き
- **Serial** はシングルスレッド、小さなコンテナ向き
- **コンテナでは、明示の `-Xmx` と `-XX:+UseG1GC` が無難**

次の節では、これらの GC が実際にどう動いているかを示す **GC ログ**の読み方を見ていきます。

[^jep248-g1]: JEP 248: Make G1 the Default Garbage Collector, <https://openjdk.org/jeps/248>。Java 9（2017年）で G1 が HotSpot のデフォルト GC となった。Oracle, "HotSpot Virtual Machine Garbage Collection Tuning Guide," <https://docs.oracle.com/en/java/javase/25/gctuning/> も参照。

[^jep377-zgc]: JEP 377: ZGC: A Scalable Low-Latency Garbage Collector (Production), <https://openjdk.org/jeps/377>。Java 15（2020年）で本番投入可能になった。JEP 333（Java 11）で実験段階として導入された。

[^jep439-generational-zgc]: JEP 439: Generational ZGC, <https://openjdk.org/jeps/439>。Java 21（2023年）で導入。世代別ヒープによりオーバーヘッドを削減した ZGC のバージョンで、JEP 474（Java 23）でデフォルトとなった。

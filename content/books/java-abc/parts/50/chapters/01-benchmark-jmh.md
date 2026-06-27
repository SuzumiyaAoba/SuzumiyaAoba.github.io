---
title: 「速くする」前に測る ― ベンチマークと JMH
llm: true
---

## 「速くする」前に測る ― ベンチマークと JMH

ベンチマークは、性能改善の出発点であり終着点です。
「**こう書くと速い**」のような感覚を信じる前に、**測って確かめる**。
この節では、Java の標準的なベンチマークツール **JMH**（Java Microbenchmark Harness）の使い方を見ていきます。

---

## なぜ JMH か

ふつうに `System.nanoTime()` で時間を計っても、

```java
long t = System.nanoTime();
for (int i = 0; i < 1_000_000; i++) {
    doWork();
}
long elapsed = System.nanoTime() - t;
```

これでは**正確に測れません**。第41章で見たとおり、

- **JIT のウォームアップ**で、最初の数千回は遅い
- **デッドコード除去**: 戻り値を使わないと、計算ごと消される
- **常数畳み込み**: 引数が固定だと、ループの中身が事前計算される
- **GC のタイミング**で揺らぐ

JMH は、これらの問題を**正しく回避**しながら測れる、Java 公式のベンチマークフレームワークです[^jmh]。

---

## 最小の JMH ベンチマーク

`pom.xml` に依存を入れて:

```xml
<dependency>
  <groupId>org.openjdk.jmh</groupId>
  <artifactId>jmh-core</artifactId>
  <version>1.37</version>
</dependency>
<dependency>
  <groupId>org.openjdk.jmh</groupId>
  <artifactId>jmh-generator-annprocess</artifactId>
  <version>1.37</version>
  <scope>provided</scope>
</dependency>
```

「**`String.concat`** と `StringBuilder` の速度比較」を書いてみます。

```java
import org.openjdk.jmh.annotations.*;
import java.util.concurrent.TimeUnit;

@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@State(Scope.Benchmark)
@Warmup(iterations = 3, time = 1)
@Measurement(iterations = 5, time = 1)
@Fork(2)
public class StringBenchmark {

    String a = "Hello, ";
    String b = "World!";

    @Benchmark
    public String concat() {
        return a + b;
    }

    @Benchmark
    public String builder() {
        return new StringBuilder().append(a).append(b).toString();
    }
}
```

それぞれのアノテーションの意味は:

- `@BenchmarkMode(Mode.AverageTime)` ―― 平均時間で計測
- `@OutputTimeUnit(TimeUnit.NANOSECONDS)` ―― 結果を ns 単位で表示
- `@Warmup(iterations = 3, time = 1)` ―― ウォームアップを 1 秒 × 3 回
- `@Measurement(iterations = 5, time = 1)` ―― 計測を 1 秒 × 5 回
- `@Fork(2)` ―― **別 JVM を 2 回**起動して計測（再現性を高める）

---

## ビルドと実行

JMH は、**専用の jar** をビルドして実行します。

```text
$ mvn clean package
$ java -jar target/benchmarks.jar StringBenchmark
```

出力例:

```text
Benchmark               Mode  Cnt   Score    Error  Units
StringBenchmark.concat  avgt   10  12.345 ±  0.567  ns/op
StringBenchmark.builder avgt   10  15.678 ±  0.789  ns/op
```

「**`+` のほうが `StringBuilder` より速い**」 ―― これは Java 9 以降の `invokedynamic` ベースの文字列連結（第41章）が、ふつうの `StringBuilder` 利用より最適化されているからです。

「**`StringBuilder` のほうが速い**」と一般に信じられていますが、**測れば実は逆**だった、ということが分かります。
**測ってから判断する**ことの威力です。

---

## ウォームアップの意味を再確認

JMH の `@Warmup` は、第41章で何度も触れた JIT ウォームアップを**フレームワークが面倒見てくれる**もの。
ウォームアップ反復で

- JIT がメソッドを Tier 4 まで持っていく
- インライン化・エスケープ解析が落ち着く
- GC のリズムが安定する

を待ってから、本計測に入ります。
これがないベンチマーク数字は、**信用できない数字**です。

---

## デッドコード除去への対策 ―― `Blackhole`

ベンチマークで返り値を使わない場合、JIT は

「**この戻り値は使われない → 計算を消そう**」

と最適化することがあります。これを防ぐのが **`Blackhole`** です。

```java
@Benchmark
public void doWork(Blackhole bh) {
    long result = expensive();
    bh.consume(result);   // ← 結果を捨てたフリ、JIT には削れない
}
```

`bh.consume(...)` の中身が複雑なので、JIT は安全にデッドコード除去できません。
**`return` するか、`Blackhole` に渡すか**で、結果を「使ってる感」を出すのが鉄則です。

---

## パラメータ化 ―― `@Param`

同じベンチマークを、複数のサイズ・条件で測りたい:

```java
@Param({"10", "100", "1000"})
public int size;

@Setup
public void setUp() {
    list = new ArrayList<>(size);
    for (int i = 0; i < size; i++) list.add(i);
}

@Benchmark
public int sum() {
    int s = 0;
    for (int x : list) s += x;
    return s;
}
```

`@Param` で渡した値の組み合わせで、JMH が**マトリクス的に**ベンチマークを回します。

---

## 「**マイクロ**」と「**マクロ**」

JMH は名前のとおり「**マイクロベンチマーク**」用です。
1 メソッドや 1 ループの速度を**ナノ秒精度**で測ります。

一方、Web アプリ全体の throughput（req/s）を測るには、**マクロベンチマーク**ツールが向きます。

- **wrk**: HTTP 負荷ツール
- **JMeter**: GUI ベース、シナリオを書きやすい
- **k6**: スクリプトで書ける、CI 統合しやすい
- **Gatling**: Scala / DSL ベース、Java の世界で人気

「**この処理の最適化を比較**」なら JMH、「**アプリ全体の性能評価**」ならマクロ ―― 使い分けます。

---

## ベンチマークでよくある間違い

最後に、ベンチマークでやりがちな失敗を 4 つ:

### 1. **`System.out.println` をベンチに入れる**

I/O は計測対象を**完全に支配**します。意図しないなら入れない。

### 2. **JMH なしで `nanoTime` を取る**

ウォームアップ・デッドコード除去・GC ノイズで、**信用ならない数字**になる。

### 3. **1 回しか計測しない**

ばらつきを見ないと、たまたまの数字を結論にしてしまう。
**最低 3 回、できれば 5 回**は測る。

### 4. **計測環境がバラバラ**

ローカルの Mac とサーバーの Linux で、JIT の挙動が違うことがあります。
**本番に近い環境**で測りましょう。

---

## まとめると

- **JMH** が、Java 公式のマイクロベンチマークフレームワーク
- **ウォームアップ・フォーク・デッドコード除去対策**を自動でやる
- `@Benchmark` でメソッドを宣言、`@Warmup`・`@Measurement`・`@Fork` で条件指定
- `Blackhole` で結果を「使ってる」ように見せる
- マクロベンチマークは、**wrk・JMeter・k6** などが向く
- 「測ってから判断する」が鉄則

次の節では、計測結果を踏まえて、**ヒープと GC の調整**を実践します。

[^jmh]: OpenJDK, "Java Microbenchmark Harness (JMH)," <https://github.com/openjdk/jmh>。Java の HotSpot 開発チームが提供する公式のマイクロベンチマークフレームワーク。Aleksey Shipilev による。`@Benchmark`、`@Warmup`、`@Measurement`、`@Fork`、`Blackhole` などの仕組みで JIT 由来の測定誤差を抑える。

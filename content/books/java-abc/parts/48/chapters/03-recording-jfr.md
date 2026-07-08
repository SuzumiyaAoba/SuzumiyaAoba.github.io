---
title: JFR でデータを取る
llm: true
---

## JFR でデータを取る

この節では、実際に `.jfr` を取得し、内容を覗いてみます。
最小限のサンプルを使って、起動時・実行中・解析の流れを通します。

---

## 実機例: 軽いサンプルプログラム

まず、何かしらのプログラムが必要です。
ここでは、毎ループで小さな割り当てと sleep を繰り返す素朴な例を使います。

```java
public class JfrDemo {
    public static void main(String[] args) throws Exception {
        for (int i = 0; i < 30; i++) {
            byte[] data = new byte[100_000];
            Thread.sleep(50);
        }
    }
}
```

---

## 取り方1: 起動オプションで

最も簡単な方法は、`-XX:StartFlightRecording=...` を渡すことです。

```text line-numbers=false
$ javac JfrDemo.java
$ java -XX:StartFlightRecording=filename=demo.jfr,duration=3s JfrDemo
[0.168s][info][jfr,startup] Started recording 1. The result will be written to:
[0.168s][info][jfr,startup] /path/to/demo.jfr
$ ls -la demo.jfr
-rw-r--r--  1 user  staff  353K  ...  demo.jfr
```

3 秒間の記録で 353 KB ―― それなりのデータ量です。
プログラムが終わらなくても、duration が来たら自動でファイルに書き出されます。

---

## 取り方2: 実行中に jcmd で

`-XX:StartFlightRecording` を付け忘れた、または起動時に取りたくない場合は、**実行中**に `jcmd` で開始できます。

### プロセス ID を調べる

```text line-numbers=false
$ jps
12345 MyApp
12346 Jps
```

### 記録を開始

```text line-numbers=false
$ jcmd 12345 JFR.start name=session1 duration=60s filename=mid.jfr
Started recording 1. The result will be written to:
/path/to/mid.jfr
```

### 記録を確認

```text line-numbers=false
$ jcmd 12345 JFR.check
Recording 1: name=session1 (running)
```

### 記録を即座にダンプ

実行中の記録を、**今この瞬間**のデータでファイルに保存できます。

```text line-numbers=false
$ jcmd 12345 JFR.dump name=session1 filename=snapshot.jfr
```

連続記録モード（`maxage=1h` など）で問題発生時にこのコマンドを打つ ―― それが現代の Java 本番運用の定石です。

---

## 取り方3: 業務コードから JFR API で

`jdk.jfr` パッケージの API を使えば、コードから動的にコントロールできます。

```java
import jdk.jfr.*;

Recording recording = new Recording();
recording.setName("api-session");
recording.setDuration(java.time.Duration.ofMinutes(2));
recording.setDestination(java.nio.file.Path.of("api.jfr"));
recording.start();

// ... 業務処理 ...

recording.stop();
recording.close();
```

特定の処理だけを計測したい、特定の条件下でのみ記録したい、そんなときに使います。
ふだんはコマンドラインで済むので、業務コードに入れる必要はほぼありません。

---

## `.jfr` を覗く ―― `jfr` コマンド

取った `.jfr` の中身は、**JDK 標準の `jfr` コマンド**で覗けます。

### 全体のサマリ

```text line-numbers=false
$ jfr summary demo.jfr

 Version: 2.1
 Chunks: 1
 Start: 2026-06-24 10:02:07 (UTC)
 Duration: 2 s

 Event Type                              Count  Size (bytes)
=============================================================
 jdk.NativeLibrary                        1046         92041
 jdk.SystemProcess                         673         66383
 jdk.BooleanFlag                           483         14327
 jdk.ActiveSetting                         376          9345
 jdk.ModuleRequire                         156          1560
 jdk.LongFlag                              138          4295
 ...
```

`jfr summary` で、

- **記録時間**（2 秒）
- **イベントの種類別件数**

がわかります。
これだけでも、「何が起きていたか」のおおまかな感じがつかめます。

### 特定のイベントを抜き出す

```text line-numbers=false
$ jfr print --events jdk.GarbageCollection demo.jfr | head -20

jdk.GarbageCollection {
  startTime = 10:02:07.123
  gcId = 0
  name = "G1New"
  cause = "G1 Evacuation Pause"
  sumOfPauses = 1.234 ms
  longestPause = 1.234 ms
}
```

`--events` でイベント名を指定して、その種類だけを取り出します。
GC、ロック、ファイル I/O ―― 興味のあるものだけを抜き出して、テキストで分析できます。

### イベント名を一覧する

```text line-numbers=false
$ jfr metadata demo.jfr | head -20
```

`jfr metadata` で、その `.jfr` に含まれる**全イベントタイプ**を一覧できます。

---

## 解析の入り口 ―― JFR でわかる典型的なこと

`.jfr` を解析すると、たとえば次のような問いに**実測で**答えられます。

### 「**CPU を最も使ったメソッドはどれ?**」

```text line-numbers=false
$ jfr print --events jdk.ExecutionSample --stack-depth 5 demo.jfr | head -30
```

`ExecutionSample` イベントから、サンプリング時のスレッドスタックを取り出し、それを集計すれば**ホットメソッド**が見えます。
本格的にはこの後 JMC でフレームグラフ表示するのが定石です（次節）。

### 「**GC は何 ms 止めた?**」

```text line-numbers=false
$ jfr print --events jdk.GarbageCollection demo.jfr | grep sumOfPauses
```

それぞれの GC 時間を集計すれば、**累計の止め時間**がわかります。

### 「**最もロックを待ったスレッドは?**」

```text line-numbers=false
$ jfr print --events jdk.JavaMonitorWait demo.jfr
```

`JavaMonitorWait` で `synchronized` ロックの待ちが、`jdk.ThreadPark` で `LockSupport.park` の待ちが見えます。
スレッド名で集計すれば、ロック競合のホットスポットが分かります。

---

## グラフィカルに解析するには ―― JMC へ

CLI も強力ですが、

- フレームグラフ
- 時間軸でのイベントの並び
- スレッドのタイムライン

などは、視覚的なツールでないと辛いです。
そのために、次節で扱う **JMC**（Java Mission Control）が用意されています。

---

## まとめると

- JFR の取り方は **3 通り**: 起動オプション、`jcmd`、JFR API
- 起動オプションでは `-XX:StartFlightRecording=...` を渡す
- 実行中は `jcmd <pid> JFR.start ...` / `JFR.dump ...`
- `.jfr` の中身は `jfr summary`・`jfr print`・`jfr metadata` で覗ける
- グラフィカルな解析は、次節の **JMC** で

次の節では、JMC（Java Mission Control）を使った、より深い解析の入り口を見ていきます。

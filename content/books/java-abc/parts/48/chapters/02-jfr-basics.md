---
title: JFR の基本
llm: true
---

## JFR の基本

**JFR**（Java Flight Recorder）は、JDK に**標準で**入っているプロファイラです。
かつては Oracle の商用 JDK でしか使えませんでしたが、Java 11 以降は **OpenJDK にも組み込まれて無料**で使えます[^jep328-jfr]。
この節では、その仕組みと**何が記録されるか**を整理します。

---

## JFR のしくみ

JFR を簡単に言うと、

> JVM 内部で起きるイベントを、**ローオーバーヘッド**でリングバッファに記録する仕組み

です。
ふつうのプロファイラのように「外からスタックを覗く」のではなく、**JVM 自身がイベントを発火**します。
そのため、

- オーバーヘッドが**極めて小さい**（< 1 %）
- 取得が**ほとんど常に安全**
- JIT・GC・クラスローディングなど、**JVM 内部の情報**まで取れる

という、ほかのプロファイラにはない利点があります。

---

## JFR が記録するイベント

JFR は、**何百種類**ものイベントを記録できます。
代表的なものを表で示します。

| カテゴリ | イベント | 何がわかるか |
|---|---|---|
| CPU | `jdk.CPULoad` | プロセス・システム全体の CPU 使用率 |
| CPU | `jdk.ExecutionSample` | サンプリング時の各スレッドのスタック |
| メモリ | `jdk.ObjectAllocationInNewTLAB` | オブジェクト割り当ての履歴 |
| GC | `jdk.GarbageCollection` | GC の開始・終了・所要時間 |
| スレッド | `jdk.ThreadPark` / `jdk.JavaMonitorWait` | スレッドが待った時間とロック |
| クラス | `jdk.ClassLoad` | クラスロードのタイミング |
| 例外 | `jdk.JavaErrorThrow` | 投げられた例外 |
| ファイル I/O | `jdk.FileRead` / `jdk.FileWrite` | ファイル I/O の所要時間 |
| ソケット I/O | `jdk.SocketRead` / `jdk.SocketWrite` | ネット I/O の所要時間 |

これらを使えば、

- 「**起動から 5 分後に、`getUser` メソッドが CPU の 50 % を占めた**」
- 「**3 秒間で、`String.concat` が 100 万回呼ばれた**」
- 「**毎分平均 200 個の Full GC が走っている**」

といった具体的な事実が、見えてきます。

---

## イベントの粒度 ―― default vs profile

JFR には、デフォルトで 2 つの**設定プロファイル**が用意されています。

| 設定 | オーバーヘッド | 内容 |
|---|---|---|
| **`default`** | < 1 % | 本番運用向け。基本イベントのみ |
| **`profile`** | 1〜2 % | 詳細分析向け。CPU サンプリング・割り当てもオン |

これらは `.jfc`（JFR Configuration）ファイルとして、JDK の `$JAVA_HOME/lib/jfr/` の下にあります。
さらに細かい設定が必要なら、`.jfc` を編集して**カスタム設定**を作れます。

---

## ジャストインタイムに取る

JFR の運用パターンは、大きく 3 通りです。

### 1. ワンショット ―― 起動オプションで指定

```text
$ java -XX:StartFlightRecording=filename=demo.jfr,duration=60s MyApp
```

「起動から 60 秒間、demo.jfr に記録する」という指定です。
**短時間のデバッグ**や、テスト時の計測に向きます。

### 2. ディレイ付きワンショット ―― ウォームアップ後に取る

```text
$ java -XX:StartFlightRecording=delay=30s,duration=2m,filename=demo.jfr MyApp
```

JIT のウォームアップが終わるのを待ってから、計測を始めます。
ベンチマーク的な用途に向きます。

### 3. 連続記録 ―― 本番運用向け

```text
$ java -XX:StartFlightRecording=maxage=1h,maxsize=200m,filename=continuous.jfr,disk=true MyApp
```

**過去 1 時間分**を**最大 200 MB** のディスク上のリングバッファに残し続ける、という指定です。
問題が起きたとき、**直前の 1 時間**を保存できます。

```text
# 問題発生時、その瞬間のスナップショットを取る
$ jcmd <pid> JFR.dump filename=incident.jfr
```

JFR を**常時 ON**にしておく ―― これが、本番環境での「**事故が起きたとき、後から原因を追える**」運用の鉄則です。

---

## 「**常時 ON**」を支える設計

JFR の特徴的な設計が、**リングバッファ**です。

```text
[書き込み]  → [スレッドローカルバッファ] → [グローバルバッファ] → [ファイル]
```

スレッドごとに小さなバッファに書き、**ロック不要**でイベントを記録します。
バッファが満杯になったら、グローバルバッファへ。
そこからディスクへ、という流れです。

リングバッファなので、**古いデータは新しいデータで上書き**されます。
これにより、永久にメモリ・ディスクを消費せず、**直近 N 分**だけを残せます。

---

## JFR で「カスタムイベント」を取る

JFR の素晴らしいところは、**自分のアプリのコードからも**イベントを発火できることです。

```java
import jdk.jfr.*;

@Name("com.example.OrderProcessed")
@Label("Order Processed")
@Category("Order")
public class OrderProcessedEvent extends Event {
    @Label("Order ID")
    public long orderId;

    @Label("Customer")
    public String customer;
}

// 業務コードの中で
OrderProcessedEvent e = new OrderProcessedEvent();
e.begin();
processOrder(order);
e.orderId = order.getId();
e.customer = order.getCustomer();
e.commit();   // ここで終了時刻も自動的に記録
```

これで、**業務イベント**を JFR の他のイベントと**同じ時間軸**に並べて分析できます。
「**注文処理が 100 ms 以上かかったときの GC は?**」 ―― そんなクロス分析が、JFR の中で完結します。

---

## まとめると

- **JFR** は JDK 標準のプロファイラ、Java 11 以降は OpenJDK にも内蔵
- JVM 内部のイベントを、**ローオーバーヘッド**でリングバッファに記録
- 記録対象は **CPU・メモリ・GC・スレッド・I/O・例外**など多数
- 設定プロファイルは **`default`** と **`profile`** の 2 つ
- 運用パターンは **ワンショット・ディレイ付き・連続記録**の 3 通り
- 業務コードから**カスタムイベント**を発火でき、クロス分析できる

次の節では、実機で `.jfr` を取得し、内容を `jfr` コマンドで覗くまでを順を追って見ていきます。

[^jep328-jfr]: JEP 328: Flight Recorder, <https://openjdk.org/jeps/328>。Java 11（2018年9月）で Oracle JDK から OpenJDK に寄贈・オープンソース化された。Oracle, "Java Flight Recorder User Guide," <https://docs.oracle.com/en/java/javase/25/jfapi/> も参照。

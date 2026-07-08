---
title: JMC で見る
llm: true
---

## JMC で見る

**JMC**（Java Mission Control）は、JFR の `.jfr` ファイルを**グラフィカルに**解析するためのデスクトップアプリです。
かつては Oracle JDK にバンドルされていましたが、現在は**独立したオープンソースプロジェクト**になっています。

---

## インストール

JMC は、JDK には**同梱されません**。別途インストールします。

| 入手元 | 内容 |
|---|---|
| [AdoptOpenJDK / Adoptium](https://adoptium.net/jmc/) | コミュニティビルド |
| [Eclipse JMC](https://www.eclipse.org/openj9/jmc.html) | OpenJDK 公式 |

ダウンロードして展開し、`jmc` 実行ファイルを起動すれば使えます。
モダンな macOS なら、Homebrew で `brew install --cask jdk-mission-control` でも入ります。

---

## `.jfr` を開く

JMC を起動して、File → Open File... で取得した `.jfr` を開くだけ。
左側に**ペイン**（自動分析・スレッド・メモリ・I/O・コードなど）が並び、選ぶと該当の解析画面が出ます。

---

## 「自動分析」のペイン

JMC を立ち上げて最初に見る画面は、**Automated Analysis Results** です。
ここに、JMC が**自動でデータを解析した結果**が出ます。

たとえば、

- **Long GC Pauses** ―― 長い GC 停止があったかどうか
- **Application Halts** ―― アプリ全体の停止時間
- **Thread Contention** ―― ロック競合の有無
- **Class Loading** ―― 過剰なクラスロード
- **Code Cache** ―― JIT のコードキャッシュの状況
- **System CPU Load** ―― CPU 使用率

それぞれに**スコア**（緑・黄・赤）が付き、問題のあるものから順に並びます。
**JFR を取って、まず JMC で自動分析**を見る ―― これだけで、80 % の問題は気付けます。

---

## CPU プロファイル ―― ホットメソッド

Code → Method Profiling ペインを開くと、CPU を多く使ったメソッドが**スタックの逆向きに**集計されて見えます。

```text line-numbers=false
85%  com.example.Foo.process()
  60%  com.example.Foo.parse()
    50%  java.util.HashMap.get()
  25%  com.example.Foo.validate()
```

「**`process` の中で、`parse` の `HashMap.get` が CPU の 50 %**」のように、**呼び出し階層を辿りながら**ホットな経路を見ていけます。
これが、いわゆる**フレームグラフ**の発想です。

---

## メモリ ―― TLAB アロケーション

Memory → TLAB Allocations ペインで、

- **どのメソッドが**
- **どれだけの割り当て**を行ったか

を見られます。
ここで「**ループの中で String を作りすぎ**」のような問題が見つかれば、`StringBuilder` への置き換え、不変オブジェクトの使い回しなどで改善できます。

GC が頻発しているとき、ヒープサイズを上げるより、**割り当てを減らす**ほうが本質的な解決になります。
JMC の TLAB Allocations は、それを見つけるための主要ツールです。

---

## スレッド ―― タイムラインビュー

Threads → Thread Profiling ペインでは、

- 各スレッドの**状態**（実行中・待ち・ブロック）を**時間軸で**表示
- どこで**長時間止まっていた**か
- どのロックを**何 ms 待っていた**か

が見えます。
複数スレッドの**インタラクション**が原因のバグ（デッドロック、ロック競合）は、ここで一目瞭然になります。

---

## I/O ―― ファイルとソケット

File I/O・Socket I/O ペインで、

- どのファイル / どの URL に
- どれだけのバイト
- どれだけの時間

がかかったかを集計できます。
特に**DB クエリ**（Socket I/O で JDBC のポートに対して通信）が遅いケースが、ここで一目瞭然です。

---

## 実例: 「**起動が遅い**」の原因を見つける

`jfr summary` でも見られる典型的な「**Class Loading**」を、JMC で深掘りしてみる流れを書きます。

1. 起動後 30 秒で `JFR.dump`
2. JMC で開いて自動分析を見る
3. 「**Class Loading**」が赤（多すぎ）と出る
4. **Code → Class Loading** ペインに遷移
5. どのクラスローダがどんなクラスを多くロードしているか確認
6. 例: ある初期化処理で**何千個もクラスを動的ロード**していた
7. 該当コードを修正、リフレクションを使わない設計に変更

このような、**事実 → 仮説 → 修正**の流れを、JMC は強力にサポートしてくれます。

---

## ヘッドレスでの活用 ―― `jfr` CLI と JMC の併用

GUI アプリは「**本番サーバーで開く**」のが難しい場面もあります。
そんなときは、

1. 本番サーバーで `jcmd <pid> JFR.dump filename=incident.jfr`
2. ファイルをローカルにコピー（`scp` など）
3. ローカルの JMC で開く

という運用が定番です。

CLI でざっとサマリを見たいなら `jfr summary`・`jfr print`、深く見たいなら JMC ―― この使い分けが現代的です。

---

## まとめると

- **JMC**（Java Mission Control）は JFR の解析用 GUI ツール
- **`.jfr`** を開くだけで、自動分析の結果が見える
- **CPU プロファイル**でホットメソッドを発見
- **TLAB アロケーション**で割り当て元を特定
- **スレッドタイムライン**でロック競合を可視化
- **I/O プロファイル**で DB / ネット遅延を確認
- 本番から `.jfr` を取って、**ローカルで解析**する運用が一般的

次の節では、JFR とは別系統のプロファイラ ―― **async-profiler** を扱います。

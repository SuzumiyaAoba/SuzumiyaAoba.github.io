---
title: Observer パターン
llm: true
co-author: ["Claude Opus 4.7"]
---

## Observer パターン

**Observer**（観察者）パターンは、**「状態の変化を、複数の関心ある相手に通知する」**振る舞いパターンです。

監視される側（Subject、発信源）と監視する側（Observer、購読者）に分けて、**ゆるく結合された通知のしくみ**を作ります。

---

## 解きたい問題

「在庫数が変わったら、関連するモジュールに知らせたい」とします。

- 在庫表示のビューを更新する
- 補充タスクを発火する
- 監査ログを書く
- 通知メールを送る

これらを在庫管理サービスの中に**全部書き込む**と、サービスは**何でも知っている神クラス**化します。
追加・変更・テストのたびに、サービスを直すことになります。

「**変化があったよ、後はそれぞれで処理して**」と、**通知だけ**を担うのが Observer です。

---

## 構造と登場人物

```text
Subject（観察される側）
  ├ register(Observer)
  ├ unregister(Observer)
  └ notifyAll(event)   ―― 全 Observer に通知

Observer（観察する側）
  └ onEvent(event)
```

`Subject` は、自身に登録された `Observer` たちのリストを持ち、**変化があったら一斉に通知**します。
各 `Observer` は、通知を受けて自分の仕事をします。

---

## 古典的な実装

```java
public interface InventoryListener {
    void onChanged(String sku, int newQuantity);
}

public class Inventory {
    private final List<InventoryListener> listeners = new ArrayList<>();

    public void addListener(InventoryListener l) { listeners.add(l); }
    public void removeListener(InventoryListener l) { listeners.remove(l); }

    private final Map<String, Integer> stocks = new HashMap<>();

    public void set(String sku, int quantity) {
        stocks.put(sku, quantity);
        for (InventoryListener l : listeners) {
            l.onChanged(sku, quantity);   // 一斉通知
        }
    }
}
```

呼び出し:

```java
Inventory inv = new Inventory();
inv.addListener((sku, q) -> System.out.println("ビュー更新: " + sku + " = " + q));
inv.addListener((sku, q) -> {
    if (q < 5) System.out.println("補充タスク発火: " + sku);
});

inv.set("apple", 3);
// → ビュー更新: apple = 3
// → 補充タスク発火: apple
```

リスナーを**ラムダ式**で渡せるので、専用のクラスは要りません。
ボタンクリック・ファイル変更・WebSocket メッセージ ―― イベント駆動の世界では、これがほぼすべての基本形です。

---

## Java の `Flow` API と Reactive Streams

Java 9 から、**`java.util.concurrent.Flow`** という、Reactive Streams 規格準拠のリアクティブな Observer の API があります[^java-flow-api]。

```java
import java.util.concurrent.Flow;
import java.util.concurrent.SubmissionPublisher;

SubmissionPublisher<Integer> publisher = new SubmissionPublisher<>();

publisher.subscribe(new Flow.Subscriber<>() {
    public void onSubscribe(Flow.Subscription s) { s.request(Long.MAX_VALUE); }
    public void onNext(Integer item) { System.out.println("受信: " + item); }
    public void onError(Throwable t) { t.printStackTrace(); }
    public void onComplete() { System.out.println("完了"); }
});

publisher.submit(1);
publisher.submit(2);
publisher.close();
```

特徴は、

- **バックプレッシャ**（取りすぎを防ぐ仕組み）が組み込まれている
- **非同期**前提
- **失敗・完了**も通知できる

ふつうの Observer パターンは「**通知するだけ**」ですが、`Flow` は「**通知できる量を購読者がコントロールできる**」ぶん、本格的です。
Web フレームワーク（Spring WebFlux など）や非同期処理ライブラリの中で使われています。

---

## Pull / Push と通知設計

Observer の通知方法には、2 つのスタイルがあります。

- **Push 型**: Subject が、Observer に**値を渡して**通知（上の例）
- **Pull 型**: Subject は「変わったよ」とだけ通知し、Observer が自分で**取りに行く**

Push 型は楽ですが、**通知内容に何を含めるかで Subject が肥える**ことがあります。
Pull 型はメッセージは軽いが、**追加の問い合わせ**が必要になります。
状況に応じて選びましょう。

---

## 使いどころと注意点

向く場面:

- イベント駆動の UI / メッセージング
- **モデルとビューの分離**（MVC の M → V 通知）
- 監査・ロギングなど、**横断的な反応**を後付けで足したい

注意点:

- 通知の**順序**が必要なら、保証されているか確認する
- リスナーを登録したまま外す処理（`removeListener`）を忘れると**メモリリーク**
- 通知が**再帰**する設計（通知 → 状態変更 → さらに通知…）はバグの温床
- スレッド安全性 ―― 複数スレッドからの登録・通知は要注意

---

## まとめ

- **Observer** は、状態の変化を**購読者に通知する**振る舞いパターン
- 古典的にはコールバック（リスナー）として実装、ラムダで軽く書ける
- Java の **`Flow` API**（Reactive Streams）は、**バックプレッシャ付き**の現代版
- UI・モデル・イベント駆動の根幹的なパターン

次の章では、**Command** ―― 操作そのものをオブジェクト化する振る舞いパターンを見ます。

[^java-flow-api]: Java SE 25 API, `java.util.concurrent.Flow`, [https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/Flow.html](<https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/Flow.html>)。Java 9（JEP 266）で導入された Reactive Streams 仕様（[https://www.reactive-streams.org/](<https://www.reactive-streams.org/>)）の Java 標準対応 API。`Publisher`／`Subscriber`／`Subscription`／`Processor` のインターフェースを定義する。

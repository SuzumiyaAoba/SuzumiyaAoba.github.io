---
title: Observer パターン
llm: true
---

## Observer パターン

**Observer**（オブザーバー、観察者）パターンは、

> 「**ある対象の状態が変わったとき**に、それを**観察している複数の関係者**に通知する」

ためのパターンです。
イベント駆動の設計の基本になっています。

---

## 想定する場面

たとえば、ニュース配信のサービスを考えます。

- ある記者（**Subject**、観察される側）が、新しいニュースを書いた
- 購読者（**Observer**、観察する側）には、その**通知**が届く

このとき、

- 購読者は、何人いるかわからない（増えたり減ったりする）
- 記者は、購読者の存在を**個別に知る必要はない**
- ただ「**新しいニュースができたよ**」と伝えるだけ

という、**送信側と受信側を切り離した**通信モデルです。
GUI のクリックイベント、Pub/Sub メッセージング、Reactive プログラミングなど、たくさんの場面に応用されます。

---

## 古典的な書き方

```java
import java.util.ArrayList;
import java.util.List;

public interface NewsObserver {
    void onNewsPublished(String title);
}

public class NewsPublisher {
    private final List<NewsObserver> observers = new ArrayList<>();

    public void subscribe(NewsObserver observer) {
        observers.add(observer);
    }

    public void unsubscribe(NewsObserver observer) {
        observers.remove(observer);
    }

    public void publish(String title) {
        for (NewsObserver observer : observers) {
            observer.onNewsPublished(title);
        }
    }
}
```

使い方はこんな感じです。

```java
NewsPublisher publisher = new NewsPublisher();

NewsObserver alice = title -> System.out.println("Alice: " + title);
NewsObserver bob   = title -> System.out.println("Bob: " + title);

publisher.subscribe(alice);
publisher.subscribe(bob);

publisher.publish("速報: Java 25 リリース");
// Alice: 速報: Java 25 リリース
// Bob:   速報: Java 25 リリース
```

`NewsObserver` は関数型インタフェース（メソッド 1 つ）なので、**ラムダ式で書ける**のが現代らしい点です。

---

## 設計上のポイント

このパターンを書くときに押さえておきたいのは、次の点です。

### 1. 登録と解除をペアにする

`subscribe` したきり `unsubscribe` を忘れると、

- 不要になった `Observer` が**ずっと参照され続け**、ガベージコレクションされない
- いわゆる**メモリリーク**につながる

ことがあります。
GUI のイベントリスナーで、よく聞く事故です。
**登録した側に解除の責任もある**、と意識しておきます。

### 2. 通知中の例外に注意する

`publish` のループの中で、**ある Observer が例外を投げる**と、それ以降の Observer に通知が届きません。

```java
for (NewsObserver observer : observers) {
    observer.onNewsPublished(title);  // ← 1 つが投げると、後続に届かない
}
```

このため、現場では try-catch でログを取りながら、ループを継続することが多いです。

```java
for (NewsObserver observer : observers) {
    try {
        observer.onNewsPublished(title);
    } catch (Exception e) {
        // ログを出して継続
    }
}
```

### 3. 並行に通知すべきか?

複雑な処理を Observer がするときは、**通知を別スレッドで処理**したいこともあります。
これは Reactive Streams（次項）で扱う、より高度なテーマです。

---

## 標準ライブラリの `java.util.concurrent.Flow`

Java 9 以降、**Reactive Streams** という仕様に対応した API が標準ライブラリに入っています。
それが、**`java.util.concurrent.Flow`** です。

```java
import java.util.concurrent.Flow.*;
import java.util.concurrent.SubmissionPublisher;

SubmissionPublisher<String> publisher = new SubmissionPublisher<>();

Subscriber<String> alice = new Subscriber<>() {
    private Subscription subscription;

    @Override
    public void onSubscribe(Subscription s) {
        this.subscription = s;
        s.request(Long.MAX_VALUE);          // 何件でも受け取る
    }

    @Override
    public void onNext(String item) {
        System.out.println("Alice: " + item);
    }

    @Override public void onError(Throwable t) {}
    @Override public void onComplete() {}
};

publisher.subscribe(alice);
publisher.submit("速報: Java 25 リリース");
```

これは Observer パターンの**現代版**にあたります。

- **バックプレッシャー**（受け取る速度の制御）
- **非同期処理**

など、より高度な要件に対応できる仕組みです。
本書では深入りしませんが、「**標準ライブラリには、より強力な Observer 相当の仕組みがある**」と覚えておいてください。

なお、Reactive 系のライブラリ（**RxJava**・**Project Reactor**）は、もっと表現力豊かな API を提供します。
業務システムで「Reactive で書こう」となったら、これらが選択肢になります。

---

## なぜ素朴な実装でいいケースも多いのか

「すべてを `Flow` で書くべきか?」と言うと、そうではありません。

- 受信者が**少なく**、登録/解除が**滅多にない**
- 通知が**同期で十分**
- 並行制御が**要らない**

なら、本節の前半で書いた素朴な `ArrayList<Observer>` + ラムダ式で**十分**です。
**過剰な複雑化はアンチパターン**です。

---

## いつ Observer を使うか

- イベント駆動の処理（UI クリック・受信メッセージ）
- **依存関係を逆転**したいとき（中心の Subject から、複数の関心へ通知）
- 通知される側の数が**動的**に変わるとき

逆に、

- 通知の宛先が**固定**で、ずっと変わらない
- ただメソッドを呼ぶだけで済む

なら、Observer を使う必要はありません。
ふつうに**メソッド呼び出し**で書きましょう。

---

## まとめ

- **Observer** は、状態変化を**複数の関係者に通知**するパターン
- 関数型インタフェースなら、**ラムダ式の購読者**を簡潔に書ける
- 登録/解除をペアにしないと、**メモリリーク**の原因になる
- 通知中の例外で**後続が止まらない**ように工夫が必要
- 標準ライブラリには、より強力な **`java.util.concurrent.Flow`** がある
- 必要以上に複雑にせず、**素朴な実装で十分なこと**も多い

次は、流れの骨格を共有しつつ、一部だけ差し替える **Template Method** パターンです。

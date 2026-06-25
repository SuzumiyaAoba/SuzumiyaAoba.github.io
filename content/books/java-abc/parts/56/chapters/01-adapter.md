---
title: Adapter パターン
llm: true
co-author: ["Claude Opus 4.7"]
---

## Adapter パターン

**Adapter**（変換器）パターンは、**「形（インターフェース）の合わないクラスを、こちらが期待する形に変換して使う」**ためのパターンです。

「既にあるクラスを、設計変更せずに新しい場所に差し込みたい」 ―― そういうとき、間に **Adapter** を 1 枚挟むことで、橋渡しができます。

---

## 解きたい問題

たとえば、自社の API が `Logger` インターフェースを使うと期待しているとします。

```java
public interface Logger {
    void log(String message);
}
```

ところが、使いたい外部ライブラリの API は、形が違います。

```java
// 外部ライブラリ。手を入れられない
public class ExternalLogger {
    public void write(int level, String text) {
        // ...
    }
}
```

そのまま渡すと、`Logger` 型として受け取れません。
そこで、**Adapter** クラスを 1 枚挟みます。

```java
public class ExternalLoggerAdapter implements Logger {
    private final ExternalLogger delegate;
    public ExternalLoggerAdapter(ExternalLogger delegate) {
        this.delegate = delegate;
    }
    @Override
    public void log(String message) {
        delegate.write(1, message);   // 形を変えて呼ぶ
    }
}
```

呼び出し側は、`Logger` だけを知っていればよくなります。

```java
Logger logger = new ExternalLoggerAdapter(new ExternalLogger());
logger.log("Hello");
```

---

## クラス Adapter とオブジェクト Adapter

GoF は、Adapter を 2 種類紹介しています。

### クラス Adapter（継承を使う）

```java
public class ExternalLoggerAdapter extends ExternalLogger implements Logger {
    @Override
    public void log(String message) {
        write(1, message);
    }
}
```

継承で機能を取り込んで、その上から目的のインターフェースを実装します。
Java は**単一継承**なので、すでに親クラスが決まっていると使えません。

### オブジェクト Adapter（委譲を使う）

先ほどの **`delegate` を持つ形**が、こちらです。
継承の縛りを受けないので、**実務でよく使うのはこちら**です。

| 観点 | クラス Adapter | オブジェクト Adapter |
|---|---|---|
| 仕組み | 継承 | 委譲 |
| 柔軟性 | 1 つの親しか持てない | 複数の委譲先を組み合わせられる |
| 推奨度 | 限定的 | **基本はこちら** |

---

## ラムダで書ける軽い Adapter

メソッドが 1 つしかないインターフェースなら、Adapter は**ラムダ式**で済むことが多いです。

```java
Logger logger = msg -> externalLogger.write(1, msg);
logger.log("Hello");
```

専用のクラスを書かずに、その場で形を合わせられます。
「**1 メソッドだけのインターフェースに合わせる**」ような Adapter は、現代の Java ではラムダの出番です。

---

## 標準ライブラリの中の Adapter

Adapter の発想は、Java の標準ライブラリにも組み込まれています。

- **`Arrays.asList(...)`** ― 配列を `List` の形にする
- **`Collections.list(Enumeration)`** ― 古い `Enumeration` を `List` に
- **`Reader` / `InputStreamReader`** ― バイトストリームを文字ストリームに

「**既存の道具を、新しい形に変換する**」場面は、ライブラリ作者が常に意識している関心ごとです。

---

## 使いどころと注意点

向く場面:

- **既存ライブラリ**を、自分のインターフェースに合わせて使いたい
- **レガシーコード**を、新しい仕組みから呼びたい
- **テストでの差し替え**用に、薄いラップを 1 枚かませたい

向かない場面:

- 元クラスとの差が**大きすぎる**（変換が複雑になる ―― 設計を見直すべき）
- そもそも**インターフェースを揃えればよい**だけ（リファクタリングで済む話）

---

## まとめ

- **Adapter** は、形の合わないクラスを**こちらの口に合わせる**パターン
- 実務では **オブジェクト Adapter**（委譲）を使うのが基本
- メソッド 1 つの場合は **ラムダで十分**
- 既存の道具を活かしながら、設計を**汚さずに**つなぐのが Adapter の良さ

次の章では、**Facade** ―― 複雑な内部を**ひとつの口にまとめる**パターンを見ます。

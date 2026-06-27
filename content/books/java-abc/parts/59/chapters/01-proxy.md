---
title: Proxy パターン
llm: true
co-author: ["Claude Opus 4.7"]
---

## Proxy パターン

**Proxy**（代理人）パターンは、**「本物のオブジェクトと同じインターフェースを持ち、間に立って振る舞いを差し込む」**ためのパターンです。

呼び出し側は、相手が**本物か代理人かを意識せずに済みます**。
代理人が「本物にアクセスする前後で何かをする」ことで、いろんな付加価値を提供できます。

---

## Proxy の 4 つの主要な種類

GoF では、Proxy の使い方を 4 つに整理しています。

| 種類 | 目的 | 例 |
|---|---|---|
| **仮想 Proxy** | 生成・ロードを遅らせる | 大きな画像の遅延ロード |
| **保護 Proxy** | アクセス制御 | 権限チェック |
| **遠隔 Proxy** | 通信を隠す | RPC・RMI |
| **スマート Proxy** | 追加処理を差し込む | 参照カウント、ロギング、キャッシュ |

「Proxy ＝ 中身の前後に何かを入れる」と覚えると、用途の幅広さが見えてきます。

---

## 実装例 ― 遅延ロード Proxy

「大きな画像」を**実際に表示する直前まで**読み込まないようにします。

```java
public interface Image {
    void display();
}

public class HeavyImage implements Image {
    private final String path;
    public HeavyImage(String path) {
        this.path = path;
        loadFromDisk();
    }
    private void loadFromDisk() {
        System.out.println("disk から " + path + " をロード...");
    }
    @Override
    public void display() {
        System.out.println("表示: " + path);
    }
}
```

Proxy を間に立てます。

```java
public class ImageProxy implements Image {
    private final String path;
    private HeavyImage real;   // 必要になるまで null

    public ImageProxy(String path) { this.path = path; }

    @Override
    public void display() {
        if (real == null) {
            real = new HeavyImage(path);   // 初回だけロード
        }
        real.display();
    }
}
```

呼び出し側:

```java
Image img = new ImageProxy("photo.jpg");   // この時点ではロードしない
// ...いろいろ処理...
img.display();   // ここで初めてロードして表示
img.display();   // 2 回目はロードされない
```

**「使うまで作らない」**を、呼び出し側を変えずに実現できました。

---

## 動的プロキシ（`java.lang.reflect.Proxy`）

Java には、**インターフェースを動的に実装する**仕組みがあります[^java-reflect-proxy]。

```java
import java.lang.reflect.Proxy;

Logger logger = (Logger) Proxy.newProxyInstance(
    Logger.class.getClassLoader(),
    new Class<?>[] { Logger.class },
    (proxyObj, method, args) -> {
        System.out.println(">> " + method.getName());
        Object result = method.invoke(realLogger, args);  // 本物に委譲
        System.out.println("<< " + method.getName());
        return result;
    });
```

`InvocationHandler` というラムダで、**メソッド呼び出し前後**に処理を差し込めます。
**ログ・トランザクション・認可チェック**などを、呼び出し側のコードを変えずに追加できます。

動的プロキシの制約は、**インターフェースが必要**な点です（クラスのプロキシは作れない）。
クラスのプロキシが必要なときは、CGLIB / Byte Buddy などのバイトコード操作ライブラリを使います。

---

## Spring AOP と Proxy

Spring の `@Transactional` や `@Cacheable` は、内部で Proxy を生成して機能を実現しています。

```java
@Service
public class OrderService {
    @Transactional   // ← Spring が Proxy を作って、前後にトランザクション処理を入れる
    public void place(Order o) { /* ... */ }
}
```

呼び出し側は `orderService.place(o)` を呼ぶだけ。
実際には、Spring が用意した Proxy オブジェクトが**`place` の前後にトランザクションの開始・コミット**を差し込んでいます。

「**コードを変えずに、横断的な関心ごとを差し込む**」 ――AOP の心臓部です。

---

## Decorator との違い

Proxy と Decorator は、構造的にとてもよく似ています（同じインターフェースを実装して、中に本物を持つ）。

| 観点 | Proxy | Decorator |
|---|---|---|
| 主な目的 | アクセス制御、遅延、計測など | 機能の追加 |
| 包む対象 | 1 つの本物 | 重ねて積める |
| 利用者の意識 | 本物との区別はつかない | 包んだ機能の存在を意識する |

「**機能を増やす**」のが Decorator、「**間に立つ**」のが Proxy と覚えるとよいでしょう。

---

## 使いどころと注意点

向く場面:

- **重い・遠い**オブジェクトへのアクセスを工夫したい
- 横断的な関心ごと（ログ・認可・キャッシュ）を**コードに直書きしたくない**
- フレームワーク・ライブラリの**拡張点**を作る

注意点:

- スタックが深くなり、**デバッグが難しくなる**ことがある
- 自分の Proxy が、**呼び出し側に見えてしまう**ような露出設計は避ける
- 「`null` を扱うため」など、Proxy を**ありもののクラスでごまかす**のは別の問題（Null Object パターンなどを別途検討）

---

## まとめ

- **Proxy** は、本物と同じ顔で**間に立つ代理人**
- 仮想・保護・遠隔・スマートの 4 種類が代表
- Java の**動的プロキシ**で、軽く実装できる
- Spring の AOP は、Proxy 生成の典型的な実用例

次の章では、**Composite** ―― **木構造**を扱うパターンを見ます。

[^java-reflect-proxy]: Java SE 25 API, `java.lang.reflect.Proxy`, <https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/reflect/Proxy.html>。Java 1.3（2000年）で導入された動的プロキシ機構。`Proxy.newProxyInstance(ClassLoader, Class[], InvocationHandler)` でインターフェースの動的実装を生成する。Spring AOP のデフォルト実装の一つでもある。

---
title: リスコフの置換原則（LSP）
llm: true
co-author: ["Claude Opus 4.7"]
---

## リスコフの置換原則（LSP）

**Liskov Substitution Principle**（LSP、リスコフの置換原則）は、

> **「サブクラスは、いつでも親クラスの代わりに使えなければならない」**

という、継承についての原則です。

5 つの原則の中で、いちばん**抽象的に感じる**かもしれません。
具体例から見ていきましょう。

---

## いちばん有名な反例 ― 「正方形は長方形か?」

数学的には、正方形は**長方形の一種**です。
そこで、こんなクラス設計をする人がいます。

```java
public class Rectangle {
    protected int width;
    protected int height;

    public void setWidth(int w)  { this.width = w; }
    public void setHeight(int h) { this.height = h; }

    public int area() { return width * height; }
}

public class Square extends Rectangle {
    // 正方形は、幅と高さがいつも同じ
    @Override
    public void setWidth(int w) {
        super.setWidth(w);
        super.setHeight(w);   // 高さも合わせる
    }

    @Override
    public void setHeight(int h) {
        super.setHeight(h);
        super.setWidth(h);   // 幅も合わせる
    }
}
```

`Square extends Rectangle` で、「正方形は長方形である」を表現したつもりです。

ところが、こんなコードでバグります。

```java
public void enlarge(Rectangle r) {
    r.setWidth(4);
    r.setHeight(5);
    assert r.area() == 20;   // △ Square だと、面積が 25 になる
}
```

`Rectangle` を**親クラスとして受け取って**、`width = 4`、`height = 5`、面積 20 だと期待します。
ですが、もし渡された `r` が **`Square`** だったら、

1. `setWidth(4)` で、両方とも 4 になる
2. `setHeight(5)` で、両方とも 5 になる
3. `area()` は **25** を返す

…と、**期待した 20 ではなく 25** になります。

これは、

> 「`Square` を、`Rectangle` の代わりに使ったら、期待しない振る舞いになった」

ということです。
LSP が破られているわけです。

---

## LSP の本質 ― 「is-a」ではなく「振る舞い」

「正方形は長方形である」というのは、**数学的な分類**としては正しいです。
ですが、**ソフトウェアでは違います**。

ソフトウェアの「**継承**」は、「**振る舞いを引き継ぐ**」ことを意味します。
親が持つ振る舞いの**契約**（呼べる・どう振る舞う）を、サブクラスは**満たさなければならない**のです。

`Rectangle` の `setWidth` と `setHeight` には、暗黙の契約があります。

> 「`setWidth(w)` を呼んでも、`height` は変わらない」

`Square` は、この契約を破ってしまいました。
だから、`Rectangle` の代わりに使うと、ユーザー（呼び出し側）が混乱するのです。

---

## LSP の現代的な解釈

ロバート・C・マーチンは、LSP を次のように言い換えています。

> **「サブクラスは、親クラスの呼び出し側を**驚かせてはいけない**」**

つまり、

- 親クラスが投げないはずの例外を、サブクラスが投げない
- 親クラスが許す入力範囲を、サブクラスは**狭めない**
- 親クラスが返す戻り値の保証を、サブクラスは**緩めない**

という、**契約を尊重する**ことです。
これは、**契約による設計**（Design by Contract）という考え方に近いです。

---

## LSP を破りやすい場面

実務で LSP を破りがちなのは、次のような場面です。

### 1. 「使えないメソッド」を持つサブクラス

```java
public abstract class Bird {
    public abstract void fly();
}

public class Penguin extends Bird {
    @Override
    public void fly() {
        throw new UnsupportedOperationException("ペンギンは飛べません");
    }
}
```

`Bird` を受け取る側は、「`fly()` を呼んでも大丈夫」と期待します。
でも `Penguin` を渡されると、例外が飛びます。
これは LSP 違反です。

#### 対処

- そもそも、`fly()` を **すべての `Bird` に強要しない**
- 「飛べる」「飛べない」で**型を分ける**（`Flyable` インターフェースを切る）

```java
public abstract class Bird { }
public interface Flyable { void fly(); }

public class Sparrow extends Bird implements Flyable {
    @Override public void fly() { System.out.println("飛ぶ"); }
}

public class Penguin extends Bird { }
```

「**できないことを持たせない**」ように、設計を変える ―― これが LSP に従う基本です。

### 2. 入力範囲を狭めるサブクラス

親クラスが「**負の数も受け取れる**」と約束しているのに、サブクラスが「**負の数は例外**」と狭めるのも、LSP 違反です。

```java
public class Calculator {
    public int factorial(int n) {   // n が負でも何かの値を返す（例: 1）
        ...
    }
}

public class StrictCalculator extends Calculator {
    @Override
    public int factorial(int n) {
        if (n < 0) throw new IllegalArgumentException(...);  // 親が許す入力を弾く
        return ...;
    }
}
```

呼び出し側は「`Calculator` の `factorial` だから、負でも大丈夫」と思っています。
`StrictCalculator` に置き換わると、例外が飛んで壊れます。

#### 対処

- サブクラスで**条件を強くしない**
- そもそも、`Calculator` を継承させない設計にする

### 3. ない契約を要求するサブクラス

逆に、サブクラスを使うには「先に何かを呼んでおかないと使えない」というように、**追加の前提**を作ってしまうのも違反です。

```java
public class Logger {
    public void log(String msg) { ... }
}

public class FileLogger extends Logger {
    @Override
    public void log(String msg) {
        // open() を先に呼んでいないと NullPointerException
        out.write(msg);
    }
    public void open() { ... }
}
```

「`Logger.log(msg)` だけで動く」と思って渡しても、`FileLogger` は `open()` を先に呼ばないと動かないので、壊れます。

#### 対処

- コンストラクタで内部の準備を完結させる
- そもそも、`open` の概念があるなら**別のクラス**にする

---

## なぜ LSP は重要か

LSP が大事なのは、それが**多態（ポリモーフィズム）の前提条件**だからです。

> 「親の型で受け取って、サブクラスを差し替えて使える」

―― これは、**LSP が満たされているからこそ**、安心して使える機能です。
LSP が破れていると、

- **多態を使うコード**が、予期せず壊れる
- **OCP** が成り立たない（「拡張する」ことが、修正を呼ぶ）
- テストも書きにくくなる

つまり、LSP は **OCP の前提**でもあるのです。

---

## 「is-a」ではなく「振る舞いの一致」で考える

LSP に従うコツは、

- 「A は B である（is-a）」と感じても、すぐ `extends B` しない
- まず、「A は、B の**振る舞いをすべて満たせるか?**」と問う

ことです。

満たせないなら、

- 共通の親を**もっと抽象**にする（`Bird` から `fly()` を外す）
- そもそも継承ではなく、**コンポジション**（持つ関係）で書く
- インターフェースを分けて、必要な振る舞いだけを共有する

といった、設計の見直しが必要になります。

---

## まとめ

- **LSP** は「**サブクラスは、親クラスの代わりに使えなければならない**」原則
- 「is-a（〜は〜である）」ではなく、**振る舞いの一致**で判断する
- サブクラスは、親の**契約を破ってはいけない**（例外を増やす・入力を狭める）
- LSP が破られると、**多態が機能しなくなる**
- ペンギン問題のように、**継承ではなく、別の構造**にすべき場合がある

次の節は、**ISP** ― インターフェース分離原則です。

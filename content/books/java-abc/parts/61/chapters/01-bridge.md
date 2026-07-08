---
title: Bridge パターン
llm: true
co-author: ["Claude Opus 4.7"]
---

## Bridge パターン

**Bridge**（橋）パターンは、**「抽象（インターフェース側）」と「実装（プラットフォーム側）」を、別々に発展できるようにする**ためのパターンです。

「**2 つの軸**で増えていくクラス」を、継承で対応せず、**委譲（橋）で**つないで切り離します。

---

## 解きたい問題

「**図形**」（Shape）を画面に描くことを考えます。

- **図形**: 円・四角・三角
- **描画方法**: Canvas で描く・OpenGL で描く

すべてを継承で表すと、

```text line-numbers=false
Shape
├ CanvasCircle      ・ OpenGLCircle
├ CanvasSquare      ・ OpenGLSquare
└ CanvasTriangle    ・ OpenGLTriangle
```

**「図形 × 描画方法」**でクラスが**掛け算**で増えます（3 × 2 = 6 クラス）。
図形が 1 つ増えれば 2 クラス追加、描画方法が 1 つ増えれば 3 クラス追加 ―― 維持が大変です。

これを、**「図形のクラス階層」と「描画方法のクラス階層」を別々に作り、橋で結ぶ**のが Bridge です。

---

## 構造と登場人物

```text line-numbers=false
Shape（抽象）           Renderer（実装）
  ├ Circle                ├ CanvasRenderer
  ├ Square                └ OpenGLRenderer
  └ Triangle
       └─ renderer ──→（委譲）
```

`Shape` は、内部に `Renderer` を持ち、描画は `Renderer` に**委譲**します。
これで、**図形を追加するときは Shape 側だけ**、**描画方法を追加するときは Renderer 側だけ**を変えればよくなります（3 + 2 = 5 クラス、加算）。

---

## 実装例 ― 図形と描画 API

実装側（Renderer）:

```java
public interface Renderer {
    void drawCircle(double x, double y, double r);
    void drawRectangle(double x, double y, double w, double h);
}

public class CanvasRenderer implements Renderer {
    @Override public void drawCircle(double x, double y, double r) {
        System.out.println("[Canvas] 円(" + x + "," + y + ") r=" + r);
    }
    @Override public void drawRectangle(double x, double y, double w, double h) {
        System.out.println("[Canvas] 四角");
    }
}

public class OpenGLRenderer implements Renderer {
    @Override public void drawCircle(double x, double y, double r) {
        System.out.println("[OpenGL] 円");
    }
    @Override public void drawRectangle(double x, double y, double w, double h) {
        System.out.println("[OpenGL] 四角");
    }
}
```

抽象側（Shape）:

```java
public abstract class Shape {
    protected final Renderer renderer;
    protected Shape(Renderer renderer) { this.renderer = renderer; }
    public abstract void draw();
}

public class Circle extends Shape {
    private final double x, y, r;
    public Circle(double x, double y, double r, Renderer renderer) {
        super(renderer);
        this.x = x; this.y = y; this.r = r;
    }
    @Override public void draw() {
        renderer.drawCircle(x, y, r);
    }
}
```

呼び出し:

```java
Renderer canvas = new CanvasRenderer();
Renderer ogl = new OpenGLRenderer();

new Circle(0, 0, 10, canvas).draw();
new Circle(0, 0, 10, ogl).draw();
```

**抽象階層**（Shape）と**実装階層**（Renderer）が、独立に変化できます。

---

## Adapter との違い

| 観点 | Adapter | Bridge |
|---|---|---|
| 動機 | **既存**の合わない型をつなぐ（事後対応） | **設計時から**、2 軸の変化を独立にする |
| 関心 | 形を変換する | 抽象と実装の切り離し |
| 適用タイミング | 後から | 最初から |

Adapter は「既にあるものをなんとかつなぐ」、Bridge は「**設計の段階で意図的に切り離す**」と覚えるとよいでしょう。

---

## Strategy との違い

「実装を差し替える」という意味では Strategy（第64章）にも似ています。
違いは、**「動機の規模」**です。

- **Strategy**: 振る舞い（アルゴリズム）の差し替え。小さな単位
- **Bridge**: 抽象階層と実装階層**全体**の切り離し。大きな単位

実務では、「Bridge と気づかずに Strategy として書く」こともよくあります。

---

## 使いどころと注意点

向く場面:

- **2 つの軸**で機能が増える（プラットフォーム × 機能、テーマ × 部品）
- 同じ抽象に対して**複数の実装プラットフォーム**を提供したい
- **API の安定**と**実装の進化**を、別ペースで進めたい（ライブラリ作者向け）

注意点:

- 適用が**過剰**になることがある（軸が 1 つなら Strategy で十分）
- **クラスが増える**ので、見通しが落ちないか要検討
- 最初から Bridge を入れすぎず、必要が見えてから抜き出すのが安全

---

## まとめ

- **Bridge** は、抽象と実装を**別の階層**として切り離す構造パターン
- 継承の組み合わせ爆発を、**委譲**で加算的に解消する
- Adapter は事後対応、Bridge は**設計段階の意図**
- 2 軸で増えるものの設計に効く

次の章では、構造パターン最後の **Flyweight** ―― **共有でメモリ節約**するパターンを見ます。

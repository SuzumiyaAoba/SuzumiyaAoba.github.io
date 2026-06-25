---
title: Template Method パターン
llm: true
co-author: ["Claude Opus 4.7"]
---

## Template Method パターン

**Template Method**（テンプレートメソッド）パターンは、**処理の大まかな流れは親クラスが決め、変化させたい部分だけを子クラスに任せる**振る舞いパターンです。

親クラスに「**テンプレートメソッド**」（流れを書いた `final` メソッド）を置き、その中で**抽象メソッド**を呼び出します。子クラスは、その抽象メソッドの中身を実装するだけ。
**「変えてよい場所」と「変えてはいけない場所」**が、コードの構造そのもので示されます。

---

## 解きたい問題

「**帳票を出力する**」という流れを考えます。

- ヘッダを出す
- 明細行を出す
- 合計を出す

帳票の種類（CSV、HTML、PDF）が変わると、それぞれの中身は変わりますが、**流れ自体は同じ**です。

これを、流れごと子クラスに書かせると、**手順の繰り返し**になり、抜け漏れも起こります。
**「流れ」だけを 1 か所にまとめ、「中身」は子に任せる**――これが Template Method です。

---

## 実装例 ― 帳票の出力

```java
public abstract class ReportPrinter {
    // テンプレートメソッド: 流れは親が決める
    public final void print() {
        printHeader();
        printBody();
        printFooter();
    }

    protected abstract void printHeader();
    protected abstract void printBody();
    protected abstract void printFooter();
}
```

子クラスは、3 つのメソッドの中身を埋めます。

```java
public class CsvReportPrinter extends ReportPrinter {
    @Override protected void printHeader() { System.out.println("name,price"); }
    @Override protected void printBody() {
        System.out.println("apple,100");
        System.out.println("banana,200");
    }
    @Override protected void printFooter() { /* CSV にはフッタなし */ }
}

public class HtmlReportPrinter extends ReportPrinter {
    @Override protected void printHeader() { System.out.println("<table>"); }
    @Override protected void printBody() {
        System.out.println("<tr><td>apple</td><td>100</td></tr>");
    }
    @Override protected void printFooter() { System.out.println("</table>"); }
}
```

呼び出し:

```java
ReportPrinter csv = new CsvReportPrinter();
csv.print();

ReportPrinter html = new HtmlReportPrinter();
html.print();
```

**「流れの順序を間違える」**ことが、構造的にできなくなります。

---

## 抽象メソッドとフックメソッド

GoF は、子に渡す穴を 2 種類紹介しています。

- **抽象メソッド**: 子が必ず実装しなければいけない（実装の強制）
- **フックメソッド**: デフォルト実装があり、子が**必要なら**上書きできる

```java
public abstract class ReportPrinter {
    public final void print() {
        printHeader();
        printBody();
        if (needsSummary()) {     // ← フックメソッド
            printSummary();
        }
        printFooter();
    }

    protected abstract void printHeader();
    protected abstract void printBody();
    protected abstract void printFooter();

    // 子が必要に応じて上書き
    protected boolean needsSummary() { return false; }
    protected void printSummary() { /* デフォルトは何もしない */ }
}
```

フックメソッドは、**「拡張点を用意するが、強制はしない**」ときに使います。

---

## Strategy との使い分け

Strategy と Template Method は、どちらも「**変化する部分を差し替える**」ためのパターンです。

| 観点 | Template Method | Strategy |
|---|---|---|
| 仕組み | 継承 | 委譲 |
| 流れの管理 | 親が**ハードコード** | 呼び出し側 |
| 差し替えの単位 | 流れの**ステップ**（小さい） | アルゴリズム**全体**（大きい） |
| 動機 | 共通の流れを再利用したい | アルゴリズムを取り替えたい |

「**1 つの流れの一部分**」を変えたいなら Template Method、
「**やり方そのもの**」を変えたいなら Strategy、
が選び方の目安です。

---

## ラムダで書ける？

ラムダで `Runnable` を差し込む形でも、**Template Method の発想**は表せます。

```java
public class FunctionalReportPrinter {
    public void print(Runnable header, Runnable body, Runnable footer) {
        header.run();
        body.run();
        footer.run();
    }
}
```

ただ、Template Method のうれしさである**「流れの再利用＋共通実装の集約**」は、**継承**のほうがすっきり表現できることが多いです。
状況に応じて、Template Method（継承）と関数渡し（委譲）を選びましょう。

---

## 使いどころと注意点

向く場面:

- **流れは決まっている**が、ステップの中身を変えたい
- フレームワークの**拡張ポイント**を作る
- **共通実装の重複**を避けたい

注意点:

- 継承を使う以上、**親と子の結びつき**が強くなる（脆い基底クラス問題）
- 親のテンプレートを安易に変えると、**子全部に影響**する
- ステップが**多すぎる**と、覚えるのが大変。3〜5 個程度が目安

---

## まとめ

- **Template Method** は、骨組みは親、肉付けは子、の振る舞いパターン
- 流れを `final` メソッドで固定し、**変えてよい場所**だけ抽象メソッドにする
- **フックメソッド**で任意の拡張点も作れる
- Strategy との違い: 一部のステップ差し替え vs アルゴリズム全体の差し替え

次の章では、**Observer** ―― **変化を購読する**振る舞いパターンを見ます。

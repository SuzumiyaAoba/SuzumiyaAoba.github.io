---
title: 単一責任原則（SRP）
llm: true
---

## 単一責任原則（SRP）

**Single Responsibility Principle**（SRP、単一責任原則）は、ひとことで言うと

> **「1 つのクラス（または、モジュール）は、1 つの理由でしか変更されないようにする」**

という原則です。

「1つのことだけする」と訳されることが多いですが、より正確には**「変更の理由が 1 つだけ」**という意味です。
理由が複数あるクラスは、それぞれの理由ごとに**分けるべき**、というのが SRP の考え方です。

---

## ダメな例 ― 神クラス（God Class）

たとえば、レポートを表示するクラスを考えます。
書き始めは小さいのに、放置しているとこんなふうに育つことがあります。

```java
public class Report {

    private List<Sale> sales;

    // 1. データの集計
    public int totalAmount() {
        return sales.stream().mapToInt(Sale::amount).sum();
    }

    // 2. 文字列の整形
    public String toJson() {
        // sales を JSON に変換
        ...
    }

    // 3. ファイル書き出し
    public void saveAsCsv(Path path) {
        // sales を CSV にしてファイルに保存
        ...
    }

    // 4. メール送信
    public void sendByEmail(String to) {
        // sales を集計したレポートをメールで送信
        ...
    }
}
```

`Report` クラスは、

1. 集計するロジック
2. JSON 整形ロジック
3. CSV 書き出しロジック
4. メール送信ロジック

を**ぜんぶ持っています**。
これは、**変更の理由がたくさんある**状態です。

- 集計式を変えたい → `Report` を直す
- JSON のフォーマットを変えたい → `Report` を直す
- メールサーバーを変更したい → `Report` を直す

このように、ひとつの変更が、関係ない別の機能に影響しやすくなります。
これを **神クラス**（God Class）と呼びます。

---

## SRP に従って分ける

`Report` の責務を、変更の理由ごとに**別クラスに分けます**。

```java
public record Sale(String item, int amount) {}

// 1. 集計
public class SalesCalculator {
    public int totalAmount(List<Sale> sales) {
        return sales.stream().mapToInt(Sale::amount).sum();
    }
}

// 2. JSON 整形
public class SalesJsonFormatter {
    public String format(List<Sale> sales) {
        // ...
    }
}

// 3. CSV 書き出し
public class SalesCsvWriter {
    public void write(List<Sale> sales, Path path) {
        // ...
    }
}

// 4. メール送信
public class SalesMailer {
    public void send(List<Sale> sales, String to) {
        // ...
    }
}
```

各クラスは、

- `SalesCalculator` → 集計式が変わったときだけ修正
- `SalesJsonFormatter` → JSON 出力形式が変わったときだけ修正
- `SalesCsvWriter` → CSV 出力先や形式が変わったときだけ修正
- `SalesMailer` → メールの送り方が変わったときだけ修正

と、**ひとつの理由で変わる**ようになりました。
これが SRP の理想形です。

---

## 「クラスの行数」ではなく「変更の理由」で測る

SRP は「**1 クラス 100 行以内**」のような物理的な基準ではありません。

長くても、**変更の理由が 1 つしかない**なら SRP に違反していません。
逆に、短くても、**複数の理由で変更される**なら違反です。

判断基準は、

> 「**この変更は、誰がもたらすか**」

という、**変更の主体**を考えることです。
たとえば、

| 変更の主体 | 変えるクラス |
|---|---|
| 会計担当 | 集計式の `SalesCalculator` |
| フロントエンド担当 | JSON 出力の `SalesJsonFormatter` |
| 運用担当 | CSV 書き出しの `SalesCsvWriter` |
| マーケ担当 | メールテンプレートの `SalesMailer` |

別の人・別の理由で変わるなら、**それぞれを別クラスに**するわけです。

---

## どこまで細かく分けるか

「責務が違う」と思ったら、すべて分けるべきでしょうか?
実は、**やりすぎ**にも注意が必要です。

```java
class IntAdder { int add(int a, int b) { return a + b; } }
class IntSubtractor { int subtract(int a, int b) { return a - b; } }
class IntMultiplier { int multiply(int a, int b) { return a * b; } }
class IntDivider { int divide(int a, int b) { return a / b; } }
```

四則演算を 4 クラスに分けるのは、明らかに**過剰**です。
**「変更の理由が違う」**と言えるのは、たとえば、

- 集計と整形 → **誰が・なぜ・いつ変えるかが違う**
- 加算と減算 → **同じ「計算ロジック」の一部に過ぎない**

という具合に、**変更の発生源**が独立しているかどうか、で判断します。

---

## SRP に従うとどう変わるか

SRP を意識して書くと、次のような効果が出ます。

| 効果 | 説明 |
|---|---|
| **読みやすい** | クラス名が、ぴったり責務を表す（`SalesCalculator` → 「集計担当」） |
| **テストしやすい** | 1 つの責務に絞られているので、テスト対象が明確 |
| **変更に強い** | 1 つの理由の変更が、関係ないコードに波及しない |
| **再利用しやすい** | 単独で使えるので、別の場所からも呼べる |

---

## 実務での見つけ方

「このクラス、ちょっと大きいかも」と感じたら、次の質問をしてみます。

- **「このクラスを変える可能性のある人 / 理由は、何種類ある?」**
- **「メソッドのうち、お互いに関係のないものはないか?」**
- **「クラス名が、複数の名詞でしか表現できないか?**（例: `SalesCalculatorAndMailer`）」

これらが**いくつもイエス**になるなら、SRP の出番です。

---

## まとめ

- **SRP** は、「**1 つのクラスは、1 つの理由でしか変更しない**」原則
- ダメな例は、**神クラス**（何でもやるクラス）
- **「変更の主体」「変更の理由」**で、責務を分ける
- ただし、**過剰に分割**するのもアンチパターン
- 効果は、**読みやすさ・テスト容易性・変更に強い・再利用性**

次の節は、**OCP** ― 拡張に開き、修正に閉じる原則です。

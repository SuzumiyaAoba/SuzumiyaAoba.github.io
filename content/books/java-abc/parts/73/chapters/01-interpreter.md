---
title: Interpreter パターン
llm: true
co-author: ["Claude Opus 4.7"]
---

## Interpreter パターン

**Interpreter**（通訳者）パターンは、**「ある小さな言語の文を解釈・評価する」**ための振る舞いパターンです。

文法のそれぞれの要素を**クラス**として表し、そのクラスのインスタンスからなる**構文木**を組み立て、`evaluate` メソッドを呼ぶことで**意味**を取り出します。

---

## 解きたい問題

「設定ファイルの中に、こんな条件を書きたい」とします。

```text
age >= 20 AND status == "active"
```

これを Java からどう扱うか?

選択肢 1: 文字列のまま `if` でハードコード ―― **柔軟性ゼロ**。
選択肢 2: 設定パーサーを書き、**条件を構文木として解釈**して、ランタイムに評価する ―― これが Interpreter です。

「**小さな専用言語（DSL）**を作って、その意味を Java の側で解釈する」 ―― ルールエンジン、テンプレート言語、検索クエリなど、応用は広いです。

---

## 文法とクラスの対応

文法は、BNF のように再帰的に書けます。

```text
expr ::= number
       | expr "+" expr
       | expr "*" expr
```

これを Java のクラスにそのまま対応させます。

```text
Expr（抽象）
├ NumberExpr     ←  number
├ AddExpr        ←  expr "+" expr
└ MulExpr        ←  expr "*" expr
```

**文法の各規則**に対し、**1 つのクラス**が対応するのが Interpreter パターンの基本構造です。

---

## 実装例 ― 簡易な数式評価器（古典版）

```java
public interface Expr {
    int evaluate(Context ctx);
}

public class Context {
    private final Map<String, Integer> vars = new HashMap<>();
    public void set(String name, int value) { vars.put(name, value); }
    public int get(String name) { return vars.getOrDefault(name, 0); }
}

public class NumberExpr implements Expr {
    private final int value;
    public NumberExpr(int value) { this.value = value; }
    @Override public int evaluate(Context ctx) { return value; }
}

public class VarExpr implements Expr {
    private final String name;
    public VarExpr(String name) { this.name = name; }
    @Override public int evaluate(Context ctx) { return ctx.get(name); }
}

public class AddExpr implements Expr {
    private final Expr left, right;
    public AddExpr(Expr left, Expr right) { this.left = left; this.right = right; }
    @Override public int evaluate(Context ctx) {
        return left.evaluate(ctx) + right.evaluate(ctx);
    }
}

public class MulExpr implements Expr {
    private final Expr left, right;
    public MulExpr(Expr left, Expr right) { this.left = left; this.right = right; }
    @Override public int evaluate(Context ctx) {
        return left.evaluate(ctx) * right.evaluate(ctx);
    }
}
```

呼び出し:

```java
// 式: x + 2 * 3
Expr expr = new AddExpr(
    new VarExpr("x"),
    new MulExpr(new NumberExpr(2), new NumberExpr(3))
);

Context ctx = new Context();
ctx.set("x", 5);

System.out.println(expr.evaluate(ctx));   // 11
```

`evaluate` は**自分自身を子に再帰させる**ことで、木全体を評価します。

---

## レコードとパターンマッチングで現代化

Visitor の章でも見たように、**シールドクラス + レコード + `switch` 式**を使うと、もっと簡潔に書けます。

```java
public sealed interface Expr permits NumberExpr, VarExpr, AddExpr, MulExpr {}
public record NumberExpr(int value) implements Expr {}
public record VarExpr(String name) implements Expr {}
public record AddExpr(Expr left, Expr right) implements Expr {}
public record MulExpr(Expr left, Expr right) implements Expr {}

public class Evaluator {
    public int eval(Expr e, Map<String, Integer> ctx) {
        return switch (e) {
            case NumberExpr(int v) -> v;
            case VarExpr(String n) -> ctx.getOrDefault(n, 0);
            case AddExpr(Expr l, Expr r) -> eval(l, ctx) + eval(r, ctx);
            case MulExpr(Expr l, Expr r) -> eval(l, ctx) * eval(r, ctx);
        };
    }
}
```

呼び出し:

```java
Expr expr = new AddExpr(
    new VarExpr("x"),
    new MulExpr(new NumberExpr(2), new NumberExpr(3))
);
int result = new Evaluator().eval(expr, Map.of("x", 5));   // 11
```

レコードの分解と `switch` 式により、**構文木 → 評価結果**の対応が一目でわかります。
コンパイラが**網羅性**をチェックしてくれるので、文法を増やしたときに**漏れがないこと**も保証されます。

---

## パーサとの関係

ここまでで作ったのは、**構文木があれば評価できる**仕組みです。
文字列から構文木を組み立てる部分（**パーサ**）は、Interpreter パターンとは別に必要です。

実用上は、

- 自分で再帰下降パーサを書く（小さな言語ならこれで十分）
- ANTLR・JavaCC のような**パーサジェネレータ**を使う
- 既存ライブラリ（**Apache Commons JEXL**、**SpEL** ＝ Spring Expression Language など）を使う

実務では、**自前で言語処理系を組まずに、既存の式評価ライブラリを使う**ことが多いです。
それでも、内部で動いている構造は、ほぼ Interpreter パターンそのものです。

---

## 使いどころと注意点

向く場面:

- **小さな専用言語（DSL）**を作りたい
- **ルールエンジン**やテンプレートエンジン
- **静的解析・コード生成**

注意点:

- 文法が**複雑になる**と、クラスがどんどん増える ―― 早めにパーサジェネレータを検討
- 性能が気になる場合、構文木を**バイトコードや関数列**にコンパイルすることも検討（**コンパイル法**）
- 「**何でも DSL にすればよい**」と考えない ―― 既存の Java で書けるなら、DSL は作らない選択も大事

---

## まとめ

- **Interpreter** は、小さな専用言語の**構文木を解釈**するためのパターン
- 文法の各規則を**クラスで表現**し、木に対する `evaluate` で評価する
- シールドクラス + レコード + パターンマッチングで、現代的にすっきり書ける
- パーサ部分は別途必要 ―― 実務ではライブラリ利用も検討

---

## 第6部 完走おめでとうございます

これで、**GoF の 23 パターンすべての解説**が完了しました。

- 生成パターン（5）: Singleton、Factory Method、Abstract Factory、Builder、Prototype
- 構造パターン（7）: Adapter、Facade、Decorator、Proxy、Composite、Bridge、Flyweight
- 振る舞いパターン（11）: Iterator、Strategy、Template Method、Observer、Command、State、Chain of Responsibility、Mediator、Memento、Visitor、Interpreter

パターンは、覚えるのではなく、**「指差せるようになる**」 ―― これが第6部の目標でした。
コードを読みながら、「これは Strategy だね」「Facade を切ろう」と**会話ができる**ようになれば、第6部の目的は達成です。

ただし、**「とにかくパターンを当てはめる**」のは禁物です。
パターンは、**問題に出会ったときの引き出し**として使い、シンプルさを犠牲にしないこと ―― これが、本書を通じて伝えたい大切な姿勢です。

次の章群（第5部 ―― JVM と言語の内側）が残っている場合は、そちらに進んで本書を完走してください。
すでに第5部まで読了している方は、これにて Java 入門書のすべてが完了です。お疲れさまでした。

---
title: Visitor パターン
llm: true
co-author: ["Claude Opus 4.7"]
---

## Visitor パターン

**Visitor**（訪問者）パターンは、**「データ構造のクラスに手を入れずに、その構造に対する新しい操作を追加できる**」ようにする振る舞いパターンです。

「構造は固定、操作は拡張可能」 ―― ここが Visitor の動機です。

---

## 解きたい問題

簡単な数式の構文木を例にします。

```text
Expr
├ Num（数値）
├ Add（足し算）
└ Mul（掛け算）
```

これらに対して、

- 評価する（`eval`）
- 出力する（`print`）
- 微分する（`differentiate`）

など、たくさんの操作をしたいとします。
それを**各クラスにメソッドとして追加**していくと、

```java
class Num extends Expr {
    int eval() { ... }
    String print() { ... }
    Expr differentiate(String v) { ... }
    // ... 操作が増えるたびに、全クラスを直す
}
```

操作の数だけ、**全クラスを開けて回る**ことになります。
これは、「**新しい操作を、構造側に触れずに追加したい**」というニーズに反します。

**操作を別オブジェクトに分けて、構造側は「訪問者を受け入れる口」だけ持つ** ―― これが Visitor です。

---

## ダブルディスパッチ

Visitor を理解するキーワードは、**ダブルディスパッチ**（double dispatch）です。
通常の Java では、メソッド呼び出しは「**呼び出されるオブジェクトの型**」だけで決まります（シングルディスパッチ）。

Visitor では、

1. 構造側（`Expr`）の `accept(Visitor v)` がまず呼ばれる
2. その中で `v.visitXxx(this)` を呼び返す

という**2 段階の呼び分け**で、「**構造の具象型** × **訪問者の具象型**」で振る舞いが決まります。
これがダブルディスパッチです。

---

## 古典的な実装 ― 構文木の評価

```java
public abstract class Expr {
    public abstract <R> R accept(Visitor<R> v);
}

public class Num extends Expr {
    public final int value;
    public Num(int value) { this.value = value; }
    @Override public <R> R accept(Visitor<R> v) { return v.visit(this); }
}

public class Add extends Expr {
    public final Expr left, right;
    public Add(Expr left, Expr right) { this.left = left; this.right = right; }
    @Override public <R> R accept(Visitor<R> v) { return v.visit(this); }
}

public class Mul extends Expr {
    public final Expr left, right;
    public Mul(Expr left, Expr right) { this.left = left; this.right = right; }
    @Override public <R> R accept(Visitor<R> v) { return v.visit(this); }
}
```

訪問者インターフェース:

```java
public interface Visitor<R> {
    R visit(Num n);
    R visit(Add a);
    R visit(Mul m);
}
```

操作はそれぞれ Visitor として実装します。

```java
public class EvalVisitor implements Visitor<Integer> {
    @Override public Integer visit(Num n) { return n.value; }
    @Override public Integer visit(Add a) {
        return a.left.accept(this) + a.right.accept(this);
    }
    @Override public Integer visit(Mul m) {
        return m.left.accept(this) * m.right.accept(this);
    }
}

public class PrintVisitor implements Visitor<String> {
    @Override public String visit(Num n) { return String.valueOf(n.value); }
    @Override public String visit(Add a) {
        return "(" + a.left.accept(this) + " + " + a.right.accept(this) + ")";
    }
    @Override public String visit(Mul m) {
        return "(" + m.left.accept(this) + " * " + m.right.accept(this) + ")";
    }
}
```

呼び出し:

```java
Expr expr = new Add(new Num(1), new Mul(new Num(2), new Num(3)));
System.out.println(expr.accept(new EvalVisitor()));   // 7
System.out.println(expr.accept(new PrintVisitor()));  // (1 + (2 * 3))
```

新しい操作を加えたいときは、**新しい Visitor を 1 つ書くだけ**で済みます。
構造側（`Expr` の子クラス）は、いっさい変更しません。これが Visitor の真価です。

---

## シールドクラスと switch 式で書き直す

GoF Visitor は古典的に**冗長**です。Java 21 以降は、**シールドクラス**（第27章）と **パターンマッチング switch**（第26章）を使うと、Visitor の役目を**言語機能だけで**ほぼ満たせます。

```java
public sealed interface Expr permits Num, Add, Mul {}
public record Num(int value) implements Expr {}
public record Add(Expr left, Expr right) implements Expr {}
public record Mul(Expr left, Expr right) implements Expr {}

public class Evaluator {
    public int eval(Expr e) {
        return switch (e) {
            case Num(int v) -> v;
            case Add(Expr l, Expr r) -> eval(l) + eval(r);
            case Mul(Expr l, Expr r) -> eval(l) * eval(r);
        };
    }
}
```

特徴:

- `Expr` の派生は `Num`・`Add`・`Mul` の **3 つだけ**であることがコンパイラに保証される
- `switch` 式で**網羅チェック**（漏れたらコンパイルエラー）
- 新しい操作は、**外で `switch` を書くだけ**で追加できる
- レコードの**分解**で、構造を読みやすく取り出せる

「Visitor を書きたくなったら、まず**シールドクラス + パターンマッチング**で代用できないか」を考えると、現代の Java では多くの場合これで足ります。

---

## 「構造を増やすか、操作を増やすか」 ―― 拡張軸の選択

Visitor とパターンマッチングは、どちらも**拡張軸**を決めています。

- **Visitor**: 「**操作の追加**は楽」、ただし「**構造の追加**には全 Visitor を直す必要がある」
- **クラスにメソッド追加方式**: 「**構造の追加**は楽」、ただし「**操作の追加**は全クラスを直す必要がある」

「**操作と構造、どちらが頻繁に増えるか**」で、どちらを採るかを決めましょう。これを **Expression Problem** と呼びます。
シールドクラス + `switch` は、**両方向の追加に対して、コンパイラが網羅をチェック**してくれるという点で、よくバランスが取れています。

---

## 使いどころと注意点

向く場面:

- **構造が安定**しているデータに対し、**操作を増やしたい**
- 構文木・ASR・JSON ツリー・XML ツリーなどの**処理系**

注意点:

- 構造が増えると、**全 Visitor を直す**必要がある（拡張の方向に注意）
- 古典的な実装は**冗長**。Java 21 以降ならシールドクラスで簡潔に書ける
- 構造を**外部に公開**する以上、内部の不変条件が崩れないように設計する

---

## まとめ

- **Visitor** は、構造を変えずに**操作を追加**できるようにする振る舞いパターン
- **ダブルディスパッチ**で、構造と操作の組み合わせに応じた振る舞いを実現する
- 現代の Java では、**シールドクラス + `switch` 式**で代用できる場面が多い
- **拡張の方向**（操作 / 構造）でアプローチを使い分ける

次の章 ―― 振る舞いパターンの最後 ―― は **Interpreter** です。

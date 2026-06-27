---
title: sealed と permits
llm: true
co-author: ["Claude Opus 4.7"]
---

## sealed と permits

シールドクラスは、**`sealed`** と **`permits`** という2つのキーワードで定義します。
そして、許可された子クラスには、3つの選択肢があります。
この節では、その書き方を学びます。

---

## sealed と permits の書き方

クラスやインターフェースに **`sealed`** を付け、**`permits`** のうしろに「継承を許可するクラス」を並べます。

```java
sealed interface Shape permits Circle, Rectangle, Triangle {
    double area();
}
```

これは、「`Shape` インターフェースを実装してよいのは、**`Circle`・`Rectangle`・`Triangle` の3つだけ**」という宣言です。
`permits`（パーミッツ＝許可する）のうしろに、許可する相手を、カンマ区切りで並べます。

許可された子クラスは、ふつうに実装します。
ここでは、第17章のレコードで作ってみましょう。

```java
sealed interface Shape permits Circle, Rectangle, Triangle {}

record Circle(double radius) implements Shape {}
record Rectangle(double width, double height) implements Shape {}
record Triangle(double base, double height) implements Shape {}
```

これで、`Shape` の種類は、この3つに限定されました。

---

## 許可されていないクラスは、実装できない

`permits` に書かれていないクラスが、`Shape` を実装しようとすると、**コンパイルエラー**になります。

```java
sealed interface Shape permits Circle, Rectangle {}
record Circle(double radius) implements Shape {}
record Rectangle(double w, double h) implements Shape {}

// permits に書かれていない Square が、勝手に実装しようとする
final class Square implements Shape {}
```

```text
エラー: クラスはシール・クラスShapeを拡張できません('permits'句に指定されていないためです)
```

「`permits` に指定されていないので、`Shape` を拡張（実装）できません」と、はっきり止めてくれます。
これにより、「`Shape` の種類は、許可した3つだけ」が、確実に守られます。
勝手に4つ目を増やすことは、できないのです。

---

## 子クラスの3つの選択肢

シールドクラスを継承（実装）する子クラスは、「**自分も、さらに継承されてよいか**」を、はっきり決めなければなりません。
そのため、子クラスには、次の**3つのうちどれか**を付けます。

| 修飾子 | 意味 |
|---|---|
| `final` | これ以上、誰も継承できない（ここで打ち止め） |
| `sealed` | さらに限定して継承を許す（また `permits` を書く） |
| `non-sealed` | 継承の制限を解除する（誰でも継承できるようにする） |

```java
sealed interface Shape permits Circle, Special {}

record Circle(double radius) implements Shape {}     // record は自動的に final

// さらに継承を許可する場合は sealed
sealed interface Special extends Shape permits Star {}
record Star(int points) implements Special {}        // final（record）

// もし「ここから先は自由に継承させたい」なら non-sealed
// non-sealed class Custom implements Shape {}
```

- **`final`** … 「もう継承させない」。いちばんよく使う（**レコードは自動的に `final`** なので、何も書かなくてよい）
- **`sealed`** … 「さらに限定して継承を許す」。許可リスト（`permits`）を、また書く
- **`non-sealed`** … 「ここから先は、誰でも継承してよい」。制限を解除する

初心者のうちは、子クラスを**レコード**にするのが、いちばん簡単です（レコードは自動で `final` なので、3つを意識しなくてすみます）。

---

## permits を省略できる場合

子クラスを、シールドクラスと**同じファイル**に書く場合は、`permits` を**省略できます**。
Java が「同じファイルにある子クラスたち」を、自動的に許可リストとみなしてくれるからです。

```java
// 同じファイルに書くなら、permits を省略できる
sealed interface Shape {}
record Circle(double radius) implements Shape {}
record Rectangle(double w, double h) implements Shape {}
```

`.java` ファイルに親子をまとめて書く場合は、この省略形が便利です。
（クラスを別々のファイルに分ける場合は、`permits` で明示的に許可します。）

> **注意: jshell では permits を省略できない**
>
> jshell は、入力した宣言を1つずつ**別々のコンパイル単位**として扱います。
> そのため、この省略形を jshell に貼ると、「シール・クラスにはサブクラスを含める必要があります」というエラーになります。
> **jshell で試すときは、`permits` を明示的に書いてください**（この章のほかのサンプルは、すべて `permits` 付きなので、そのまま試せます）。

---

## まとめ

- **`sealed`** を付け、**`permits`** で「継承を許可するクラス」を並べる
- `permits` にないクラスが継承しようとすると、**コンパイルエラー**
- 子クラスは、**`final`**（打ち止め）・**`sealed`**（さらに限定）・**`non-sealed`**（制限解除）のどれかにする
- **レコードは自動的に `final`** なので、子クラスにすると簡単
- 子クラスを**同じファイル**に書くなら、`permits` は**省略できる**

次の節では、この章のハイライト ―― シールドクラスとパターンマッチングの組み合わせを学びます。

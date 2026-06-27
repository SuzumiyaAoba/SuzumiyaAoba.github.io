---
title: JUnit 5 の基本
llm: true
co-author: ["Claude Opus 4.7"]
---

## JUnit 5 の基本

それでは、実際に **JUnit 5** でテストを書いてみます。

JUnit 5 の正式名称は **JUnit Jupiter**（ジュピター）です[^junit5]。
依存に書くときの ArtifactId が `junit-jupiter` なのも、このためです。
本書では、慣習に合わせて「JUnit 5」と呼びます。

---

## プロジェクトの準備

第31章で作った `hello-maven` プロジェクトをそのまま使います。
`pom.xml` には、すでに JUnit 5 を追加してありました。

```xml
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>5.11.3</version>
    <scope>test</scope>
</dependency>
```

`scope` を `test` にしてあるのが大事です。本番コードには JUnit を持ち込まない、ということです。

---

## テスト対象を用意する

まず、テストしたい本番コードを `src/main/java/com/example/Calculator.java` に置きます。

```java
package com.example;

public class Calculator {
    public int add(int a, int b) {
        return a + b;
    }
}
```

シンプルな足し算メソッドだけ持ったクラスです。
これを、テストで確かめていきます。

---

## はじめてのテストクラス

テストは、本番コードと**鏡合わせ**のフォルダに置きます。

| 種類 | 場所 |
|---|---|
| 本番コード | `src/main/java/com/example/Calculator.java` |
| テストコード | `src/test/java/com/example/CalculatorTest.java` |

**パッケージは同じ**、**クラス名は `〜Test`** をつける、というのが慣習です。
クラス名を合わせておくと、後で見たときに「`Calculator` のテストか」と一目でわかります。

`src/test/java/com/example/CalculatorTest.java` に、次のように書きます。

```java
package com.example;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class CalculatorTest {

    @Test
    void addsTwoNumbers() {
        Calculator calc = new Calculator();
        int result = calc.add(2, 3);
        assertEquals(5, result);
    }
}
```

これが、JUnit 5 で書く**最小のテスト**です。
ポイントを 4 つに分けて見ていきましょう。

### ポイント1 ― `@Test` アノテーション

```java
@Test
void addsTwoNumbers() {
    ...
}
```

`@Test`（テスト）を付けたメソッドが、**テストランナー**（JUnit）から自動で呼び出されます。
`@Test` がついていないただのメソッドは、テストとして実行されません。

「これはテストだ」と JUnit に教える**目印**が `@Test` です。

### ポイント2 ― メソッド名は「日本語のように読めるか」

```java
void addsTwoNumbers() { ... }
```

JUnit 5 では、テストメソッドの名前に**特別なルールはありません**（昔の JUnit 4 のように `test〜` で始める必要はない）。

代わりに、「**何のテストか**を、メソッド名でわかる」ように書くのが慣習です。
よい命名のコツは、次のとおりです。

- 主語と動詞をつなげて、**短い英文**で書く（`addsTwoNumbers`、`returnsZeroWhenEmpty` など）
- 「**こうなるはず**」（期待される振る舞い）を書く

「日本語で読み下せる」と、テストレポートを見たときに、何が壊れているかすぐ判断できます。

### ポイント3 ― クラス・メソッドは `public` でなくてよい

```java
class CalculatorTest {        // ← public をつけない
    @Test
    void addsTwoNumbers() {   // ← public をつけない
```

JUnit 4 までは `public class`・`public void` が必須でしたが、**JUnit 5 では不要**です。
むしろ、テストクラスは「同じパッケージから参照される」だけなので、書かない方が今風です。

ただし、`static`・`final` を付けるのはやめましょう。テスト用のインスタンスが作れなくなります。

### ポイント4 ― `import static` で `assertEquals` を直接呼べるようにする

```java
import static org.junit.jupiter.api.Assertions.assertEquals;
```

`static` インポートを使うと、

```java
Assertions.assertEquals(5, result);   // 通常の呼び出し
```

を、

```java
assertEquals(5, result);              // 短く書ける
```

と書けます。
テストは大量のアサーションを並べるので、**短く書けるかどうかで読みやすさが大きく変わります**。
慣習として、テストでは `import static` を積極的に使います。

---

## テストを実行する

ターミナルで、Maven プロジェクトのルートに移動して、

```text
$ mvn test
```

実機の出力（抜粋）。

```text
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.example.CalculatorTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.018 s -- in com.example.CalculatorTest
[INFO]
[INFO] Results:
[INFO]
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO]
[INFO] BUILD SUCCESS
```

`Tests run: 1, Failures: 0` で、テストが通ったことが確認できました。

---

## わざと失敗させてみる

テストが「**通っているのか、ちゃんと失敗するのか**」を確かめるのは、入門段階でとても大事です。
わざと期待値を間違えてみましょう。

```java
assertEquals(99, calc.add(2, 3));   // わざと間違える
```

実行すると、こんなエラーが出ます。

```text
[ERROR] CalculatorTest.addsTwoNumbers -- Time elapsed: 0.005 s <<< FAILURE!
org.opentest4j.AssertionFailedError:
expected: <99> but was: <5>
        at ...
```

- `expected: <99>` … 期待値は 99 だった
- `but was: <5>` … でも実際は 5 だった

このように、**期待値と実際値の食い違い**を、JUnit が教えてくれます。
ここから「自分の期待が間違っているのか、コードが間違っているのか」を考えるのが、テスト失敗時のフローです。

> **補足: テストを書いたら、必ず失敗を一度見ておく**
>
> テストは、**通っている**ことだけでなく、**失敗するときに失敗する**ことも大事です。
> 期待値を間違えても通ってしまうテストは、何も確かめていないのと同じです。
> 「いったんわざと失敗させて、それから直す」という習慣をつけておくと、安心です。

---

## 1 クラスに複数のテストメソッド

テストクラスには、**何個でも `@Test` メソッド**を書けます。

```java
class CalculatorTest {

    @Test
    void addsTwoNumbers() {
        assertEquals(5, new Calculator().add(2, 3));
    }

    @Test
    void addsZero() {
        assertEquals(7, new Calculator().add(7, 0));
    }

    @Test
    void addsNegative() {
        assertEquals(-1, new Calculator().add(2, -3));
    }
}
```

これで、3 つのテストが**それぞれ独立して**実行されます。
1 つが失敗しても、ほかは止まりません。

ここで、`new Calculator()` が 3 回書かれていることに気づきますね。
これを**1 か所にまとめる**方法は、第4節「テストのライフサイクル」で学びます。

---

## まとめ

- `@Test` を付けたメソッドが、JUnit から自動で呼び出されます
- テストクラスは `〜Test`、本番と**同じパッケージ**に置くのが慣習です
- クラス・メソッドの `public` は不要（JUnit 5 以降）
- `import static` で `assertEquals` を短く書きます
- 失敗時は **expected と but was** を見比べて、原因を特定します
- テストは**一度わざと失敗させてみる**のが、入門段階の鉄則です

次の節では、`assertEquals` のほかにどんなアサーションがあるかを、まとめて学びます。

[^junit5]: JUnit 5 公式サイト, "JUnit 5 User Guide," <https://junit.org/junit5/docs/current/user-guide/>。JUnit 5 は JUnit Platform、JUnit Jupiter（新しいテスト API）、JUnit Vintage（JUnit 3/4 互換）の3つのサブプロジェクトから構成される。2017年初版リリース。

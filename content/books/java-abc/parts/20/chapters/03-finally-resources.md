---
title: finally と後始末 ― 必ず実行する処理
llm: true
co-author: ["Claude Opus 4.7"]
---

## finally と後始末 ― 必ず実行する処理

例外が起きても起きなくても、「**これだけは、必ずやっておきたい**」処理があります。
たとえば、開いたファイルを閉じる、といった「後始末」です。
この節では、それを確実に行う **`finally`** と、**try-with-resources** を学びます。

---

## finally ― 必ず実行されるブロック

try-catch に、**`finally`**（ファイナリー）ブロックを付け加えられます。
`finally` の中身は、**例外が起きても起きなくても、必ず最後に実行**されます。

```java
try {
    // 処理
} catch (例外の型 e) {
    // 例外時の対応
} finally {
    // 必ず実行される後始末
}
```

例で確かめましょう。

```java
public class Main {
    public static void main(String[] args) {
        try {
            IO.println("処理を始めます");
            int x = 10 / 0;             // ここで例外が起きる
            IO.println("計算しました");  // ここは実行されない
        } catch (ArithmeticException e) {
            IO.println("エラーが起きました");
        } finally {
            IO.println("後始末をします");   // 必ず実行される
        }
    }
}
```

```text
$ java Main.java
処理を始めます
エラーが起きました
後始末をします
```

`10 / 0` で例外が起き、`catch` で「エラーが起きました」が表示されました。
そして、`finally` の「後始末をします」も、ちゃんと実行されています。

`finally` の特徴は、**例外が起きたかどうかに関係なく、必ず実行される**ことです。
例外が起きなければ `try` の最後まで実行されてから、例外が起きれば `catch` のあとに、`finally` が実行されます。
「成功しても失敗しても、最後に必ずやること」を書くのに使います。

---

## なぜ後始末が必要なのか

プログラムでは、「使ったら、閉じる・返す」必要があるものがあります。

- 開いたファイル（使い終わったら閉じる）
- データベースとの接続（使い終わったら切断する）
- ネットワークの通信（使い終わったら閉じる）

これらを閉じ忘れると、資源（リソース）が無駄に使われ続け、やがて問題を引き起こします。
そして、「処理の途中で例外が起きても、閉じる処理だけは必ず実行したい」のです。
`finally` を使えば、例外が起きても、閉じる処理を確実に実行できます。

---

## try-with-resources ― 自動で閉じる

「使ったら閉じる」は、とてもよくあるパターンなので、Java には、それを**自動でやってくれる**しくみがあります。
それが **try-with-resources**（トライ・ウィズ・リソーシズ）です[^jep213-twr]。

`try` のうしろの **`( )`** の中で、リソースを用意（生成）します。
すると、`try` ブロックを抜けるときに、そのリソースが**自動的に閉じられます**（例外が起きても、です）。

動きを確かめるために、「閉じられると分かるリソース」を、自分で作ってみましょう。
`close()` を持つ（`AutoCloseable` を実装した）クラスが、try-with-resources で自動的に閉じられます。

```java
class MyResource implements AutoCloseable {
    MyResource() { IO.println("リソースを開く"); }
    void use()   { IO.println("リソースを使う"); }
    @Override
    public void close() { IO.println("リソースを閉じる"); }   // 自動で呼ばれる
}

public class Main {
    public static void main(String[] args) {
        try (MyResource r = new MyResource()) {   // ( ) でリソースを用意
            r.use();
        }
        IO.println("おわり");
    }
}
```

```text
$ java Main.java
リソースを開く
リソースを使う
リソースを閉じる
おわり
```

`try (...)` の中で `MyResource` を用意し、`r.use()` を呼びました。
そして、`try` ブロックを抜けるときに、`close()` が**自動的に**呼ばれ、「リソースを閉じる」が表示されています。
`finally` に閉じる処理を書かなくても、Java が自動で後始末してくれたのです。

> **補足: try-with-resources が便利な理由**
>
> `finally` で自分で閉じる場合、「閉じる処理を書き忘れる」「閉じる前に別の例外が起きる」といったミスが起こりがちです。
> try-with-resources なら、`( )` に書くだけで、**閉じ忘れがなくなり**、コードもすっきりします。
> 第3部のファイル入出力（第30章）では、ファイルを扱うために、この try-with-resources が大活躍します。
> いまは「使ったら閉じる、は `try (...)` で自動化できる」と知っておきましょう。

---

## まとめ

- **`finally`** は、例外が起きても起きなくても、**必ず最後に実行**されるブロック
- 「成功しても失敗しても、必ずやる後始末」（ファイルを閉じる、など）に使う
- **try-with-resources**（`try (リソース) { }`）は、ブロックを抜けるときに、リソースを**自動で閉じる**
- 自動で閉じられるのは、`close()` を持つ（`AutoCloseable` を実装した）もの
- 閉じ忘れを防げるので、ファイルなどを扱うときは try-with-resources が基本（第30章で活躍）

次の節では、例外の「種類」 ―― チェック例外と非チェック例外の違いを学びます。

[^jep213-twr]: try-with-resources は Java 7（JSR 334, Project Coin）で導入され、JEP 213 (Java 9) で実質的 final 変数も対象にできるよう拡張された（[https://openjdk.org/jeps/213](<https://openjdk.org/jeps/213>)）。詳細は *JLS §14.20.3*（[https://docs.oracle.com/javase/specs/jls/se25/html/jls-14.html#jls-14.20.3](<https://docs.oracle.com/javase/specs/jls/se25/html/jls-14.html#jls-14.20.3>)）参照。`AutoCloseable` インターフェース（[https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/AutoCloseable.html](<https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/AutoCloseable.html>)）を実装したリソースが自動的にクローズされる。

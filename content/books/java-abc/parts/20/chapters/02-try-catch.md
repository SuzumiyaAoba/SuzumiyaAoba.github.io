---
title: try-catch で捕まえる
llm: true
co-author: ["Claude Opus 4.7"]
---

## try-catch で捕まえる

例外が起きると、プログラムは止まってしまいました。
ですが、例外を**捕まえて**対応すれば、プログラムを止めずに、処理を続けられます。
そのためのしくみが、**try-catch**（トライ・キャッチ）です。

---

## try-catch の形

try-catch は、次のように書きます。

```java
try {
    // 例外が起きるかもしれない処理
} catch (例外の型 変数) {
    // 例外が起きたときの対応
}
```

- **`try { }`** … 「例外が起きるかもしれない処理」を、ここに書く
- **`catch (例外の型 変数) { }`** … `try` の中で例外が起きたら、ここが実行される

`try` の中で例外が起きると、処理は**その場で `catch` に飛びます**。
そして `catch` の処理が終わると、try-catch の**続き**から、プログラムは進みます。
例外が「捕まえられた（catch された）」ことで、プログラムは止まらずにすむのです。

---

## 例 ― 文字列を数値に変換する

第4章で学んだ `Integer.parseInt(...)` は、数値に変換できない文字列を渡すと、`NumberFormatException` という例外を起こします。
これを try-catch で捕まえてみましょう。

```java
public class Main {
    public static void main(String[] args) {
        String input = "あいうえお";   // 数値に変換できない文字列

        try {
            int n = Integer.parseInt(input);   // ここで例外が起きる
            IO.println("変換できました: " + n);
        } catch (NumberFormatException e) {
            IO.println("数値ではありません: " + input);
        }

        IO.println("プログラムは続きます");
    }
}
```

```text
$ java Main.java
数値ではありません: あいうえお
プログラムは続きます
```

`Integer.parseInt("あいうえお")` で `NumberFormatException` が起きましたが、`catch` がそれを捕まえました。
そのため、プログラムは止まらず、`catch` の中の「数値ではありません」が表示され、さらに**その後の「プログラムは続きます」も実行**されました。

ポイントは2つです。

- `try` の中で例外が起きると、**その行で中断**し、すぐ `catch` に飛ぶ（だから「変換できました」は表示されない）
- `catch` で対応したあとは、try-catch の続きから、**プログラムが続く**（だから「プログラムは続きます」が表示される）

例外を捕まえることで、「エラーが起きても、プログラム全体は止めない」が実現できました。

---

## catch で受け取る例外オブジェクト

`catch (NumberFormatException e)` の **`e`** は、発生した例外そのものを表すオブジェクトです。
この `e` から、例外の情報を取り出せます。

```java
try {
    int n = Integer.parseInt("あいうえお");
} catch (NumberFormatException e) {
    IO.println("エラー内容: " + e.getMessage());   // 例外のメッセージを取り出す
}
```

```text
エラー内容: For input string: "あいうえお"
```

`e.getMessage()` で、例外のメッセージ（第1節で見た、スタックトレースに出ていたもの）を取り出せます。
このメッセージを、ログに記録したり、原因の確認に使ったりできます。

---

## 複数の例外を catch する

`try` の中で、**異なる種類の例外**が起きる可能性があるときは、`catch` を複数並べて、種類ごとに対応を分けられます。

```java
public class Main {
    public static void main(String[] args) {
        int[] numbers = {10, 20, 30};

        try {
            int index = Integer.parseInt("5");   // 5 に変換
            IO.println(numbers[index]);          // numbers[5] は範囲外
        } catch (NumberFormatException e) {
            IO.println("数値に変換できませんでした");
        } catch (ArrayIndexOutOfBoundsException e) {
            IO.println("配列の範囲外です");
        }
    }
}
```

```text
$ java Main.java
配列の範囲外です
```

この例では、`parseInt("5")` は成功しますが、`numbers[5]`（範囲は 0〜2）で `ArrayIndexOutOfBoundsException` が起きます。
2つ目の `catch` がそれを捕まえ、「配列の範囲外です」が表示されました。
このように、起きうる例外の種類ごとに、対応を書き分けられます。
（似た対応をまとめたいときは、`catch (NumberFormatException | ArrayIndexOutOfBoundsException e)` のように、`|` で複数の型をまとめて捕まえることもできます。）

---

## まとめ

- **try-catch** で、例外を捕まえて対応すれば、プログラムを止めずに続けられる
- `try { }` に「例外が起きるかもしれない処理」、`catch (型 e) { }` に「対応」を書く
- `try` で例外が起きると、その場で中断し `catch` へ飛び、対応後は続きから進む
- `catch` の `e` から、`e.getMessage()` などで例外の情報を取り出せる
- `catch` を複数並べて、例外の種類ごとに対応を分けられる（`|` でまとめることも）

次の節では、例外が起きても**必ず実行される** `finally` と、後始末を確実にする try-with-resources を学びます。

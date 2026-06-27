---
title: テキストの読み書き ― readString・writeString
llm: true
co-author: ["Claude Opus 4.7"]
---

## テキストの読み書き ― readString・writeString

いよいよ、ファイルにテキストを**書き込み**、**読み込み**ます。
`Files` には、文字列をまるごと扱う、とても手軽なメソッドがあります。
この節では、**`writeString`** と **`readString`** を学びます。

---

## ファイルに書き込む ― writeString

**`Files.writeString(パス, 内容)`** で、文字列を、まるごとファイルに書き込めます。

```java
import java.nio.file.*;

public class Main {
    public static void main(String[] args) throws Exception {
        Path path = Path.of("memo.txt");
        Files.writeString(path, "こんにちは、ファイル！");

        IO.println("書き込みました");
    }
}
```

```text
書き込みました
```

これを実行すると、`memo.txt` というファイルが作られ、「こんにちは、ファイル！」という内容が書き込まれます。
（同じ名前のファイルがすでにあれば、**上書き**されます。）

`main` に **`throws Exception`** を付けている点に注目してください。
ファイル操作は、`IOException`（チェック例外、第20章）を起こす可能性があるので、「例外を投げるかもしれない」と宣言する必要があるのです（くわしくは第5節）。

---

## ファイルから読み込む ― readString

**`Files.readString(パス)`** で、ファイルの内容を、まるごと文字列として読み込めます。

```java
import java.nio.file.*;

public class Main {
    public static void main(String[] args) throws Exception {
        Path path = Path.of("memo.txt");
        String content = Files.readString(path);

        IO.println("読み込んだ内容: " + content);
    }
}
```

```text
読み込んだ内容: こんにちは、ファイル！
```

`Files.readString(path)` が、`memo.txt` の中身を、1つの文字列として返してくれました。
ファイル全体が、そのまま `String` になるので、とても手軽です。

---

## 書いて、すぐ読む

書き込みと読み込みを、続けて行ってみましょう。

```java
import java.nio.file.*;

public class Main {
    public static void main(String[] args) throws Exception {
        Path path = Path.of("greeting.txt");

        Files.writeString(path, "おはよう\nこんにちは\nこんばんは");   // 書き込む
        String content = Files.readString(path);                    // 読み込む

        IO.println(content);
    }
}
```

```text
おはよう
こんにちは
こんばんは
```

書き込んだ内容（改行 `\n` を含む）が、そのまま読み込まれて、表示されました。
`writeString` と `readString` は、「**ファイル全体を、1つの文字列として、まとめて扱う**」のに、ぴったりです。

---

## 追記する ― StandardOpenOption.APPEND

`writeString` は、デフォルトでは**上書き**ですが、「**末尾に追記したい**」こともあります。
そのときは、**`StandardOpenOption.APPEND`** を渡します。

```java
import java.nio.file.*;

public class Main {
    public static void main(String[] args) throws Exception {
        Path path = Path.of("log.txt");

        Files.writeString(path, "1行目\n");                                  // 新規作成
        Files.writeString(path, "2行目\n", StandardOpenOption.APPEND);       // 追記
        Files.writeString(path, "3行目\n", StandardOpenOption.APPEND);       // 追記

        IO.println(Files.readString(path));
    }
}
```

```text
1行目
2行目
3行目
```

`StandardOpenOption.APPEND` を付けると、上書きではなく、**ファイルの末尾に書き足し**ます。
ログ（記録）のように、「あとから、どんどん書き足していく」用途に使います。

---

## 大きなファイルには注意

`readString` は、ファイル全体を一度にメモリへ読み込みます。
そのため、**とても大きなファイル**（数GBなど）には向きません。メモリを使い果たしてしまう恐れがあります。

- 小さい〜中くらいのファイル → `readString`・`writeString` で手軽に
- 大きなファイル → 次の節の「**1行ずつ処理する**」方法を使う

ふだん扱う設定ファイルやメモ程度なら、`readString`・`writeString` で十分です。

---

## まとめ

- **`Files.writeString(パス, 内容)`** … 文字列をファイルに書き込む（デフォルトは**上書き**、なければ新規作成）
- **`Files.readString(パス)`** … ファイル全体を、1つの文字列として読み込む
- ファイル操作は `IOException` を起こしうるので、`main` に **`throws Exception`** が必要
- 追記したいときは **`StandardOpenOption.APPEND`** を渡す
- **大きなファイル**には `readString` は不向き（次の節の方法を使う）

次の節では、複数行を扱う、行単位の読み書きを学びます。

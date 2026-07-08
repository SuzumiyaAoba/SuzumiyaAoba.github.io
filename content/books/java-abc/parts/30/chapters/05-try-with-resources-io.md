---
title: 入出力と例外 ― IOException と try-with-resources
llm: true
co-author: ["Claude Opus 4.7"]
---

## 入出力と例外 ― IOException と try-with-resources

ファイル入出力は、第20章で学んだ**例外処理**と、切っても切れない関係にあります。
「ファイルがない」「読み取り権限がない」など、**プログラムの外側の事情**で、失敗することがあるからです。
この節では、入出力の例外への向き合い方を、まとめて学びます。

---

## なぜ例外が必要なのか

ファイル操作は、こちらが正しくコードを書いていても、**失敗することがあります**。

- 読もうとしたファイルが、存在しない
- 書き込もうとしたフォルダに、権限がない
- ディスクがいっぱいで、書き込めない

これらは、第20章で学んだ「**チェック例外**」 ―― プログラムの外側の事情で起きる、備えるべき例外 ―― の、まさに典型です。
そのため、`Files` のメソッドは、**`IOException`**（入出力例外、チェック例外）を投げる可能性があります。

---

## IOException に備える ― throws か try-catch

チェック例外（第20章）なので、`IOException` は「**処理（try-catch）するか、宣言（throws）するか**」のどちらかが必須です。

### 方法1 ― throws で宣言する

これまでのこの章のサンプルのように、`main` に **`throws Exception`** を付けて、「例外を投げるかも」と宣言する方法です。

```java
import java.nio.file.*;

public class Main {
    public static void main(String[] args) throws Exception {   // 宣言する
        String content = Files.readString(Path.of("memo.txt"));
        IO.println(content);
    }
}
```

学習中や、小さなプログラムでは、これでも十分です。
ただし、例外が起きると、プログラムは止まってしまいます。

### 方法2 ― try-catch で対応する

実用的なプログラムでは、**try-catch**（第20章）で、失敗に**きちんと対応**します。

```java
import java.nio.file.*;
import java.io.IOException;

public class Main {
    public static void main(String[] args) {
        Path path = Path.of("memo.txt");
        try {
            String content = Files.readString(path);
            IO.println(content);
        } catch (IOException e) {
            IO.println("ファイルを読み込めませんでした: " + e.getMessage());
        }
    }
}
```

```text line-numbers=false
ファイルを読み込めませんでした: memo.txt
```

（`memo.txt` が存在しない場合の、出力の一例です。）

ファイルがなくても、プログラムは止まらず、「読み込めませんでした」と、やさしく対応できました。
「ファイルがないかもしれない」のは、**ありえる事態**なので、こうして備えておくのが、堅牢なプログラムです。

---

## 存在しないファイルの例外 ― NoSuchFileException

存在しないファイルを読もうとすると、`IOException` の仲間である **`NoSuchFileException`** が起きます。

```java
import java.nio.file.*;

public class Main {
    public static void main(String[] args) {
        try {
            Files.readString(Path.of("not_exist.txt"));
        } catch (NoSuchFileException e) {
            IO.println("ファイルが見つかりません: " + e.getMessage());
        } catch (IOException e) {
            IO.println("その他の入出力エラー: " + e.getMessage());
        }
    }
}
```

```text line-numbers=false
ファイルが見つかりません: not_exist.txt
```

`NoSuchFileException`（ファイルが見つからない例外）は、`IOException` の一種です。
第20章で学んだとおり、`catch` を複数並べて、「**ファイルがない場合**」と「**その他の入出力エラー**」で、対応を分けられます。
（`NoSuchFileException` は `IOException` の子なので、より具体的な `NoSuchFileException` を**先に**書きます。第20章のとおりです。）

---

## ファイルを「開く」操作は、try-with-resources で

第20章で学んだ **try-with-resources** は、ファイル入出力で、特に重要です。
ファイルを「開いたまま」扱う操作 ―― 第3節の `Files.lines`、第4節の `Files.list`、そして次に見る `BufferedReader` など ―― は、使い終わったら**閉じる**必要があります。

```java
import java.nio.file.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws Exception {
        Path path = Path.of("memo.txt");

        // BufferedReader で、1行ずつ読む（開いたら閉じる必要がある）
        try (BufferedReader reader = Files.newBufferedReader(path)) {
            String line;
            while ((line = reader.readLine()) != null) {   // 1行ずつ、最後まで
                IO.println("読: " + line);
            }
        }   // ここ（try-with-resources）で、自動的に閉じられる
    }
}
```

`Files.newBufferedReader(path)` は、ファイルを**開いて**、1行ずつ読むための道具（`BufferedReader`）を返します。
これは使い終わったら閉じる必要があるので、**`try (...)`** で囲みます。
こうすれば、処理が終わっても、途中で例外が起きても、ファイルは**確実に閉じられます**（第20章のとおり）。

> **どれを使えばいい？**
>
> - **手軽に全体を読み書き** → `Files.readString`・`writeString`（自動で閉じる。閉じる心配なし）
> - **全行をリストで** → `Files.readAllLines`・`Files.write`（同上）
> - **大きなファイルを1行ずつ** → `Files.lines` や `BufferedReader`（**try-with-resources で閉じる**）
>
> 初心者のうちは、まず `readString`・`writeString`・`readAllLines` を使えば十分です。
> 大きなファイルを扱うときに、「開いたら閉じる（try-with-resources）」を思い出しましょう。

---

## まとめ

- ファイル操作は、外側の事情で失敗しうるので、**`IOException`**（チェック例外）を投げる
- チェック例外なので、**`throws`** で宣言するか、**`try-catch`** で対応する（第20章）
- 存在しないファイルは **`NoSuchFileException`**（`IOException` の一種。`catch` を分けられる）
- ファイルを**開いたまま**扱うもの（`Files.lines`・`Files.list`・`BufferedReader`）は、**try-with-resources** で閉じる
- 手軽な `readString`・`writeString`・`readAllLines` は、自動で閉じてくれる

次の節では、ファイル入出力でつまずきやすいポイントを、まとめて確認します。

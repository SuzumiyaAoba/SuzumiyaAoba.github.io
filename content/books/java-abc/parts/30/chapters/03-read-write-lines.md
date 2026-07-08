---
title: 行単位の読み書き
llm: true
co-author: ["Claude Opus 4.7"]
---

## 行単位の読み書き

テキストファイルは、「**行の集まり**」として扱うことが、よくあります。
CSV、ログ、設定ファイルなど、1行が1件のデータになっている、という形です。
この節では、ファイルを**行単位**で読み書きする方法を学びます。

---

## 複数行を、まとめて書き込む ― Files.write

複数の行を書き込むには、**`Files.write(パス, リスト)`** が便利です。
`List`（第21章）の各要素が、それぞれ**1行**として書き込まれます。

```java
import java.nio.file.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws Exception {
        List<String> fruits = List.of("りんご", "みかん", "ぶどう");
        Files.write(Path.of("fruits.txt"), fruits);

        IO.println(Files.readString(Path.of("fruits.txt")));
    }
}
```

```text line-numbers=false
りんご
みかん
ぶどう

```

リストの3要素が、それぞれ1行ずつ書き込まれました（各行の末尾には、自動的に改行が付きます）。
`writeString` で `"りんご\nみかん\nぶどう\n"` と自分で改行を書くより、リストをそのまま渡せて、すっきりします。

---

## 全行を、リストとして読み込む ― readAllLines

ファイルの全行を、`List<String>`（1行が1要素）として読み込むには、**`Files.readAllLines(パス)`** を使います。

```java
import java.nio.file.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws Exception {
        List<String> lines = Files.readAllLines(Path.of("fruits.txt"));

        IO.println("行数: " + lines.size());
        for (String line : lines) {
            IO.println("> " + line);
        }
    }
}
```

```text line-numbers=false
行数: 3
> りんご
> みかん
> ぶどう
```

`readAllLines` は、各行を要素とする `List<String>` を返します。
あとは、第21章で学んだ for-each で、1行ずつ処理できます。
「1行ごとに、何か処理をする」という、よくあるパターンに、ぴったりです。

---

## 大きなファイルを、1行ずつ処理する ― Files.lines

`readAllLines` は、全行を一度にメモリへ読み込みます。
**とても大きなファイル**では、これがメモリを圧迫することがあります。

そんなときは、**`Files.lines(パス)`** を使います。
これは、ファイルの行を、第23章で学んだ**ストリーム**として返します。
全行を一度に読み込まず、**1行ずつ流して処理**できるので、大きなファイルでも安全です。

```java
import java.nio.file.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) throws Exception {
        Path path = Path.of("fruits.txt");

        // 「み」を含む行の数を数える
        try (Stream<String> lines = Files.lines(path)) {
            long count = lines.filter(line -> line.contains("み")).count();
            IO.println("「み」を含む行: " + count);
        }
    }
}
```

```text line-numbers=false
「み」を含む行: 1
```

`Files.lines(path)` で得たストリームに、第23章の `filter`・`count` を、そのまま使えています。
ファイル処理と、ストリームの知識が、ここで1つにつながりました。

ここで、**`try (...)`**（try-with-resources、第20章）で囲んでいる点が重要です。
`Files.lines` が返すストリームは、内部でファイルを開いています。
処理が終わったら、そのファイルを**閉じる**必要があるため、try-with-resources で囲んで、自動的に閉じてもらうのです。
（`readString`・`readAllLines`・`write` は、読み書きが終わると自動で閉じてくれるので、この囲みは不要です。`Files.lines` は、ストリームとして「開いたまま」返すので、明示的に閉じる必要があります。）

---

## 行単位の読み書きまとめ

| やりたいこと | メソッド | 戻り値・引数 |
|---|---|---|
| 複数行を書き込む | `Files.write(パス, リスト)` | `List` の各要素が1行 |
| 全行を読み込む | `Files.readAllLines(パス)` | `List<String>` |
| 1行ずつ処理（大きいファイル） | `Files.lines(パス)` | `Stream<String>`（要 try-with-resources） |

- **小さい〜中くらい**のファイル → `readAllLines`（手軽。`List` で扱える）
- **大きな**ファイル → `Files.lines`（ストリームで、1行ずつ。try-with-resources で閉じる）

---

## まとめ

- **`Files.write(パス, リスト)`** … `List` の各要素を、1行ずつ書き込む
- **`Files.readAllLines(パス)`** … 全行を `List<String>` として読み込む（for-each で処理）
- **`Files.lines(パス)`** … 行を**ストリーム**として返す。大きなファイルでも1行ずつ安全に処理
- `Files.lines` は、ファイルを開いたまま返すので、**try-with-resources** で閉じる
- 大きさに応じて、`readAllLines`（手軽）と `Files.lines`（大きいファイル）を使い分ける

次の節では、ファイルだけでなく、**ディレクトリ（フォルダ）**を操作する方法を学びます。

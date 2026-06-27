---
title: ディレクトリの操作
llm: true
co-author: ["Claude Opus 4.7"]
---

## ディレクトリの操作

ファイルだけでなく、**ディレクトリ**（フォルダ）も、`Files` で操作できます。
「ファイルが存在するか確認する」「フォルダを作る」「フォルダの中身を一覧する」――
この節では、こうした操作を学びます。

---

## 存在するか確認する ― exists

ファイルやフォルダが**存在するか**は、**`Files.exists(パス)`** で確認できます。結果は `boolean` です。

```java
import java.nio.file.*;

public class Main {
    public static void main(String[] args) throws Exception {
        Path path = Path.of("memo.txt");

        if (Files.exists(path)) {
            IO.println("ファイルは存在します");
        } else {
            IO.println("ファイルは存在しません");
        }
    }
}
```

「読み込む前に、ファイルがあるか確認する」のは、とても大切です（ないファイルを読もうとすると、例外になります。第5節）。
`Files.exists` で、事前に確かめておけば、安全に処理を進められます。
逆を調べる `Files.notExists(パス)` もあります。

---

## フォルダを作る ― createDirectories

フォルダを作るには、**`Files.createDirectories(パス)`** を使います。

```java
import java.nio.file.*;

public class Main {
    public static void main(String[] args) throws Exception {
        Path dir = Path.of("output/reports");
        Files.createDirectories(dir);

        IO.println("フォルダを作りました: " + Files.exists(dir));
    }
}
```

```text
フォルダを作りました: true
```

`createDirectories` は、**途中のフォルダも、まとめて作って**くれます。
上の例では、`output` がなくても、`output` と、その中の `reports` を、一度に作ります。
「結果を保存するフォルダを、なければ作っておく」といった準備に、よく使います。

> **補足: createDirectory と createDirectories**
>
> 似た名前で、`Files.createDirectory(...)`（最後に `s` がない）もあります。
> こちらは「1階層だけ」作るもので、途中のフォルダがないとエラーになります。
> 途中も含めてまとめて作る **`createDirectories`**（`s` 付き）のほうが、安全で便利です。

---

## フォルダの中身を一覧する ― Files.list

フォルダの中にある、ファイルやフォルダの一覧は、**`Files.list(パス)`** で取得できます。
これは、中身を**ストリーム**（第23章）として返します。

```java
import java.nio.file.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) throws Exception {
        Path dir = Path.of(".");   // 「.」は、いまいるフォルダ

        try (Stream<Path> files = Files.list(dir)) {
            files.forEach(p -> IO.println(p.getFileName()));
        }
    }
}
```

`Files.list(dir)` で、`dir` フォルダの中身が、`Path` のストリームとして得られます。
`forEach`（第23章）で、1つずつファイル名を表示しています。
（`Path.of(".")` の `.` は、「現在のフォルダ」を表します。）

`Files.list` も、前の節の `Files.lines` と同じく、**ストリームを返すので、try-with-resources で閉じる**必要があります。
「`Files` でストリームを返すメソッド（`lines`・`list`）は、try-with-resources で囲む」と覚えておきましょう。

---

## ファイルを削除する ― delete

ファイルやフォルダを削除するには、**`Files.delete(パス)`** を使います。

```java
import java.nio.file.*;

public class Main {
    public static void main(String[] args) throws Exception {
        Path path = Path.of("temp.txt");
        Files.writeString(path, "一時ファイル");

        Files.deleteIfExists(path);   // あれば削除する
        IO.println("削除後に存在するか: " + Files.exists(path));
    }
}
```

```text
削除後に存在するか: false
```

- `Files.delete(パス)` … 削除する（ファイルがないと例外になる）
- `Files.deleteIfExists(パス)` … **あれば**削除する（なくても例外にならない。安全）

削除は、取り返しがつかない操作です。`deleteIfExists` を使い、本当に消してよいか、よく確認してから行いましょう。

---

## ディレクトリ操作のまとめ

| やりたいこと | メソッド |
|---|---|
| 存在確認 | `Files.exists(パス)` / `Files.notExists(パス)` |
| フォルダ作成 | `Files.createDirectories(パス)`（途中も作る） |
| 中身の一覧 | `Files.list(パス)`（ストリーム。要 try-with-resources） |
| 削除 | `Files.deleteIfExists(パス)` |

---

## まとめ

- **`Files.exists(パス)`** … ファイル・フォルダの存在を確認（読む前のチェックに）
- **`Files.createDirectories(パス)`** … フォルダを作る（途中のフォルダもまとめて）
- **`Files.list(パス)`** … フォルダの中身をストリームで取得（**try-with-resources** で閉じる）
- **`Files.deleteIfExists(パス)`** … あれば削除（なくても例外にならず安全）
- 削除は取り返しがつかないので、慎重に

次の節では、ファイル操作に欠かせない**例外処理**を、くわしく学びます。

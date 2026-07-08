---
title: よくあるつまずき
llm: true
co-author: ["Claude Opus 4.7"]
---

## よくあるつまずき

ファイル入出力で、初心者がつまずきやすいポイントを、まとめて確認します。

---

## 1. 存在しないファイルを読もうとする

もっともよくあるのが、ないファイルを読もうとして、例外になることです。

```java
String content = Files.readString(Path.of("not_exist.txt"));
```

```text line-numbers=false
Exception in thread "main" java.nio.file.NoSuchFileException: not_exist.txt
```

`NoSuchFileException`（ファイルが見つからない、第5節）です。
読む前に **`Files.exists(path)`** で確認するか、**`try-catch`** で対応しましょう。

```java
Path path = Path.of("data.txt");
if (Files.exists(path)) {
    String content = Files.readString(path);
    // ...
} else {
    IO.println("ファイルがありません");
}
```

---

## 2. IOException を処理し忘れる

`Files` のメソッドは `IOException`（チェック例外）を投げます。
これを `throws` も `try-catch` もせずに書くと、**コンパイルエラー**になります。

```java
public static void main(String[] args) {   // throws がない
    Files.readString(Path.of("memo.txt"));  // IOException を処理していない
}
```

```text line-numbers=false
エラー: 例外java.io.IOExceptionは報告されません。スローするには、捕捉または宣言する必要があります
```

第20章のとおり、チェック例外は「処理（try-catch）」か「宣言（throws）」が必須です。
`main` に `throws Exception` を付けるか、`try-catch` で囲みましょう。

---

## 3. ストリームを返すメソッドを、閉じ忘れる

`Files.lines` や `Files.list` は、ファイルを**開いたまま**ストリームを返します。
これを **try-with-resources で囲まない**と、ファイルが開きっぱなしになり、資源の無駄づかいになります。

```java
// △ 閉じられない（開きっぱなし）
Stream<String> lines = Files.lines(path);
lines.forEach(IO::println);

// ◯ try-with-resources で、確実に閉じる
try (Stream<String> lines = Files.lines(path)) {
    lines.forEach(IO::println);
}
```

「`Files.lines`・`Files.list`・`BufferedReader` など、**開いたまま返すものは、try-with-resources で囲む**」と覚えておきましょう。
（`readString`・`readAllLines`・`write` は、自動で閉じてくれるので、囲み不要です。）

---

## 4. 上書きされることに気づかない

`Files.writeString` や `Files.write` は、デフォルトで**上書き**です。
すでにあるファイルに書き込むと、**前の内容は消えて**しまいます。

```java
Files.writeString(path, "新しい内容");   // 前の内容は消える（上書き）
```

「前の内容に**書き足したい**」つもりだったのに、消してしまう ―― これはよくある事故です。
追記したいときは、第2節の **`StandardOpenOption.APPEND`** を、忘れずに付けましょう。

```java
Files.writeString(path, "追記する内容\n", StandardOpenOption.APPEND);   // 末尾に追記
```

---

## 5. パスの区切り文字を、手書きする

パスの区切りに、`\`（バックスラッシュ）を直接書くと、トラブルのもとです。

```java
Path path = Path.of("data\\users.txt");   // △ OS によって区切りが違う
```

ファイルの区切り文字は、OS によって違います（Windows は `\`、macOS・Linux は `/`）。
`Path.of(...)` は、`/` 区切りで書いておけば、各 OS に合わせてくれます。
さらに、フォルダとファイルを**分けて渡す**と、もっと安全です。

```java
Path path = Path.of("data", "users.txt");   // ◯ 区切りは Java に任せる
```

`Path.of("data", "users.txt")` のように、要素を分けて渡すと、Java が、その OS に合った区切りで、正しくつないでくれます。

---

## まとめ

- 読む前に **`Files.exists`** で確認する（ないと `NoSuchFileException`）
- **`IOException`** は処理（try-catch）か宣言（throws）が必須（第20章）
- **ストリームを返すもの**（`Files.lines`・`list`）は **try-with-resources** で閉じる
- `writeString`・`write` は**上書き**。追記は **`StandardOpenOption.APPEND`**
- パスは `/` 区切り、または **`Path.of("data", "users.txt")`** と分けて渡す

次は、この章で学んだ言葉を、用語集としてまとめます。

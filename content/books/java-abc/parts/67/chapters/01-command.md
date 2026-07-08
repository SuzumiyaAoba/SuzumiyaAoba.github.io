---
title: Command パターン
llm: true
co-author: ["Claude Opus 4.7"]
---

## Command パターン

**Command**（命令）パターンは、**「操作そのもの」をオブジェクト化する**振る舞いパターンです。
動詞を名詞にする、と言い換えてもよいでしょう。

---

## 解きたい問題

テキストエディタを作っているとします。

- 文字を挿入する
- 文字を削除する
- 文字を置換する

これらの操作を、ボタンクリックに**直接**書いてしまうと、

- 操作を**履歴に積む**ことができない（Undo できない）
- 操作を**ログ**として出せない
- 操作を**まとめて**キューに入れることができない

「**操作を、後で何かする対象**」にしたい ―― これが Command の動機です。

---

## 構造と登場人物

```text line-numbers=false
Command（インターフェース）
  ├ execute()
  └ undo()                ―― Undo を取るならこちらも

ConcreteCommand            具体的な命令（挿入命令、削除命令…）
   └ Receiver への参照

Receiver                   実際の対象（テキストバッファなど）

Invoker                    Command を受け取って実行・履歴管理する
```

クライアントは「**何を**しろ」を **Command オブジェクト**にしてから、Invoker に渡します。

---

## 実装例 ― Undo つきテキストエディタ

操作対象（Receiver）:

```java
public class TextBuffer {
    private final StringBuilder text = new StringBuilder();
    public void insert(int pos, String s) { text.insert(pos, s); }
    public void delete(int pos, int len) { text.delete(pos, pos + len); }
    @Override public String toString() { return text.toString(); }
}
```

Command:

```java
public interface Command {
    void execute();
    void undo();
}

public class InsertCommand implements Command {
    private final TextBuffer buffer;
    private final int pos;
    private final String text;
    public InsertCommand(TextBuffer buffer, int pos, String text) {
        this.buffer = buffer; this.pos = pos; this.text = text;
    }
    @Override public void execute() { buffer.insert(pos, text); }
    @Override public void undo() { buffer.delete(pos, text.length()); }
}
```

Invoker（履歴管理）:

```java
public class Editor {
    private final TextBuffer buffer = new TextBuffer();
    private final Deque<Command> history = new ArrayDeque<>();

    public void run(Command cmd) {
        cmd.execute();
        history.push(cmd);
    }

    public void undo() {
        if (!history.isEmpty()) history.pop().undo();
    }

    public String text() { return buffer.toString(); }
    public TextBuffer buffer() { return buffer; }
}
```

呼び出し:

```java
Editor editor = new Editor();
editor.run(new InsertCommand(editor.buffer(), 0, "Hello"));
editor.run(new InsertCommand(editor.buffer(), 5, ", World"));
System.out.println(editor.text());   // Hello, World

editor.undo();
System.out.println(editor.text());   // Hello

editor.undo();
System.out.println(editor.text());   // (空)
```

操作が**オブジェクト**になっているからこそ、

- **履歴に積める**（`Deque<Command>`）
- **逆操作**を呼べる（`undo()`）

ようになりました。

---

## ラムダで書く「軽い Command」

`undo` が不要なら、`Command` は **メソッド 1 つ**しかない関数型インターフェースです。
Java 標準の **`Runnable`** が、そのまま使えます。

```java
Deque<Runnable> queue = new ArrayDeque<>();
queue.offer(() -> System.out.println("起動"));
queue.offer(() -> System.out.println("ログイン"));

while (!queue.isEmpty()) {
    queue.poll().run();
}
```

「操作を、後で実行するもの」として扱うだけなら、**ラムダ式 + `Runnable`** で軽量に表せます。
`undo` や `redo`、シリアライズが必要になったら、Command クラスを起こす ―― という段階的な発想で構いません。

---

## 応用 ― イベントソーシング

「**何が起きたか**」を Command として記録しておくと、

- 全 Command を**順に再生**するだけで、最終状態を再構築できる
- Command を**シリアライズ**して別マシンに送ると、**分散同期**ができる
- DB の代わりに、**起きたことの履歴**を真実とする

これが **イベントソーシング**という設計です。
銀行口座、ゲームのリプレイ、`git` の履歴管理 ―― いずれも Command パターンの大きな応用形と捉えられます。

---

## 使いどころと注意点

向く場面:

- **Undo / Redo** を実装したい
- 操作の**キュー / バッチ実行**を作りたい
- 操作の**監査・再現**を可能にしたい
- スクリプト / マクロ機能

注意点:

- すべてを Command にすると、**クラス数が増える**
- **過去のデータを保持**するので、メモリの管理に注意
- 再生したときに**外部状態（時計や乱数）**が変わると同じにならない、というずれに留意

---

## まとめ

- **Command** は、操作を**オブジェクト化**する振る舞いパターン
- 履歴・キュー・Undo・イベントソーシングなど応用は広い
- 単純なものは **`Runnable` + ラムダ式**で十分
- 履歴と逆操作を持たせるなら、専用の `Command` クラスへ

次の章では、**State** ―― **状態によって振る舞いを変える**振る舞いパターンを見ます。

---
title: Memento パターン
llm: true
co-author: ["Claude Opus 4.7"]
---

## Memento パターン

**Memento**（形見）パターンは、**「オブジェクトの内部状態のスナップショットを、外から取り出して、後で戻せるようにする**」振る舞いパターンです。

Undo / Redo・チェックポイント・履歴管理に使われます。
**カプセル化**を壊さずに、状態を取り出すための工夫がポイントです。

---

## 解きたい問題

「画像編集アプリで Undo を実装したい」とします。

操作（フィルタを適用、色調補正など）は、**逆操作を書くのが大変**です。
そこで、操作の前に**画像のスナップショット**を取っておき、Undo 時にはそれを戻す、というアプローチを取ります。

ただし、画像クラスの**内部フィールド**（ピクセル配列など）を**公開**したくはありません。
**「カプセル化を保ちながら、状態を取り出して戻す**」 ―― これが Memento の役どころです。

---

## 構造と登場人物

```text
Originator                 状態を持つ本人（画像、エディタ）
  ├ createMemento(): Memento
  └ restore(memento)

Memento                    状態のスナップショット（中身は本人だけが読める）

Caretaker                  Memento を保持・管理する（履歴）
```

- **Originator** が、自分の状態を **Memento** に詰めて出す
- **Caretaker** はそれをただ持っているだけ（中身は理解しない）
- 必要なときに、Originator に Memento を渡して**戻してもらう**

「**外には中身を見せない、でも保存はする**」ための分担です。

---

## 実装例 ― 簡易テキストエディタ

```java
public class TextEditor {
    private StringBuilder text = new StringBuilder();

    public void append(String s) { text.append(s); }
    public String text() { return text.toString(); }

    // Memento を作る
    public Memento save() {
        return new Memento(text.toString());
    }
    // Memento から戻す
    public void restore(Memento m) {
        this.text = new StringBuilder(m.state());
    }

    public static final class Memento {
        private final String state;   // 外部に見せない
        private Memento(String state) { this.state = state; }
        private String state() { return state; }
    }
}
```

`Memento` のフィールドは `private` で、Originator（`TextEditor`）の内部からしか読めません。
**カプセル化を破らず**に、状態を保存して戻せる構造です。

Caretaker（履歴管理）:

```java
TextEditor editor = new TextEditor();
Deque<TextEditor.Memento> history = new ArrayDeque<>();

editor.append("Hello");
history.push(editor.save());

editor.append(", World");
history.push(editor.save());

editor.append("! やっぱり要らない");
editor.restore(history.pop());        // "Hello, World" まで戻る
System.out.println(editor.text());    // Hello, World

editor.restore(history.pop());
System.out.println(editor.text());    // Hello
```

履歴に積んでおいた Memento を**ポップして渡す**だけで、好きな時点に戻れます。

---

## レコードを使った現代的な書き方

不変な「**スナップショット**」を表すのは、レコード（第17章）の得意分野です。

```java
public class TextEditor {
    private String text = "";

    public void append(String s) { this.text += s; }
    public String text() { return text; }

    public record Snapshot(String text) {}

    public Snapshot snapshot() { return new Snapshot(text); }
    public void restore(Snapshot s) { this.text = s.text(); }
}
```

レコードを使うと、

- **不変**であることが言語レベルで保証される
- `equals` / `hashCode` / `toString` が自動
- フィールドが**公開される**ので、本来の Memento ほど「中身を隠す」目的は満たさない

「**Originator 以外には中身を絶対に触らせない**」厳格な隠蔽が要らなければ、**レコード版で十分実用的**です。
業務で見る Memento は、こちらの形が多いです。

---

## Command との使い分け

「Undo を実現する」という目的は共通でも、アプローチは違います。

| 観点 | Command | Memento |
|---|---|---|
| 戻し方 | 操作の**逆操作**を実行 | 取っておいた**状態**を復元 |
| メモリ | 操作だけ覚える（軽い） | スナップショット（重い場合あり） |
| 向く場面 | 逆操作が**書きやすい** | 逆操作が**書きにくい** |

実務では、**併用**することもあります。
「**一定間隔でスナップショット**＋**間は Command で差分**」というハイブリッドが、特に大きな状態の Undo で有効です。

---

## 使いどころと注意点

向く場面:

- **Undo / Redo** を実装したい
- 計算前後の**チェックポイント**を取りたい
- 状態遷移の**ロールバック**を実現したい

注意点:

- スナップショットが**重い**と、頻繁に取れない
- **共有可能な不変部分**をうまく使う（コピーオンライト、永続データ構造など）
- 外から復元できるとはいえ、戻す**範囲・順序**には責任が伴う

---

## まとめ

- **Memento** は、状態のスナップショットを**カプセル化を保って**保存するパターン
- 履歴・Undo・チェックポイントに使われる
- 現代の Java では、**レコード**を使うとシンプルに書ける
- Command との使い分け: 逆操作 vs スナップショット

次の章では、**Visitor** ―― 構造に処理を訪問させる振る舞いパターンを見ます。

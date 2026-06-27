---
title: switch と enum
llm: true
co-author: ["Claude Opus 4.7"]
---

## switch と enum

列挙型は、第6章で学んだ **switch** と、とても相性がよいしくみです。
「決まった選択肢のどれか」を判定するのは、まさに switch の得意分野だからです。
この節では、列挙型と switch を組み合わせます。

---

## enum を switch で分岐する

信号の色に応じて、行動を決める例を見てみましょう。
第6章で学んだ **switch 式**（`->`）を使います。

```java
enum Signal {
    RED, YELLOW, GREEN
}

public class Main {
    public static void main(String[] args) {
        Signal signal = Signal.RED;

        String action = switch (signal) {
            case RED    -> "止まれ";
            case YELLOW -> "注意";
            case GREEN  -> "進め";
        };

        IO.println(action);
    }
}
```

```text
$ java Main.java
止まれ
```

`switch (signal)` で、信号の色を判定しています。
`signal` が `RED` なので、`case RED ->` が選ばれ、`action` に `"止まれ"` が入りました。

ここで、注目してほしい点があります。
`case` のラベルが、`Signal.RED` ではなく、**`RED` とだけ**書かれていることです。
switch の対象が `Signal` 型だと分かっているので、`case` では列挙型名を省略して、定数名だけを書けるのです。すっきりしますね。

---

## default が、いらない

もう1つ、大事な点があります。
上の switch 式には、**`default` がありません**。それでもエラーになりません。

第6章で、「switch 式は、すべての場合を網羅する必要がある。たいてい `default` を書く」と学びました。
ところが、列挙型を switch するときは、**すべての列挙定数を `case` で網羅すれば、`default` を書かなくてよい**のです。
`Signal` は `RED`・`YELLOW`・`GREEN` の3つしかなく、その3つすべてに `case` があるので、「網羅できている」と Java が判断してくれます。

これは、列挙型ならではの、大きな利点です。

---

## 網羅していないと、教えてくれる

`default` がないからこそ、便利なことがあります。
もし、列挙定数のどれかを `case` で**書き忘れる**と、コンパイルエラーで教えてくれるのです。

```java
String action = switch (signal) {
    case RED    -> "止まれ";
    case YELLOW -> "注意";
    // GREEN を書き忘れた！
};
```

```text
エラー: switch式がすべての可能な入力値をカバーしていません
```

「`GREEN` の場合が抜けていますよ」と、Java が指摘してくれました。

これは、とても価値のある性質です。
たとえば、あとで `Signal` に新しい色（`BLINKING` など）を追加したとき、その色を処理し忘れている switch が、**すべてコンパイルエラーで分かる**のです。
「新しい状態を追加したのに、対応を忘れた」というバグを、動かす前に防げます。
列挙型と switch 式の組み合わせは、変更に強いプログラムを書くための、強力な道具になります。

> **補足: あえて default を書く場合**
>
> 「現時点の case だけ書いて、残りはまとめて処理したい」ときは、`default` を書くこともできます。
> ただし、`default` を書くと、列挙定数を追加しても、それが `default` に吸収されてしまい、「処理し忘れ」をコンパイラが教えてくれなくなります。
> 「すべての場合を、明示的に処理したい」ときは、`default` を書かずに全部の `case` を並べるほうが、変更に強くなります。

---

## まとめ

- 列挙型は、**switch**（とくに switch 式 `->`）と相性がよい
- `case` のラベルは、`Signal.RED` ではなく **`RED`** とだけ書く（列挙型名を省略できる）
- **すべての列挙定数を網羅すれば、`default` を書かなくてよい**
- 列挙定数を `case` で書き忘れると、**コンパイルエラー**で教えてくれる（処理し忘れを防げる）
- 列挙型＋switch 式は、変更に強いプログラムを支える

次の節では、列挙型に、フィールドやメソッドを持たせる方法を学びます。

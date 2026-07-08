---
title: フィールドとメソッドを持つ enum
llm: true
co-author: ["Claude Opus 4.7"]
---

## フィールドとメソッドを持つ enum

ここまでの列挙型は、`RED`・`YELLOW`・`GREEN` という「名前」だけを持っていました。
実は、Java の列挙型は、それだけではありません。
各列挙定数に、**データ（フィールド）やふるまい（メソッド）**を持たせることができます。
これは、Java の列挙型の、とても強力な特徴です。

---

## 各定数に、データを持たせる

信号の各色に、「日本語名」と「対応する行動」を、データとして持たせてみましょう。

```java
enum Signal {
    RED("赤", "止まれ"),
    YELLOW("黄", "注意"),
    GREEN("青", "進め");      // ← 定数の並びの最後に、セミコロン

    private final String label;
    private final String action;

    Signal(String label, String action) {   // コンストラクタ
        this.label = label;
        this.action = action;
    }

    String label()  { return label; }
    String action() { return action; }
}
```

少し複雑に見えますが、構造はこれまでのクラスと同じです。

- `RED("赤", "止まれ")` … 各定数に、`( )` で値を渡している
- `private final String label;` … 列挙型もフィールドを持てる
- `Signal(String label, String action)` … 列挙型のコンストラクタ。各定数を作るときに呼ばれる
- `label()`・`action()` … ふつうのメソッド

`RED("赤", "止まれ")` は、「`RED` という定数を、`label="赤"`、`action="止まれ"` という値とともに作る」という意味です。
列挙定数は、実は「あらかじめ作られた、特別なオブジェクト」なのです。それぞれが、自分のデータを持てます。

> **注意: 定数の並びの後に `;`、コンストラクタは private**
>
> 定数を並べたあと、フィールドやメソッドを書く場合は、定数の並びの最後に**セミコロン `;`** が必要です（`GREEN("青", "進め");` の `;`）。
> また、列挙型のコンストラクタは、外から `new Signal(...)` のように呼ぶことはできません（自動的に `private` 扱いです）。定数は、定義に書いたものだけが作られます。

---

## データを使う

各定数が持つデータを、メソッドで取り出してみましょう。

```java
enum Signal {
    RED("赤", "止まれ"), YELLOW("黄", "注意"), GREEN("青", "進め");
    private final String label;
    private final String action;
    Signal(String label, String action) { this.label = label; this.action = action; }
    String label()  { return label; }
    String action() { return action; }
}

public class Main {
    public static void main(String[] args) {
        Signal signal = Signal.RED;
        IO.println(signal.label() + "信号: " + signal.action());
    }
}
```

```text line-numbers=false
$ java Main.java
赤信号: 止まれ
```

`Signal.RED` が持つ `label`（"赤"）と `action`（"止まれ"）を、取り出して表示できました。
このように、列挙定数に関連する情報を、列挙型の中に**ひとまとめにして**持たせられます。
「赤信号は止まれ」という対応関係を、`Signal` という1つの型の中に、きれいに収められるのです。

---

## メソッドで、ふるまいを持たせる

列挙型には、データを使った**ふるまい（メソッド）**も持たせられます。
たとえば、「進んでよいか」を返すメソッドを加えてみましょう。

```java
enum Signal {
    RED("赤"), YELLOW("黄"), GREEN("青");
    private final String label;
    Signal(String label) { this.label = label; }

    boolean canGo() {
        return this == GREEN;   // 青のときだけ進める
    }
}

public class Main {
    public static void main(String[] args) {
        Signal signal = Signal.GREEN;
        if (signal.canGo()) {
            IO.println("進めます");
        } else {
            IO.println("止まってください");
        }
    }
}
```

```text line-numbers=false
$ java Main.java
進めます
```

`canGo()` の中で、`this == GREEN`（自分が `GREEN` か）を判定しています。
メソッドの中では、`this`（その列挙定数自身）を使えます。
このように、「信号に関する判断」も、`Signal` 型の中にまとめられます。
データだけでなく、ふるまいまで型の中に閉じ込められるのが、Java の列挙型の強力なところです。

---

## まとめ

- 列挙定数に、**フィールド（データ）やメソッド（ふるまい）**を持たせられる
- `RED("赤", "止まれ")` のように、各定数に `( )` で値を渡し、**コンストラクタ**で受け取る
- 定数の並びのあとに、フィールドやメソッドを書くときは、最後に **`;`** が必要
- 列挙型のコンストラクタは、自動的に `private`（外から `new` できない）
- 「列挙定数に関連するデータ・ふるまい」を、型の中にひとまとめにできる

次の節では、列挙型に最初から備わっている、便利なメソッドを学びます。

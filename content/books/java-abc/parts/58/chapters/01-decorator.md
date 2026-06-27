---
title: Decorator パターン
llm: true
co-author: ["Claude Opus 4.7"]
---

## Decorator パターン

**Decorator**（装飾者）パターンは、**既存オブジェクトに機能を「外から」追加する**ためのパターンです。
継承ではなく**包む**（ラップする）ことで、機能を**重ねて付け足す**ことができます。

---

## 解きたい問題

「テキストを画面に表示する」操作に、いろいろな**修飾**を加えたいとします。

- 通常の表示
- **枠で囲む**
- **強調表示**
- **行番号を付ける**

これらの**組み合わせ**もしたい。「枠 + 強調」「行番号 + 枠」など。
継承だけで対応しようとすると、

```
TextView
├ BoxedTextView
├ BoldTextView
├ NumberedTextView
├ BoxedBoldTextView          ← 組み合わせ!
├ BoxedNumberedTextView
├ BoldNumberedTextView
└ BoxedBoldNumberedTextView   ← 全組み合わせ!
```

**組み合わせ爆発**でクラスが手に負えなくなります。
これを、**「機能を着せ重ねる」**形で解くのが Decorator です。

---

## 継承との違い

Decorator は、**継承の代替**としてよく語られます。

| 観点 | 継承 | Decorator |
|---|---|---|
| 機能の追加方法 | クラスを増やす | オブジェクトを包む |
| 組み合わせ | クラス数が掛け算 | 自由に重ねられる |
| 実行時の柔軟性 | コンパイル時に固定 | 実行時に組み立てられる |
| 適した粒度 | 「**は**」関係（is-a） | 「**機能を加える**」関係 |

「あれもこれも継承で表したくなる」ときが、Decorator の出番です。

---

## 実装例 ― 文字列の装飾

共通のインターフェース:

```java
public interface TextView {
    String render();
}
```

基本実装（飾りなし）:

```java
public class PlainTextView implements TextView {
    private final String text;
    public PlainTextView(String text) { this.text = text; }
    @Override public String render() { return text; }
}
```

ここから、**「同じインターフェースを実装し、中で元の TextView を呼ぶ」**装飾者を作ります。

```java
public abstract class TextViewDecorator implements TextView {
    protected final TextView inner;
    protected TextViewDecorator(TextView inner) { this.inner = inner; }
}

public class BoxDecorator extends TextViewDecorator {
    public BoxDecorator(TextView inner) { super(inner); }
    @Override
    public String render() {
        return "[ " + inner.render() + " ]";
    }
}

public class BoldDecorator extends TextViewDecorator {
    public BoldDecorator(TextView inner) { super(inner); }
    @Override
    public String render() {
        return "**" + inner.render() + "**";
    }
}
```

呼び出し:

```java
TextView v1 = new BoxDecorator(new PlainTextView("Hello"));
System.out.println(v1.render());
// → [ Hello ]

TextView v2 = new BoxDecorator(new BoldDecorator(new PlainTextView("Hello")));
System.out.println(v2.render());
// → [ **Hello** ]
```

**包む順番を変えるだけ**で、結果が変わります。

---

## `java.io` と Decorator

Java の `java.io` パッケージは、Decorator の典型例です[^java-io-decorator]。

```java
Reader reader = new BufferedReader(             // バッファリング機能を追加
                  new InputStreamReader(         // バイト→文字 変換を追加
                    new FileInputStream(path))); // 基本のバイト読み込み
```

- `FileInputStream` は基本機能
- `InputStreamReader` がバイトを文字に変える機能を**着せ**
- `BufferedReader` がバッファ機能を**さらに着せる**

`Reader` 型として呼び出せるのは同じまま、機能だけが**積み上がる**わけです。
読み解けると、「あの分かりにくいラップの連鎖は、Decorator なのか」と腑に落ちます。

---

## ラムダで書く軽い Decorator

メソッド 1 つの場合は、ラムダで装飾も書けます。

```java
import java.util.function.Function;

Function<String, String> plain = s -> s;
Function<String, String> box = s -> "[ " + s + " ]";
Function<String, String> bold = s -> "**" + s + "**";

Function<String, String> boxed = plain.andThen(box);
Function<String, String> boxedBold = plain.andThen(bold).andThen(box);

System.out.println(boxedBold.apply("Hello"));
// → [ **Hello** ]
```

`Function#andThen` は、まさに「**次の装飾を重ねる**」操作です。
**関数合成**は、関数型プログラミングにおける Decorator のようなものです。

---

## 使いどころと注意点

向く場面:

- 機能を **後付けで重ねたい**
- 組み合わせの**爆発**が起きそうな継承を、すっきり整理したい
- 既存クラスを**壊さずに**機能を加えたい

注意点:

- **包む順序**で結果が変わる ―― 順序を意識した設計が必要
- **デバッグ時にスタックが深くなる**ことがある
- 装飾の**戻し方**が複雑になることがある

---

## まとめ

- **Decorator** は、機能を**着せ重ねる**ための構造パターン
- 継承だけでは爆発する組み合わせを、**包むこと**で柔軟に表現
- `java.io` のストリーム階層は、Decorator の代表例
- 関数なら、**`Function#andThen`** で同じ発想が書ける

次の章では、**Proxy** ―― **代理人**を立てるパターンを見ます。

[^java-io-decorator]: Java SE 25 API, `java.io` package, <https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/io/package-summary.html>。`FilterInputStream`／`FilterOutputStream`／`FilterReader`／`FilterWriter` は明示的な Decorator 基底クラスで、`BufferedReader`、`InputStreamReader`、`DataInputStream` などはこれを継承して機能を重ねる。

---
title: Flyweight パターン
llm: true
co-author: ["Claude Opus 4.7"]
---

## Flyweight パターン

**Flyweight**（軽量級）パターンは、**「同じ状態を持つオブジェクトを共有して、生成数とメモリ消費を抑える」**ためのパターンです。

「**たくさんの似たオブジェクト**」が必要な場面で効きます。Boxing 軽量化（プリミティブのキャッシュ）や、文字列のインターン化など、Java 標準ライブラリの中にも組み込まれています。

---

## 解きたい問題

「テキスト文書」のすべての文字を、それぞれオブジェクトとして表現することを考えてみましょう。

```java
public class Character {
    private final char ch;
    private final String fontFamily;
    private final int fontSize;
    private final String color;
    // ...
}
```

1 文書に 100 万文字あれば、**100 万個**の `Character` オブジェクトができます。
しかも、フォント・サイズ・色などは**ほとんど同じ**だったりします。

「**同じ属性を持つもの**は、1 つだけ作って共有しよう」 ―― これが Flyweight の発想です。

---

## 内部状態と外部状態

Flyweight を考えるときは、属性を 2 つに分けます。

- **内部状態**（intrinsic state）: オブジェクトが**自分で持つ**、共有してよい不変の属性
- **外部状態**（extrinsic state）: オブジェクトの**外**（呼び出し側）が持つ、状況依存の属性

文字の例では、

- 内部状態: 文字種・フォント・サイズ・色（同じものは共有してよい）
- 外部状態: 文書内の**位置**（インデックス、行番号） ―― これは共有できない

内部状態だけを持つ「**軽い**」オブジェクトを共有し、外部状態は使う側が持つ、と分担するのです。

---

## 実装例 ― 文字オブジェクトの共有

文字種ごとに、**1 つだけ**のインスタンスを作って共有します。

```java
import java.util.HashMap;
import java.util.Map;

public class CharacterGlyph {
    private final char ch;
    // 内部状態 = 共有してよい不変属性

    private CharacterGlyph(char ch) { this.ch = ch; }

    public void draw(int x, int y) {     // 外部状態は引数で受ける
        System.out.println("'" + ch + "' を (" + x + "," + y + ") に描画");
    }

    // ファクトリ + キャッシュ
    private static final Map<Character, CharacterGlyph> POOL = new HashMap<>();

    public static CharacterGlyph of(char ch) {
        return POOL.computeIfAbsent(ch, CharacterGlyph::new);
    }
}
```

呼び出し:

```java
String text = "hello";
int x = 0;
for (char ch : text.toCharArray()) {
    CharacterGlyph g = CharacterGlyph.of(ch);   // 同じ文字なら共有
    g.draw(x, 0);
    x += 10;
}
```

`'h'`・`'e'`・`'l'`・`'o'` は、**同じインスタンスが使い回される**ので、100 万文字でも実際のオブジェクトは数十個に収まります。

---

## Java 標準ライブラリの中の Flyweight

Java の中で、すでに **Flyweight が使われている例**を見てみましょう。

### `Integer.valueOf` のキャッシュ

```java
Integer a = Integer.valueOf(100);
Integer b = Integer.valueOf(100);
System.out.println(a == b);   // true（同じインスタンス）

Integer c = Integer.valueOf(1000);
Integer d = Integer.valueOf(1000);
System.out.println(c == d);   // false（別インスタンス）
```

`Integer` は `-128` から `127` の範囲を**キャッシュ**しています。
この範囲なら、`Integer.valueOf` は**同じインスタンス**を返してくれます。これが Flyweight です。

> オートボクシング（`int → Integer`）も内部で `Integer.valueOf` を使うので、
> 同じ仕組みが効いています。

### `Boolean.TRUE` / `Boolean.FALSE`

```java
Boolean.TRUE == Boolean.valueOf(true);   // true
```

`Boolean` のインスタンスは 2 つだけ。すべて使い回します。

### `String#intern`

```java
String a = "hello".intern();
String b = "hello".intern();
System.out.println(a == b);   // true
```

文字列をプールに登録して、同じ内容なら**同じインスタンス**にします。
明示的に使うことは少ないですが、`String` リテラルは自動的にプールに入ります。

---

## 使いどころと注意点

向く場面:

- 同じ属性のオブジェクトが**大量**に必要
- そのうち、**多くを共有可能**な属性が占める
- 生成・GC のコストを下げたい

注意点:

- **不変オブジェクト**である必要がある（共有されているのでセットしたら全員に影響する）
- 内部状態と外部状態の**分離が難しい**ことがある
- 共有プールが**ずっと残り続ける**と、メモリの逆効果になる
- **早すぎる最適化**は避ける。プロファイル（第48章）で根拠を持ってから

---

## まとめ

- **Flyweight** は、同じ状態のオブジェクトを**共有**して数を減らす構造パターン
- 内部状態（共有）と外部状態（個別）の**分離**が肝
- Java 標準（`Integer.valueOf`, `Boolean.TRUE`, `String#intern`）でも採用
- 必要なときだけ ―― **早すぎる最適化に注意**

これで、構造パターン（第56〜62章）は終わりです。
次の第63章からは、いよいよ最後の章群 ―― **振る舞いパターン**に入ります。

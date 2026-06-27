---
title: Iterator パターン
llm: true
co-author: ["Claude Opus 4.7"]
---

## Iterator パターン

**Iterator**（反復子）パターンは、**「コレクションの内部構造を見せずに、要素を 1 つずつ順番に取り出す」**ためのパターンです。

呼び出し側は、相手が配列なのか・リストなのか・ツリーなのかを意識せずに、**同じ「次・あるか」のインターフェースで**順に処理できます。

---

## 解きたい問題

「集合の中身を順に処理したい」とき、構造の違いを呼び出し側に**意識させたくありません**。

- 配列なら添字でループ
- リストなら `get(i)` でループ
- ツリーなら深さ優先で再帰

これらを**バラバラの形**で扱うと、呼び出し側が**コレクションの種類だけ書き方を変える**羽目になります。
Iterator は、「**取り出す**」操作だけを共通インターフェースとして提供します。

---

## `Iterable` / `Iterator` と for-each

Java では、**`Iterator` パターンが言語と標準ライブラリに組み込まれて**います[^java-iterable]。

```java
public interface Iterable<T> {
    Iterator<T> iterator();
}

public interface Iterator<T> {
    boolean hasNext();
    T next();
}
```

`Iterable` を実装したクラスは、**for-each 文**で回せます。

```java
List<String> names = List.of("Alice", "Bob", "Carol");
for (String name : names) {       // 内部で Iterator が使われる
    System.out.println(name);
}
```

コンパイラが裏で次のように展開します。

```java
Iterator<String> it = names.iterator();
while (it.hasNext()) {
    String name = it.next();
    System.out.println(name);
}
```

呼び出し側は、`names` がどんなコレクションでも**同じ書き方**で済みます。これが Iterator パターンの恩恵です。

---

## 自作の Iterator

自分のクラスを `for-each` で回せるようにするには、`Iterable` を実装すればよいです。

例: 1 から N までを返すレンジ。

```java
import java.util.Iterator;

public class Range implements Iterable<Integer> {
    private final int start;
    private final int end;

    public Range(int start, int end) {
        this.start = start;
        this.end = end;
    }

    @Override
    public Iterator<Integer> iterator() {
        return new Iterator<>() {
            private int cur = start;
            @Override public boolean hasNext() { return cur <= end; }
            @Override public Integer next() { return cur++; }
        };
    }
}
```

使い方:

```java
for (int i : new Range(1, 5)) {
    System.out.println(i);   // 1, 2, 3, 4, 5
}
```

「**順番に取り出す**」というロジックを、内部に閉じ込めました。

---

## Stream・Spliterator との関係

Iterator は**1 要素ずつ・順に・上から下へ**取り出します。
これに対して、**Stream API**（第23章）では、

- 並列処理ができる（`parallelStream()`）
- 中間操作を**遅延評価**できる
- 分割（splittable）して並列に取り扱える

ようになっています。
そのための裏方が **`Spliterator`** で、「分割できる Iterator」と捉えると分かりやすいでしょう。

「Iterator は順番の取り出し」「Spliterator は分割可能な取り出し」と整理すると、Stream API の構成も腑に落ちます。

---

## ラムダで書く軽い Iteration

実は、Stream API は「Iterator の置き換え」ではありません。両者は併用すべきものです。

- **構造に基づく順走査**は `Iterator` / `for-each`
- **データの加工パイプライン**は `Stream`

たとえば、

```java
names.forEach(System.out::println);                // ラムダで for-each
names.stream().map(String::toUpperCase).toList();  // データ加工
```

「順に処理」だけなら `forEach`、「途中で変換・集計」する場合は `Stream`、と使い分けます。

---

## 使いどころと注意点

向く場面:

- 自分でコレクションっぽいクラスを作るとき
- 内部構造を呼び出し側に**見せたくない**とき
- DSL を作るときの「**反復可能なオブジェクト**」を表現するとき

注意点:

- 1 つの `Iterator` は通常**1 度しか使えない**（再利用するなら `iterator()` を再度呼ぶ）
- `hasNext()` で**副作用**を書かないこと（呼ぶ回数が不定）
- **無限**を返すような Iterator を for-each で使うと、永久ループする

---

## まとめ

- **Iterator** は、コレクションの内部を見せずに**順に取り出す**振る舞いパターン
- Java では `Iterable` を実装すれば **for-each** で回せる
- Stream の裏には `Spliterator`（分割可能 Iterator）がある
- 「順走査は Iterator」「データ加工は Stream」が現代的な使い分け

次の章では、**Strategy** ―― アルゴリズムを**部品として差し替える**振る舞いパターンを見ます。

[^java-iterable]: Java SE 25 API, `java.lang.Iterable<T>`, <https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Iterable.html> および `java.util.Iterator<T>`, <https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Iterator.html>。`Iterable` を実装するクラスは Java の拡張 for 文（*JLS §14.14.2*）の対象になる。

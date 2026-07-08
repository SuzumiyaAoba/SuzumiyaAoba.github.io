---
title: ワイルドカード ― ? extends・? super と PECS
llm: true
co-author: ["Claude Opus 4.8"]
---

## ワイルドカード ― ? extends・? super と PECS

前節で、ジェネリクスは不変であること、そしてその不変性がときに窮屈であることを見ました。
`List<Integer>` を `List<Number>` として渡せない、あの不便さです。

この不便さを、**安全な範囲でだけ**ゆるめる道具が、**ワイルドカード**（Wildcard）です。
ワイルドカードは `?`（クエスチョンマーク）で書き、「**何かの型**」を表します[^jls-wildcard]。
`? extends`（上限境界）で共変を、`? super`（下限境界）で反変を、それぞれ安全に取り入れられます。

---

## `? extends` ―― 共変（読み出す側）

**`? extends 型`** は、「その型か、その子」を表します。
`List<? extends Number>` は、「`Number` か、その子のリスト」 ―― つまり `List<Integer>` でも `List<Double>` でも受け取れる、という意味です。
これで、前節の `sum` を書き直せます。

```java
static double sum(List<? extends Number> list) {   // Number か、その子のリスト
    double s = 0;
    for (Number n : list) s += n.doubleValue();
    return s;
}
```

```java
System.out.println(sum(List.of(1, 2, 3)));       // List<Integer> を渡せる
System.out.println(sum(List.of(1.5, 2.5)));      // List<Double> も渡せる
```

```text line-numbers=false
6.0
4.0
```

`List<Integer>` を `List<? extends Number>` として渡せました。これが、ワイルドカードによる**共変**です。

ただし、共変には**大事な制約**があります。`? extends` のリストには、要素を**追加できない**のです。

```java
import java.util.*;
public class ExtendsW {
    public static void main(String[] args) {
        List<Integer> ints = new ArrayList<>(List.of(1, 2, 3));
        List<? extends Number> nums = ints;   // OK: 共変
        Number n = nums.get(0);               // OK: 読み出しは Number として得られる
        System.out.println(n);
        nums.add(4);                          // これはできない
    }
}
```

```text line-numbers=false
$ javac ExtendsW.java
ExtendsW.java:8: エラー: 不適合な型: intをCAP#1に変換できません:
        nums.add(4);                          // これはできない
                 ^
（... 略 ...）
エラー1個
```

なぜ追加できないのでしょうか。
`nums` の中身は「`Number` の子の**どれか**のリスト」ですが、それが `Integer` のリストなのか `Double` のリストなのか、コンパイラには**特定できません**。
もし `Double` のリストだったら、そこに `Integer` の `4` を追加するのは間違いです。
だから Java は、「特定できない以上、追加は一律に禁止」という安全側の判断をします。
一方、**読み出し**は安全です。中身が何であれ、`Number` の子であることは確かなので、必ず `Number` として取り出せます。

> **補足: `? extends` に唯一入れられるのは `null`**
>
> `? extends` のリストに追加できないのは「型を特定できない値」です。
> 例外は `null` で、これはどんな参照型にも代入できるため、`nums.add(null);` だけはコンパイルを通ります（実用上、意味はほとんどありませんが）。

`? extends` は「**読み出す（供給する）側**」に向いています。データを**取り出して使う**だけの引数に付ける、と覚えてください。

---

## `? super` ―― 反変（書き込む側）

**`? super 型`** は、「その型か、その親」を表します。
`List<? super Integer>` は、「`Integer` か、その親のリスト」 ―― `List<Integer>`・`List<Number>`・`List<Object>` を受け取れる、という意味です。
`? extends` とは逆に、こちらは**追加**が得意です。

```java
import java.util.*;
public class SuperW {
    public static void main(String[] args) {
        List<Number> nums = new ArrayList<>();
        List<? super Integer> sink = nums;   // OK: 反変（Number は Integer の親）
        sink.add(1);                          // OK: Integer は必ず入れられる
        sink.add(2);
        System.out.println(nums);
        Object o = sink.get(0);               // 読み出すと Object になる
        System.out.println(o);
    }
}
```

```text line-numbers=false
$ java SuperW.java
[1, 2]
1
```

`sink` の中身は「`Integer` の親の**どれか**のリスト」です。
親が何であっても、`Integer` はその親の一種なので、`Integer` を**追加**するのは常に安全です。だから `add(1)` ができます。
一方、**読み出し**は苦手です。取り出せる値の型として保証できるのは、いちばん広い `Object` だけ。
そのため `sink.get(0)` は `Object` を返し、`Integer i = sink.get(0);` と受けようとすると、コンパイルエラーになります。

`? super` は「**書き込む（消費する）側**」に向いています。データを**入れる先**の引数に付ける、と覚えてください。

---

## PECS ―― どちらを使うか迷ったら

ここまでをまとめると、きれいな対応が見えてきます。

| 書き方 | 変性 | 得意なこと | 向いている役割 |
|---|---|---|---|
| `? extends 型` | 共変 | **読み出し**（追加は不可） | 供給する側（Producer） |
| `? super 型` | 反変 | **書き込み**（読むと Object） | 消費する側（Consumer） |

この対応を、頭文字で覚える合言葉が **PECS** です。

> **Producer - Extends, Consumer - Super**
> （供給する側には `extends`、消費する側には `super`）

「そのリストから**取り出して使う**（Producer）なら `? extends`」「そのリストに**入れる**（Consumer）なら `? super`」ということです。
両方したい（取り出しも追加もする）場合は、どちらの制約も満たせないため、ワイルドカードを使わず、ふつうの型引数（不変）にします。

PECS がきれいに現れるのが、「あるリストから別のリストへ要素をコピーする」メソッドです。

```java
import java.util.*;
public class Pecs {
    // src から読み（Producer → extends）、dest へ書く（Consumer → super）
    static <T> void copy(List<? super T> dest, List<? extends T> src) {
        for (T item : src) {
            dest.add(item);
        }
    }

    public static void main(String[] args) {
        List<Integer> ints = List.of(1, 2, 3);   // 供給元
        List<Number> dest = new ArrayList<>();    // 書き込み先（Integer より広い）
        copy(dest, ints);                          // Integer を Number のリストへコピー
        System.out.println(dest);
    }
}
```

```text line-numbers=false
$ java Pecs.java
[1, 2, 3]
```

`src`（供給元）は読み出すだけなので `? extends T`、`dest`（書き込み先）は追加するだけなので `? super T`。
この形にしておくと、「`Integer` のリストを、`Number` のリストへコピーする」といった、型が完全には一致しない組み合わせも、安全に扱えます。
これは、標準ライブラリの `java.util.Collections.copy` が実際に採っている形でもあります。

<Column title="PECS という言葉の出どころ">

「PECS（Producer-Extends, Consumer-Super）」という覚え方は、Joshua Bloch の名著『Effective Java』で広く知られるようになった合言葉です。
標準ライブラリの API を眺めると、この原則があちこちで使われていることに気づきます。
たとえば `Stream` の `forEach` は `Consumer<? super T>` を、`Comparator` を組み立てる各種メソッドも `? super` を使っています。
「取り出す側は `extends`、受け取る側は `super`」というレンズで API のシグネチャを読むと、設計の意図が見えてきて、ぐっと読みやすくなります。

</Column>

---

## 型を問わない `?` ―― 無制限ワイルドカード

境界（`extends` / `super`）を付けない、ただの **`?`** もあります。
`List<?>` は「**何かの型のリスト**（型は問わない）」という意味です。
「中身の型に関係なくできること」―― 要素数を数える、空にする、`null` かどうか調べる ―― だけをしたいときに使います。

```java
static int size(List<?> list) {   // 中身が何のリストでも受け取れる
    return list.size();
}
```

`List<?>` も、`null` 以外は追加できません（`? extends Object` と同じく共変扱いのため）。
「中身の型を気にせず、リストそのものを扱いたい」ときの、いちばんゆるい受け皿だと考えてください。

---

## まとめ

- **ワイルドカード** `?` は「何かの型」を表し、ジェネリクスの不変性を安全にゆるめる
- **`? extends 型`**（上限境界）は**共変**。**読み出し**はできるが**追加は不可**（`null` を除く）。供給する側（Producer）向き
- **`? super 型`**（下限境界）は**反変**。**追加**はできるが、**読み出すと `Object`**。消費する側（Consumer）向き
- 迷ったら **PECS**（Producer-Extends, Consumer-Super）。取り出すなら `extends`、入れるなら `super`、両方なら不変のまま
- 境界なしの **`?`** は「型を問わないリスト」。型に依存しない操作に使う

次の節では、少し毛色の違う共変 ―― オーバーライドで**戻り値の型を狭められる**「戻り値の共変性」を学びます。

[^jls-wildcard]: ワイルドカード（`?`、`? extends T`、`? super T`）は、*The Java® Language Specification, Java SE 25 Edition*, §4.5.1 "Type Arguments of Parameterized Types," [https://docs.oracle.com/javase/specs/jls/se25/html/jls-4.html#jls-4.5.1](<https://docs.oracle.com/javase/specs/jls/se25/html/jls-4.html#jls-4.5.1>) で定義されている。`? extends` を上限境界（upper bound）、`? super` を下限境界（lower bound）と呼ぶ。ワイルドカードの使い分けの指針は、Oracle 公式チュートリアル "Guidelines for Wildcard Use," [https://docs.oracle.com/javase/tutorial/java/generics/wildcardGuidelines.html](<https://docs.oracle.com/javase/tutorial/java/generics/wildcardGuidelines.html>) も参照。

---
title: 配列は共変、ジェネリクスは不変
llm: true
co-author: ["Claude Opus 4.8"]
---

## 配列は共変、ジェネリクスは不変

前節で、変性には「共変・反変・不変」の3通りがあることを学びました。
この節では、Java でもっとも分かりやすい対比 ―― 「**配列は共変**なのに、**ジェネリクスは不変**」 ―― を、実際に動かして確かめます。
この対比を理解すると、「なぜ `List<Integer>` を `List<Number>` に入れられないのか」という、初心者がよく戸惑うポイントの理由が見えてきます。

---

## 配列は共変 ―― 便利だけれど、危ない

Java の配列は、**共変**です。
`String` は `Object` の子（第14章）なので、`String[]` は `Object[]` の子として扱えます[^jls-array-subtyping]。

```java
Object[] arr = new String[3];   // String[] を Object[] として扱える（共変）
```

これは便利です。「どんな配列でも受け取って表示する」メソッドを、`Object[]` 型ひとつで書けるからです。
しかし、この共変性には**落とし穴**があります。次のコードを見てください。

```java
public class ArrayCov {
    public static void main(String[] args) {
        Object[] arr = new String[3];   // 中身の実体は String[]
        arr[0] = "こんにちは";           // OK
        System.out.println(arr[0]);
        arr[1] = 123;                    // Integer を入れようとする
    }
}
```

`arr` の型は `Object[]` なので、コンパイラから見れば「`arr[1] = 123;`（`Object` に `Integer` を代入）」は、何もおかしくありません。**コンパイルは通ってしまいます**。
ところが、`arr` の実体は `String[]` です。文字列の配列に数値を入れることはできません。
そのため、実行すると次のようになります。

```text
$ java ArrayCov.java
こんにちは
Exception in thread "main" java.lang.ArrayStoreException: java.lang.Integer
	at ArrayCov.main(ArrayCov.java:6)
```

`ArrayStoreException`（配列格納例外）が、**実行時**に発生しました[^jls-arraystore]。
配列は共変なので、こうした「型の食い違い」をコンパイル時にすべて防ぐことができません。
そのため Java は、配列に要素を格納するたびに**実行時のチェック**を行い、不適合ならこの例外を投げて安全を守っているのです。
言いかえると、配列の共変性のツケは、「エラーが実行時まで先送りされる」という形で支払われています。

---

## ジェネリクスは不変 ―― だから安全

同じことを、ジェネリクス（`List`）でやろうとすると、どうなるでしょうか。

```java
import java.util.*;
public class GenInv {
    public static void main(String[] args) {
        List<String> strs = new ArrayList<>();
        List<Object> objs = strs;   // これはできない
    }
}
```

```text
$ javac GenInv.java
GenInv.java:5: エラー: 不適合な型: List<String>をList<Object>に変換できません:
        List<Object> objs = strs;   // これはできない
                            ^
エラー1個
```

`String` は `Object` の子なのに、`List<String>` は `List<Object>` の子として扱えません。
これが「**ジェネリクスは不変**（Invariant）」という性質です[^jls-generic-subtyping]。
一見すると不便ですが、これは**わざとそうしている**のです。

もし `List<String>` を `List<Object>` として扱えてしまったら、配列と同じ事故が起きます。

```java
List<String> strs = new ArrayList<>();
List<Object> objs = strs;    // ★もしこれが許されたら…
objs.add(123);               // Object のリストに Integer を追加
String s = strs.get(0);      // strs から取り出すと…数値のはずが String 型！
```

配列では、この種の食い違いが `ArrayStoreException` として**実行時**に発覚しました。
ジェネリクスは、そもそも `List<Object> objs = strs;` の行を**コンパイルエラー**で止めることで、事故を**動かす前に**防いでいます。
「型の安全性を、実行時ではなくコンパイル時に守る」 ―― これがジェネリクスの一番の目的でした（第1節）。
その目的のために、ジェネリクスは「不変」という、少し窮屈だけれど安全な道を選んでいるのです。

<Column title="配列とジェネリクスは、なるべく混ぜない">

配列が共変、ジェネリクスが不変という「ねじれ」があるため、両者を混ぜると、わかりにくい制約に出会います。
たとえば、`new List<String>[10]`（ジェネリック型の配列を作る）は、コンパイルエラーになります。
これは、ジェネリクスの型情報が実行時には消える「型消去」（第1節の脚注）と、配列の実行時チェックがかみ合わないためです。

そのため実務では、「要素をたくさん持つなら、配列より `List`（コレクション）を使う」のが基本方針になります。
第3部でコレクションを学んだあとは、配列を直接使う場面はぐっと減っていきます。

</Column>

---

## 不変の「窮屈さ」―― 次への布石

ジェネリクスの不変性は安全ですが、ときに窮屈です。
たとえば、第4節で書いた「数値のリストの合計を求める」メソッドを考えてみましょう。

```java
static double sum(List<Number> list) {   // Number のリストだけ受け取る
    double s = 0;
    for (Number n : list) s += n.doubleValue();
    return s;
}
```

このメソッドに、`List<Integer>` を渡すことは **できません**。不変だからです。

```java
List<Integer> ints = List.of(1, 2, 3);
sum(ints);   // ✕ List<Integer> は List<Number> ではない（不変）
```

`Integer` は `Number` の仲間なのに、「`Integer` のリスト」は「`Number` のリスト」として渡せない ―― これは、いかにも不便です。
「読み出すだけ」なら、共変でも安全なはずです（前節の「読むだけなら共変」）。
この「安全な範囲でだけ、共変・反変をゆるす」ためのしくみが、次節で学ぶ**ワイルドカード**です。

---

## まとめ

- **配列は共変**。`String[]` を `Object[]` として扱えるが、不適合な代入は実行時に **`ArrayStoreException`** になる
- 配列の共変性は「エラーが実行時まで先送りされる」という危うさを持つ
- **ジェネリクスは不変**。`List<String>` は `List<Object>` として扱えず、`List<Object> x = strs;` はコンパイルエラー
- 不変なのは**わざと**で、型の食い違いを**コンパイル時**に防ぐため（安全だが少し窮屈）
- その窮屈さを、安全な範囲でゆるめる道具が、次節の**ワイルドカード**

次の節では、`? extends`・`? super` という**ワイルドカード**で、共変・反変を安全に取り入れる方法を学びます。

[^jls-array-subtyping]: 配列型どうしの部分型関係（`String[]` が `Object[]` のサブ型であること）は、*The Java® Language Specification, Java SE 25 Edition*, §4.10.3 "Subtyping among Array Types," [https://docs.oracle.com/javase/specs/jls/se25/html/jls-4.html#jls-4.10.3](<https://docs.oracle.com/javase/specs/jls/se25/html/jls-4.html#jls-4.10.3>) に定義されている。

[^jls-arraystore]: `ArrayStoreException` は、参照型の配列に、その配列の要素型と適合しない値を格納しようとしたときに投げられる。*The Java® Language Specification, Java SE 25 Edition*, §10.5 "Array Store Exception," [https://docs.oracle.com/javase/specs/jls/se25/html/jls-10.html#jls-10.5](<https://docs.oracle.com/javase/specs/jls/se25/html/jls-10.html#jls-10.5>)。

[^jls-generic-subtyping]: ジェネリック型（パラメータ化された型）の部分型関係は、*The Java® Language Specification, Java SE 25 Edition*, §4.10.2 "Subtyping among Class and Interface Types," [https://docs.oracle.com/javase/specs/jls/se25/html/jls-4.html#jls-4.10.2](<https://docs.oracle.com/javase/specs/jls/se25/html/jls-4.html#jls-4.10.2>) による。型引数が異なるパラメータ化型（`List<String>` と `List<Object>` など）どうしには、ワイルドカードを介さない限り部分型関係は生じない（不変）。

---
title: when ガードと網羅性
llm: true
co-author: ["Claude Opus 4.7"]
---

## when ガードと網羅性

パターンマッチングには、「型が合っていて、**さらに条件も満たすとき**」だけマッチさせる方法があります。
それが **`when` ガード**です。
また、`switch` の「すべての場合を網羅できているか」という、大切な話もします。
この節で、これらを学びます。

---

## when ガード ― 条件つきのパターン

`case` のうしろに **`when 条件`** を付けると、「型が合い、**かつ** その条件が `true`」のときだけ、その `case` が選ばれます。

```java
static String classify(Object obj) {
    return switch (obj) {
        case Integer i when i < 0  -> "負の整数: " + i;
        case Integer i when i == 0 -> "ゼロ";
        case Integer i             -> "正の整数: " + i;
        default                    -> "整数ではない";
    };
}

IO.println(classify(-5));
IO.println(classify(0));
IO.println(classify(42));
IO.println(classify("hello"));
```

```text line-numbers=false
負の整数: -5
ゼロ
正の整数: 42
整数ではない
```

`case Integer i when i < 0 ->` は、「`Integer` で、**かつ** `i < 0` なら」という意味です。
同じ `Integer` でも、`when` の条件によって、「負」「ゼロ」「正」に細かく分けられました。

ここで、**`case` は上から順にチェックされる**点が大切です。
`-5` は、まず `when i < 0` にマッチします。`0` は `when i < 0` を外れ、`when i == 0` にマッチします。`42` はどちらの条件も外れ、最後の `case Integer i`（条件なし）にマッチします。
「**細かい条件を上に、ゆるい条件を下に**」並べるのが、コツです。

---

## 網羅性 ― すべての場合をカバーする

第6章・第18章で、「switch 式は、すべての場合を網羅する必要がある」と学びました。
パターンマッチングの `switch` も同じで、**起こりうるすべての型を、カバーしなければなりません**。

`Object` のような「何でもあり」の型を `switch` する場合、すべての型を挙げ尽くすのは不可能です。
そこで、**`default`** を書いて、「それ以外」をカバーします。

```java
static String describe(Object obj) {
    return switch (obj) {
        case Integer i -> "整数";
        case String s  -> "文字列";
        default        -> "その他";   // これがないとコンパイルエラー
    };
}
```

`default` がないと、「`Double` や、ほかのあらゆる型が来たら、どうするの？」とコンパイラが心配し、エラーになります。
`Object` を `switch` するときは、`default` を忘れずに付けましょう。

---

## default がいらない場合 ― シールドクラス（予告）

実は、`default` を**書かなくてよい**場合があります。
それは、「**取りうる型が、あらかじめ限られている**」ときです。

第18章で、「enum の switch は、すべての列挙定数を網羅すれば `default` がいらない」と学びました。
それと同じことが、次の第27章で学ぶ**シールドクラス**でも起こります。

```java
// shape が「Circle・Rectangle・Triangle のどれか」と限定されていれば…
double area = switch (shape) {
    case Circle(double r)              -> r * r * 3.14;
    case Rectangle(double w, double h) -> w * h;
    case Triangle(double b, double h)  -> b * h / 2;
    // すべての種類を挙げたので、default は不要！
};
```

「取りうる型が3つだけ」とコンパイラが知っていれば、その3つを挙げ尽くした時点で、「網羅できている」と判断してくれます。
さらに、**もし新しい型を追加して、`case` を書き忘れたら、コンパイルエラーで教えてくれます**（第18章の enum と同じ利点です）。

この「取りうる型を限定する」しくみが、シールドクラスです。次の章で、くわしく学びます。

---

## null と when の注意

`when` ガードと `case null` は、組み合わせて使えます。
ただし、`null` は専用の `case null` でしか拾われない点に注意してください（`when` 付きの型パターンは、`null` にはマッチしません）。
迷ったら、「`null` を扱うなら `case null` を明示的に書く」と覚えておきましょう。

---

## まとめ

- **`when 条件`** で、「型が合い、かつ条件を満たす」ときだけマッチさせられる
- `case` は**上から順に**チェックされる（細かい条件を上、ゆるい条件を下に）
- `switch` は**網羅性**が必要。`Object` などは **`default`** で「それ以外」をカバーする
- 取りうる型が限られていれば（次章の**シールドクラス**）、`default` なしで網羅でき、書き忘れも防げる
- `null` を扱うなら、`case null` を明示的に書く

次の節では、パターンマッチングでつまずきやすいポイントを、まとめて確認します。

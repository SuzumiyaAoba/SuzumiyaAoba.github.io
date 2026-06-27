---
title: instanceof パターン ― おさらいと発展
llm: true
co-author: ["Claude Opus 4.7"]
---

## instanceof パターン ― おさらいと発展

まず、第15章で学んだ **`instanceof` のパターンマッチング**を、おさらいします。
そのうえで、`&&` と組み合わせる、便利な使い方を学びます。

---

## おさらい ― 確認と取り出しを1つに

第15章で、ダウンキャストには「確認 → キャスト」の2段階が必要だと学びました。

```java
// 昔の書き方（確認してから、キャストする）
if (obj instanceof String) {
    String s = (String) obj;   // わざわざキャストして、変数に入れ直す
    IO.println(s.length());
}
```

`instanceof` で「String か」を確認したのに、もう一度 `(String) obj` とキャストして、変数に入れています。同じことを2回書いていて、冗長でした。

**`instanceof` のパターンマッチング**を使うと、これを1つにまとめられます。

```java
// パターンマッチング（確認と取り出しを同時に）
if (obj instanceof String s) {   // String なら、s に入れてくれる
    IO.println(s.length());      // すぐ String として使える
}
```

`obj instanceof String s` は、「`obj` が `String` なら `true`。しかも、そのとき `obj` を `String` 型にした結果を、変数 `s` に入れる」という意味です。
キャストを自分で書かなくてよくなり、すっきりしました。
この `s` を、**パターン変数**（pattern variable）と呼びます。

---

## && と組み合わせる

`instanceof` パターンの便利なところは、**`&&` でそのまま条件を続けられる**ことです。
パターン変数 `s` を、同じ `if` の中で、すぐ使えます。

```java
Object obj = "Java";

if (obj instanceof String s && s.length() > 2) {
    IO.println("長い文字列: " + s);
}
```

```text
長い文字列: Java
```

`obj instanceof String s && s.length() > 2` は、「`obj` が `String` で、**かつ** その長さが2より大きいなら」という意味です。
`String` だと確認できたあとなので、`s.length()` を安全に呼べます。

これは、第5章で学んだ `&&` の「**短絡評価**」のおかげです。
`&&` は、左が `false` なら右を評価しません。だから、「`String` でない」場合は、`s.length()` が呼ばれることもなく、安全です。

---

## 早期リターンと組み合わせる

`instanceof` パターンは、「条件に合わなければ、早めに抜ける」書き方とも、相性がよいです。

```java
static int safeLength(Object obj) {
    if (!(obj instanceof String s)) {
        return 0;                  // String でなければ、0 を返して終了
    }
    return s.length();             // ここから先では、s が String だと保証される
}

IO.println(safeLength("hello"));
IO.println(safeLength(123));
```

```text
5
0
```

`if (!(obj instanceof String s))` は、「`String` で**なければ**」という意味です。
ここで `return` して抜けるので、その**あとの行では、`obj` は必ず `String`**だと分かっています。
そのため、`s.length()` を安全に呼べるのです。
（このように、パターン変数 `s` が「使える範囲」は、Java が賢く判断してくれます。）

---

## まとめ

- **`instanceof` パターン**（第15章）は、型の確認と変数への取り出しを、1つにまとめる
- `obj instanceof String s` … `String` なら、**パターン変数** `s` に入れてくれる（キャスト不要）
- **`&&`** で、`obj instanceof String s && s.length() > 2` のように条件を続けられる（短絡評価で安全）
- 「でなければ early return」とも組み合わせられる（その後の行で型が保証される）

次の節では、これを `switch` と組み合わせた、**型による分岐**を学びます。

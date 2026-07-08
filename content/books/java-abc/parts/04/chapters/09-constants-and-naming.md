---
title: 定数 final と、わかりやすい名前のつけ方
llm: true
co-author: ["Claude Opus 4.7"]
---

## 定数 final と、わかりやすい名前のつけ方

この章も、終わりが近づいてきました。この節では、2つのことを学びます。

- 書き換えたくない値を守る **`final`**
- 変数に、わかりやすい名前をつけるためのルール

---

## 書き換えられない変数 ― final

これまで見てきたように、変数の中身は、あとから自由に書き換えられます。
ですが、なかには「**絶対に書き換えたくない値**」もあります。

- 円周率（3.14…）
- 消費税率
- ゲームの満点や、制限時間

こうした値は、うっかり書き換えてしまうと、プログラムがおかしくなります。
そこで、変数の宣言に **`final`**（ファイナル）を付けると、**あとから書き換えられない変数**になります[^jls-final-variable]。

```text line-numbers=false
jshell> final int MAX = 100;
MAX ==> 100
```

`final` を付けて宣言した変数は、一度値を入れたら、それ以降は変更できません。
このような、変わらない値を**定数**（Constant）と呼びます。

定数を使うと、「この値は途中で変わらない」とはっきり示せるうえ、うっかり書き換えるミスも防げます。

> **注意: jshell では `final` の書き換えが通ってしまう**
>
> 実は jshell では、学習しやすいように制限がゆるくなっており、`final` を付けた変数でも、次のように書き換えが通ってしまいます。
>
> ```text
> jshell> MAX = 200;
> MAX ==> 200
> ```
>
> ですが、これは **jshell だけの特別な動き**です。
> ファイルに書いたふつうのプログラムで `final` の変数を書き換えようとすると、次のような**コンパイルエラー**になります。
>
> ```text
> エラー: final変数MAXに値を割り当てることはできません
>         MAX = 200;
>         ^
> ```
>
> 「`final` を付けたら、もう変えられない」と覚えておきましょう。

---

## 定数の名前は、すべて大文字で

定数には、名前のつけ方に慣習があります。
**すべて大文字で書き、単語の区切りはアンダースコア `_` でつなぐ**、というものです。

```java
final int MAX_SCORE = 100;
final double TAX_RATE = 0.1;
```

`MAX_SCORE` や `TAX_RATE` のように書くと、ひと目で「これは定数（書き換えない値）だ」とわかります。
次に説明する、ふつうの変数（小文字始まり）と見分けるための、大切な習慣です。

---

## 変数の名前のルール

変数の名前（**識別子**、Identifier）のつけ方には、**必ず守るルール**と、**守るべき慣習**があります。

### 必ず守るルール（破るとエラー）

- 使えるのは、英字・数字・`_`・`$`。ただし、**数字では始められない**（`1age` のような名前はエラー）[^jls-identifiers]
- Java があらかじめ使っている言葉（**予約語**。`int`・`class`・`if` など）は、名前に使えない[^jls-keywords]
- **大文字・小文字は区別される**（`age` と `Age` は別の変数）

### 守るべき慣習（守らなくても動くが、守るべき）

- 変数名は**小文字で始め**、2語目からの単語の先頭を大文字にする（`userAge`、`monthlyPrice`）。この書き方を**キャメルケース**（Camel Case）と呼びます
- **意味のわかる名前**をつける（`a` より `age`、`x` より `score`）
- ローマ字より、英語が好まれる（`namae` より `name`）

> **補足: パスカルケースとの違い**
>
> 第3章で、クラス名は `HelloWorld` のように**先頭も大文字**にする「パスカルケース」だ、と学びました。
> 変数名の「キャメルケース」は、先頭だけ小文字にする点が違います（`helloWorld`）。
> 「クラス名は大文字始まり、変数名は小文字始まり」と覚えておくと、コードがぐっと読みやすくなります。

<Column title="良い名前は、未来の自分への贈り物">

`int a = 20;` と書いても、プログラムは動きます。
ですが、しばらく経ってから見返すと、「この `a` は何の値だったかな？」と悩むことになります。

`int age = 20;` と書いておけば、誰が見ても、未来の自分が見ても、ひと目で意味がわかります。
名前を考えるのは少し手間ですが、それは後で読む人（多くは自分自身）への、ちょっとした贈り物なのです。

</Column>

---

## まとめ

この節では、`final` と命名のルールを学びました。

- **`final`** を付けると、書き換えられない変数（**定数**）になる
- jshell では `final` の書き換えが通ってしまうが、ファイルではコンパイルエラーになる
- 定数の名前は、すべて大文字で `_` 区切り（`MAX_SCORE`）にするのが慣習
- 変数名のルール: 数字で始めない、予約語は使えない、大文字・小文字は区別される
- 慣習: **キャメルケース**（`userAge`）で、意味のわかる名前をつける

次の節では、この章で学んだ変数とデータ型で、初心者がつまずきやすいポイントを、まとめて確認します。

[^jls-final-variable]: *The Java® Language Specification, Java SE 25 Edition*, §4.12.4 "final Variables," [https://docs.oracle.com/javase/specs/jls/se25/html/jls-4.html#jls-4.12.4](<https://docs.oracle.com/javase/specs/jls/se25/html/jls-4.html#jls-4.12.4>)。"A final variable may only be assigned to once." 一度初期化された後の再代入はコンパイルエラーとなる。

[^jls-identifiers]: *The Java® Language Specification, Java SE 25 Edition*, §3.8 "Identifiers," [https://docs.oracle.com/javase/specs/jls/se25/html/jls-3.html#jls-3.8](<https://docs.oracle.com/javase/specs/jls/se25/html/jls-3.html#jls-3.8>)。識別子は Java letter（英字、`$`、`_`、Unicode文字）で始まり、Java letter または digit で続く文字列で、予約語と一致してはならない。

[^jls-keywords]: *The Java® Language Specification, Java SE 25 Edition*, §3.9 "Keywords," [https://docs.oracle.com/javase/specs/jls/se25/html/jls-3.html#jls-3.9](<https://docs.oracle.com/javase/specs/jls/se25/html/jls-3.html#jls-3.9>)。`abstract`／`class`／`if`／`int` など50以上の予約語が定義されている。

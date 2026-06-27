---
title: クラス ― プログラムをまとめる単位
llm: true
co-author: ["Claude Opus 4.7"]
---

## クラス ― プログラムをまとめる単位

それでは、いちばん外側の部品から読み解いていきましょう。

```java
public class Main {
    …
}
```

この `public class Main { … }` の部分を、**クラス**（Class）と呼びます。

Java では、**プログラム（命令）は、すべてクラスの中に書く**という決まりがあります。
クラスは、プログラムの命令を書く、**いちばん外側のまとまり**です。
前の節で見た「入口（main）」も「命令（println）」も、すべてこのクラスの `{ }` の中に書かれていました。

「画面に文字を出すだけなのに、なぜクラスが必要なの？」と思うかもしれません。
これは、Java が**オブジェクト指向**（Object-Oriented）という考え方をもとに作られた言語だからです。
オブジェクト指向では、プログラムを「クラス」という単位でまとめて組み立てます。
そのため、たった1行の命令でも、まずはクラスを1つ用意する必要があるのです。

> **補足: クラスの本当の役割は、第2部で学ぶ**
>
> この章では、クラスを「命令を書く、いちばん外側のまとまり」として扱います。
> ですが、クラスには、もっと大切な役割があります。
> それは、**オブジェクト**（プログラムが扱う「もの」）を作るための **設計図** になる、という役割です。
> 1枚の設計図から同じ製品をいくつも作れるように、1つのクラスからは同じ種類のオブジェクトをいくつも作れます。
>
> いまはこの設計図の役割を理解する必要はありません。
> 「クラスには、この先で学ぶ深い意味がある」とだけ頭の片隅に置き、くわしくは第11章「クラスとオブジェクト」で学びましょう。

<Column title="「オブジェクト指向」は、どこで生まれたのか">

いまでは当たり前になっている「オブジェクト指向」という考え方は、いつごろ生まれたのでしょうか。
その源流は、1960年代のノルウェーで作られた **Simula**（シミュラ）という言語にさかのぼると言われています。現実のものごとを「クラス」や「オブジェクト」として表す、という発想を初めて本格的に取り入れた言語でした[^simula-67]。
その後、1970年代にアメリカで作られた **Smalltalk**（スモールトーク）がこの考え方をさらに推し進め、「**オブジェクト指向**（object-oriented）」という言葉も、このころ広まりました[^smalltalk-kay]。
Java は、こうした先輩言語が育てた考え方を受け継いで、1995年に登場しました。あなたがいま書いている `class` という一語の背景には、半世紀をこえる歴史があるのです。

</Column>

---

## クラスを書く形

クラスは、次の形で書きます。

```java
public class クラスの名前 {
    （ここに、プログラムの中身を書く）
}
```

ここに登場する言葉を、一つずつ見ていきましょう。

| 部分 | 読み | 役割 |
|---|---|---|
| `public` | パブリック | 「どこからでも使える（公開）」という印。くわしくは第12章 |
| `class` | クラス | 「ここからクラスを定義しますよ」という合図のキーワード |
| `Main` | ― | このクラスの**名前**。自分で決められる |
| `{ }` | 波かっこ | クラスの中身を囲むまとまり |

注目してほしいのは、**`class` というキーワードのうしろに、クラスの名前を書く**という点です。
今回は `Main`（メイン）という名前がついていますが、これは自分で自由に決められる部分です。

たとえば、次のように別の名前をつけても、クラスとしては成り立ちます。

```java
public class Hello {
    …
}
```

一方で、`public` ・ `class` ・ `{ }` は、形が決まっている部分です。
「**変えてよい部分（名前）**」と「**決まった形の部分**」を区別しておくと、コードが読みやすくなります。

> **補足: `public` がない書き方もある**
>
> クラスには `public` を付けない書き方もあり、その場合の意味の違いは第12章「カプセル化とアクセス修飾子」で学びます。
> ただし、次に説明する「ファイル名のルール」と関わるため、本書では当面、`public class` の形で統一して説明します。

---

## クラス名のつけ方 ―― 慣習を守る

クラスの名前は自由に決められますが、Java の世界には、**広く守られている慣習**（ならわし）があります。
最初から身につけておくと、あとで読みやすいコードが書けるようになります。

- **最初の文字を大文字にする**（例: `Main`、`Hello`、`Calculator`）
- **複数の単語をつなげるときは、各単語の先頭を大文字にする**（例: `HelloWorld`、`UserProfile`）
- **半角の英数字を使う**（日本語やスペースは使わない）

このように、単語の先頭をすべて大文字にしてつなげる書き方を、**パスカルケース**（Pascal Case）、または**アッパーキャメルケース**（Upper Camel Case）と呼びます[^java-naming-convention]。

```text
○  Main / HelloWorld / UserProfile
×  main / helloworld / hello_world / こんにちは
```

これは「文法上のルール」ではなく「慣習」です。
小文字で始めてもプログラムは動きますが、Java を書く人たちのあいだでは、クラス名は大文字で始めるのがあたりまえになっています。
ほかの人のコードを読むときにも役立つので、ぜひこの形に慣れておきましょう。

---

## クラス名とファイル名をそろえる

ここで、第2章のコマンドラインの節でも少し触れた、大切なルールを確認します。

> `public` を付けたクラスは、**クラス名とファイル名を、まったく同じにしなければならない**[^jls-7-6]

つまり、`public class Main` と書いたなら、そのプログラムを保存するファイルは、必ず **`Main.java`** という名前にする必要があります。

| クラスの宣言 | 正しいファイル名 |
|---|---|
| `public class Main` | `Main.java` |
| `public class Hello` | `Hello.java` |
| `public class Calculator` | `Calculator.java` |

ここで注意したいのが、**大文字・小文字も区別される**という点です。
`Main.java` と `main.java` は、Java にとっては別の名前です。

```text
○  public class Main   →  Main.java
×  public class Main   →  main.java
×  public class Main   →  Hello.java
```

もし、この対応がずれていると、コンパイルのときにエラーになります。
（具体的なエラーメッセージは、第7節「エラーと向き合う」で取り上げます。）

> **なぜ、そろえる必要があるのか**
>
> Java では、`public` なクラスを「プログラムを探すときの目印」として使います。
> 「`Main` という名前のクラスは、`Main.java` というファイルに入っている」と決めておけば、コンパイラやほかのプログラムが、目的のクラスを名前から探し出せます。
> 書類フォルダに、中身と同じ見出しを付けておくと、あとから探しやすいのと同じ ―― 名前をそろえておくための、シンプルな整理のルールです。

---

## いまは「1つのクラス」だけ

本格的な Java のプログラムでは、たくさんのクラスを作り、それらを組み合わせて大きなソフトウェアを作っていきます。

ですが、本書の第1部では、当面「**1つのファイルに、1つのクラス**」という、いちばんシンプルな形だけを扱います。
クラスを複数作って連携させる方法や、クラスの本当の力は、第2部（第11章以降）でたっぷり学びます。

いまは、

- Java のプログラムは、**クラスというまとまりの中に書く**
- クラスには名前をつける（`Main` など）
- `public` を付けたクラスは、**名前とファイル名をそろえる**

この3点を押さえておけば十分です。

---

## まとめ

この節では、すべての命令を書く、いちばん外側のまとまりである「クラス」について学びました。

- `public class Main { … }` の部分を**クラス**と呼び、Java では**命令はすべてクラスの中に書く**
- クラスは `public class 名前 { … }` の形で書く。`public`・`class`・`{ }` は決まった形、名前は自分で決める
- クラス名は、**大文字で始める**のが慣習（パスカルケース）。半角英数字を使う
- `public` を付けたクラスは、**クラス名とファイル名を同じにする**（`public class Main` → `Main.java`）。大文字・小文字も区別される
- 本書の第1部では、当面「1ファイルに1クラス」のシンプルな形だけを扱う
- クラスの本当の役割（オブジェクトを作る**設計図**）は、第11章で学ぶ

クラスの正体がわかったところで、次の節では、そのクラスの中にある「プログラムの入口」＝ **main メソッド**を読み解いていきます。

[^simula-67]: Ole-Johan Dahl and Kristen Nygaard, "Simula — An ALGOL-Based Simulation Language," *Communications of the ACM*, Vol. 9, No. 9, 1966。Simula 67 はノルウェー計算センター（NCC, オスロ）で開発され、クラス・オブジェクト・継承の概念を初めて言語機能として導入した。Dahl と Nygaard は2001年に ACM Turing Award を受賞している（<https://amturing.acm.org/award_winners/dahl_4659460.cfm>）。

[^smalltalk-kay]: Alan C. Kay, "The Early History of Smalltalk," *ACM SIGPLAN Notices*, Vol. 28, No. 3, 1993, <https://dl.acm.org/doi/10.1145/155360.155364>。Alan Kay は Xerox PARC で1970年代に Smalltalk を開発し、「object-oriented」という用語を広めた当事者として知られる。

[^jls-7-6]: *The Java® Language Specification, Java SE 25 Edition*, §7.6 "Top Level Type Declarations," <https://docs.oracle.com/javase/specs/jls/se25/html/jls-7.html#jls-7.6>。"If the optionally-qualified type name `T` is declared in a public top level type declaration in a compilation unit named `T.java`, then the implementation may report a compile-time error" と規定されている。

[^java-naming-convention]: Oracle, "Code Conventions for the Java Programming Language: Naming Conventions," <https://www.oracle.com/java/technologies/javase/codeconventions-namingconventions.html>。"Class names should be nouns, in mixed case with the first letter of each internal word capitalized." と公式に推奨されている。

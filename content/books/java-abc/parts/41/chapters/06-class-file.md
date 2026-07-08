---
title: クラスファイルの構造 ― マジックナンバと定数プール
llm: true
co-author: ["Claude Opus 4.7"]
---

## クラスファイルの構造 ― マジックナンバと定数プール

`.class` ファイルは、人間が読めない**バイナリファイル**です。
中身は **JVM 仕様**（Java Virtual Machine Specification）で**バイト並びまで**厳密に決まっています。
この節では、その先頭部分と、よく登場する**定数プール**を覗いてみます。

---

## 「`CAFEBABE`」 ―― マジックナンバ

`.class` の**先頭 4 バイト**は、必ず `0xCAFEBABE` と決まっています。
これを**マジックナンバ**（magic number）と呼びます。
ファイル形式を見分けるための「印」です。

実機で見てみましょう。

```text line-numbers=false
$ head -c 16 Hello.class | od -An -tx1 -w16
 ca fe ba be 00 00 00 45 00 2e 0a 00 02 00 03 07
```

最初の 4 バイト `ca fe ba be`、その次の 4 バイトが**クラスファイルのバージョン**です。

| バイト位置 | 内容 |
|---|---|
| 0〜3 | マジックナンバ `0xCAFEBABE` |
| 4〜5 | minor version（補助バージョン） |
| 6〜7 | **major version**（メジャーバージョン） |

上の例の `00 00 00 45` を読むと、

- minor: `0x0000` = 0
- major: `0x0045` = **69**

major version **69** は、**Java 25** で生成されたクラスファイルであることを示します。

Java バージョンとクラスファイルバージョンの対応は、おおむね次のとおりです。

| Java バージョン | major version |
|---|---|
| Java 8 | 52 |
| Java 11 | 55 |
| Java 17 | 61 |
| Java 21 | 65 |
| Java 25 | **69** |

(Java 1 が 45 から始まり、以降 1 ずつ増えています)

実行時に `UnsupportedClassVersionError` が出るのは、ここのバージョンが**実行中の JVM より新しい**ためです。
Java 17 で動かしているのに、Java 21 でビルドした `.class` を読もうとした、というケースが典型例です。

---

## クラスファイル全体の構造

JVM 仕様で定められたクラスファイルの構造は、おおまかにこうなっています。

```text line-numbers=false
ClassFile {
    u4             magic;              // 0xCAFEBABE
    u2             minor_version;
    u2             major_version;
    u2             constant_pool_count;
    cp_info        constant_pool[constant_pool_count-1];   // 定数プール
    u2             access_flags;        // ACC_PUBLIC など
    u2             this_class;
    u2             super_class;
    u2             interfaces_count;
    u2             interfaces[interfaces_count];
    u2             fields_count;
    field_info     fields[fields_count];
    u2             methods_count;
    method_info    methods[methods_count];
    u2             attributes_count;
    attribute_info attributes[attributes_count];
}
```

ぱっと見、たくさんあって戸惑いますが、ざっくり**4 つのブロック**に整理できます。

| ブロック | 何が入っているか |
|---|---|
| **ヘッダ** | マジックナンバ、バージョン |
| **定数プール** | このクラスで使う文字列・クラス名・メソッド参照などをまとめた表 |
| **クラス情報** | 自分自身のクラス名、親クラス、実装インタフェース、アクセス修飾子 |
| **メンバ情報** | フィールド・メソッド・属性（バイトコードはここ） |

そして、メンバ情報の中の**各メソッドの本体**として、第3節で見たバイトコードが入っています。

---

## 定数プールを覗く

クラスファイルの大半を占めるのが、**定数プール**（constant pool）です。
これは、そのクラスで使う**文字列・型名・メソッド参照**などを 1 つの表にまとめたものです。

`javap -v` で表示すると、たとえば `Hello.class` ではこうなります。

```text line-numbers=false
Constant pool:
   #1 = Methodref          #2.#3   // java/lang/Object."<init>":()V
   #2 = Class              #4      // java/lang/Object
   #3 = NameAndType        #5:#6   // "<init>":()V
   #4 = Utf8               java/lang/Object
   #5 = Utf8               <init>
   #6 = Utf8               ()V
   #7 = Fieldref           #8.#9   // java/lang/System.out:Ljava/io/PrintStream;
   #8 = Class              #10     // java/lang/System
   #9 = NameAndType        #11:#12 // out:Ljava/io/PrintStream;
  #10 = Utf8               java/lang/System
  ...
```

注目してほしいのは、**項目どうしが番号で参照し合っている**ことです。

- `#1 Methodref` は、「クラス `#2` の `#3`」を指す
- `#2 Class` は、「`#4` の文字列が名前」のクラスを指す
- `#4 Utf8` が、ようやく文字列実体 `"java/lang/Object"` を持つ

なぜこんな**間接参照**をしているのか?
答えは「**重複を避けるため**」です。`java/lang/Object` という文字列は、クラスファイル中に何度も出てきます。
それを**1 つの Utf8 エントリに集約**することで、クラスファイル全体のサイズを節約しています。

第3節のバイトコードで `getstatic #7` と書いてあったのを思い出してください。
`#7` は **定数プールの 7 番**を指していたのです。
バイトコードは「**動詞**（命令）」と「**目的語**（定数プールへの番号）」のセットで動いている、というわけです。

---

## 型のエンコーディング ― 「`L...;`」と「`[`」

`javap` の出力に出てくる、`Ljava/io/PrintStream;` や `[I` といった独特の表記。
これは JVM 内部での**型の書き方**（フィールドディスクリプタ）です。

| 型 | 表記 |
|---|---|
| `int` | `I` |
| `long` | `J` |
| `double` | `D` |
| `float` | `F` |
| `boolean` | `Z` |
| `byte` | `B` |
| `char` | `C` |
| `short` | `S` |
| `void` | `V` |
| 参照型 `Foo` | `LFoo;` |
| 参照型 `java.lang.String` | `Ljava/lang/String;` |
| 配列 `int[]` | `[I` |
| 配列 `String[]` | `[Ljava/lang/String;` |
| 配列 `int[][]` | `[[I` |

メソッドのシグネチャは、引数を括弧、戻り値を外側に書きます。
たとえば `int sum(int n)` は **`(I)I`**、`void println(String)` は **`(Ljava/lang/String;)V`** です。

「えー、`I` は `Integer` じゃなく `int` なの?」 と覚えにくいですが、**`L` で始まらない 1 文字はプリミティブ**と覚えておくと混乱が減ります。

---

## 「`<init>`」ってなに

定数プールに何度か顔を出す **`<init>`** は、**コンストラクタの正式名**です。
ソースでは `Hello() { ... }` と書きますが、バイトコードレベルでは `<init>` という名前のメソッドに翻訳されます。
理由は単純で、コンストラクタにはふつうの識別子の規則（最初は大文字英字）が当てはまらないクラスもあるため、**ふつうのメソッド名と被らない予約名**として `<init>` を使っているのです。

似たものに **`<clinit>`** があり、こちらは「**クラスの初期化メソッド**」 ―― static イニシャライザと static フィールドの代入をまとめたものです。
第2節で見た「初めて使われたときに走る `<clinit>`」が、この名前で定数プールに登場します。

---

## アクセスフラグ ―― クラスや要素の修飾子

`javap -v` の冒頭にある `flags: (0x0021) ACC_PUBLIC, ACC_SUPER` ―― このビットの組み合わせが、**アクセスフラグ**です。

| フラグ | 意味 |
|---|---|
| `ACC_PUBLIC` | public |
| `ACC_FINAL` | final |
| `ACC_SUPER` | invokespecial の挙動指定（Java 1.0.2 以降は常に立つ） |
| `ACC_INTERFACE` | これは interface |
| `ACC_ABSTRACT` | abstract |
| `ACC_SYNTHETIC` | コンパイラが生成した（ソースにはない） |
| `ACC_ENUM` | enum |
| `ACC_RECORD` | record |

ソースの修飾子は、ここで**ビット**に変換されています。
逆に言うと、`ACC_SYNTHETIC` のように**ソースにはない情報**もここで分かるので、ライブラリやリフレクション（第46章）の挙動を追うとき、`javap -v` の flags は手がかりになります。

---

## クラスファイル API ―― Java から `.class` を組み立てる

Java 24 で**正式リリース**された **Class-File API**（`java.lang.classfile.*`）を使うと、`.class` の中身を **Java コードから**読み書きできます。
これまでは ASM のような外部ライブラリが必要だったところを、標準 API で書けるようになりました。

```java
import java.lang.classfile.ClassFile;
import java.nio.file.Path;

var bytes = java.nio.file.Files.readAllBytes(Path.of("Hello.class"));
var model = ClassFile.of().parse(bytes);
System.out.println("major version = " + model.majorVersion());
System.out.println("methods = " + model.methods().size());
```

本書では深掘りしませんが、フレームワーク作者やバイトコード操作ツールの作者にとっては、頼もしい標準 API が手に入った、と覚えておいてください。

---

## まとめると

- `.class` の先頭は **`CAFEBABE`** で始まり、続いてバージョンが書かれる
- major version は **Java 25 = 69**（以降 1 つずつ増える）
- クラスファイルは「**ヘッダ・定数プール・クラス情報・メンバ情報**」の4ブロック
- 定数プールは **番号で互いに参照**して、サイズを節約している
- 型は `I` `J` `D` `[I` `Ljava/lang/String;` のように**1 文字＋特殊記号**でエンコードされる
- `<init>` がコンストラクタ、`<clinit>` がクラス初期化

次の節は、ここまでで触れきれなかった**よくあるつまずき**を整理します。

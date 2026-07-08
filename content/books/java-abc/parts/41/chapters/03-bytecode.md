---
title: バイトコード ― javap で覗く中間言語
llm: true
co-author: ["Claude Opus 4.7"]
---

## バイトコード ― `javap` で覗く中間言語

クラスローダが読み込む `.class` ファイルの中身は、**バイトコード**（bytecode）と呼ばれる中間言語です。
人間が直接書くものではありませんが、**読めると JVM の動きが手応えとして理解できる**ようになります。
この節は「**読める必要はないが、読み方を知っておく**」をゴールにします。

---

## バイトコードとは何か

バイトコードは、JVM 専用の**仮想的な機械語**です。
特徴を3つ挙げます。

| 特徴 | 意味するところ |
|---|---|
| **1命令 = 1バイト**（プラス引数） | コードサイズが小さい。`iadd` は `0x60` の 1 バイト |
| **スタックマシン** | 計算はレジスタではなく、オペランドスタックで行う |
| **型を区別する** | `iadd`（int 加算）と `dadd`（double 加算）は別命令 |

物理 CPU（x86）が**レジスタマシン**であるのに対し、JVM は**スタックマシン**です。
「計算する値をスタックに積み、命令はスタックの上から値を取って結果を載せ直す」 ―― この発想だけ覚えれば、バイトコードはかなり読めるようになります。

---

## まずは見てみる

第1節で見た `Hello.main` をもう一度載せます。

```text line-numbers=false
public static void main(java.lang.String[]);
  Code:
       0: iconst_3
       1: istore_1
       2: getstatic     #7    // Field java/lang/System.out:Ljava/io/PrintStream;
       5: iload_1
       6: invokedynamic #13,  0  // InvokeDynamic ...makeConcatWithConstants...
      11: invokevirtual #17   // Method java/io/PrintStream.println:(Ljava/lang/String;)V
      14: return
```

左端の数字（`0:` `1:` `2:` …）は、**メソッド先頭からのバイト位置**です。
`iconst_3` は 1 バイト、`getstatic #7` は引数 2 バイトつきで 3 バイト ―― だから次が `5:` から始まります。

「バイトコード」という呼び名どおり、**1 バイト単位**で命令が並んでいるのが、この番号からも見て取れます。

---

## 4 つの命令カテゴリ

バイトコードは、おおまかに 4 種類に分けて読むと頭に入ります。

### 1. ロード／ストア（ローカル変数とスタックの行き来）

| 命令 | 何をするか |
|---|---|
| `iconst_<n>` | 整数定数 `n`（-1〜5）をスタックに積む |
| `bipush n` / `sipush n` | バイト範囲・ショート範囲の定数を積む |
| `ldc #idx` | 定数プール（第6節）から定数を積む（文字列など） |
| `iload_<n>` / `iload n` | ローカル変数 `n` の int をスタックに積む |
| `istore_<n>` / `istore n` | スタックの top を、ローカル変数 `n` に書き戻す |

`i` は int、`a` は参照型（reference）、`l` は long、`d` は double、`f` は float の頭文字です。
`aload_0` なら「**ローカル変数 0 番（インスタンスメソッドなら `this`）の参照をスタックに**」となります。

### 2. 算術・論理

| 命令 | 何をするか |
|---|---|
| `iadd` / `isub` / `imul` / `idiv` / `irem` | int の四則と剰余 |
| `iinc n, c` | ローカル変数 `n` を、**スタックを通さずに**定数 `c` だけ増やす |

`iinc` は珍しく**スタックを使わない**命令で、`for (int i = ...; i++)` がここに対応します。

### 3. 制御フロー

| 命令 | 何をするか |
|---|---|
| `goto offset` | 無条件ジャンプ |
| `if_icmpgt offset` | スタックの上2つを int 比較し、`>` なら `offset` へジャンプ |
| `ifne offset` | 上の値が `0` でなければジャンプ |
| `tableswitch` / `lookupswitch` | switch の本体 |
| `return` / `ireturn` / `areturn` | メソッドからの戻り |

### 4. メソッド呼び出し・オブジェクト操作

| 命令 | 何をするか |
|---|---|
| `invokespecial` | コンストラクタ、`super.xxx()`、private メソッド |
| `invokevirtual` | インスタンスメソッド（動的束縛） |
| `invokestatic` | static メソッド |
| `invokeinterface` | インターフェース経由のメソッド |
| `invokedynamic` | ラムダ・文字列連結・switch パターンなど |
| `new` | オブジェクト生成（メモリだけ確保。コンストラクタは別途 `invokespecial`） |
| `getstatic` / `putstatic` | static フィールドの読み／書き |
| `getfield` / `putfield` | インスタンスフィールドの読み／書き |

---

## ループを読み解く

簡単なループを `javap` してみます。

```java
public static int sum(int n) {
    int s = 0;
    for (int i = 1; i <= n; i++) {
        s += i;
    }
    return s;
}
```

```text line-numbers=false
$ javap -c Loop.class
  public static int sum(int);
    Code:
         0: iconst_0
         1: istore_1
         2: iconst_1
         3: istore_2
         4: iload_2
         5: iload_0
         6: if_icmpgt     19
         9: iload_1
        10: iload_2
        11: iadd
        12: istore_1
        13: iinc          2, 1
        16: goto          4
        19: iload_1
        20: ireturn
```

ローカル変数の割り当ては、

| 番号 | 中身 |
|---|---|
| `0` | 引数 `n`（static メソッドなので 0 番から） |
| `1` | `s` |
| `2` | `i` |

として、行ごとに何をしているかを追ってみます。

| 位置 | 命令 | 意味 |
|---|---|---|
| 0-1 | `iconst_0 / istore_1` | `s = 0` |
| 2-3 | `iconst_1 / istore_2` | `i = 1` |
| 4-6 | `iload_2 / iload_0 / if_icmpgt 19` | `i > n` なら 19 へジャンプ（ループ脱出） |
| 9-11 | `iload_1 / iload_2 / iadd` | `s + i` をスタックに |
| 12 | `istore_1` | それを `s` に書き戻す（`s += i`） |
| 13 | `iinc 2, 1` | `i++` |
| 16 | `goto 4` | ループ先頭へ |
| 19-20 | `iload_1 / ireturn` | `s` を返す |

`for` 文が、「**条件チェック → 本体 → 増分 → ジャンプ**」という素朴な分解になっていることが見えました。
インスタンスメソッドの場合、ローカル変数 0 番は `this`、引数は 1 番から始まります。

---

## バイトコードを読むコツ

実務で `javap` を使う場面は、たとえば

- ライブラリの挙動が思ったのと違う ―― 本当に呼んでいるメソッドはどれか
- 文字列連結や switch が、どの種類の `invokedynamic` に展開されたか
- ラムダが、コンパイル時にどう翻訳されたか

を確かめたいときです。
読み解く際のコツは 3 つあります。

1. **「I/O はメソッド呼び出し**」と割り切る ―― `getstatic`（`System.out` を積む）→ 引数を積む → `invokevirtual println` の3点セット
2. **`a` で始まる命令は参照型** ―― `aload_0` はだいたい `this`、`areturn` は参照を返す
3. **ジャンプ先のバイト位置を、左端の番号と照合する** ―― ループの「先頭」と「脱出」が見える

`javap -p`（private も）、`javap -v`（定数プールも）、`javap -l`（行番号も）、`javap -c`（バイトコードも）と、用途に応じてフラグを足します。

---

## バイトコードは「言語」ではない

ここまでで気づくと思いますが、バイトコードは**ある特定の Java バージョン**の構文に縛られた言語**ではありません**。
ラムダも、レコードも、シールも、結局は**既存のバイトコード命令**で実現されています。
ラムダの実体が `invokedynamic` だったり、文字列連結が `invokedynamic` だったりするのは、JVM 側を変えずに**新機能を載せていく**ためです。

逆に言うと、Kotlin・Scala・Groovy・Clojure ―― すべて同じバイトコードに落ちるからこそ、**JVM 上で共存**できます。
バイトコードは、Java 専用ではなく、**JVM の共通通貨**なのです。

---

## まとめると

- バイトコードは、JVM 専用の**スタックマシン**用命令体系
- 命令は **1 バイト**から始まり、`i` / `a` / `l` / `d` / `f` で型を区別する
- 主要カテゴリは「**ロード／ストア・算術・制御フロー・呼び出し**」の4つ
- `javap -c` で**読める範囲**で読み、`javap -v` で定数プールまで掘る
- バイトコードは**Java 専用ではなく**、JVM 上の共通言語

次の節では、このバイトコードを実行するときに使う、**ランタイムデータ領域**（ヒープ・スタック・メソッド領域）を見ていきます。

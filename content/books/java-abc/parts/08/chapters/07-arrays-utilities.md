---
title: 配列の便利な道具（Arrays）
llm: true
co-author: ["Claude Opus 4.7"]
---

## 配列の便利な道具（Arrays）

配列を扱っていると、「中身をまとめて表示したい」「並べ替えたい」といった、定番の処理が出てきます。
これらを、自分で繰り返しを書かなくても済むように、Java は **`Arrays`**（アレイズ）という便利な道具をあらかじめ用意しています[^java-arrays-class]。

`Arrays` は `java.util` というパッケージにあります。
ファイルに書くときは、先頭で **`import java.util.Arrays;`** が必要です（jshell では、すでに使える状態になっているので import は不要です）。

> パッケージや import については、第11章以降でくわしく学びます。ここでは「便利な道具を使うために、`import java.util.Arrays;` という1行が要ることがある」とだけ知っておけば十分です。

---

## 配列の中身を表示する ― Arrays.toString

実は、配列をそのまま `IO.println` に渡しても、中身は表示されません。

```java
int[] nums = {10, 20, 30};
IO.println(nums);
```

```text line-numbers=false
[I@1db9742
```

`[I@1db9742` のような、意味のわからない文字列が出てしまいました（この値は環境ごとに変わります）。
これは配列の中身ではなく、「配列がメモリ上のどこにあるか」を表す内部的な情報です。

中身を確認したいときは、**`Arrays.toString(配列)`** を使います。

```java
int[] nums = {10, 20, 30};
IO.println(Arrays.toString(nums));
```

```text line-numbers=false
[10, 20, 30]
```

`[10, 20, 30]` と、要素が読める形になりました。
デバッグ（プログラムの確認）で「配列の中身を見たい」ときに、とてもよく使います。

---

## 配列を並べ替える ― Arrays.sort

**`Arrays.sort(配列)`** を使うと、配列を**小さい順（昇順）に並べ替え**られます。

```java
int[] data = {3, 1, 4, 1, 5};
Arrays.sort(data);
```

並べ替えた結果を確認してみましょう。

```text line-numbers=false
jshell> Arrays.toString(data)
$3 ==> "[1, 1, 3, 4, 5]"
```

バラバラだった要素が、小さい順に並びました。

ここで大事なのは、`Arrays.sort(data)` は**元の配列 `data` そのものを並べ替える**という点です。
新しい配列を返すのではなく、渡した配列の中身が直接変わります。並べ替え前の状態は残らないので、注意しましょう。

---

## コマンドライン引数 ― String[] args

最後に、配列が登場するもう1つの場面を紹介します。
第3章で書いた `main` メソッドは、実は配列を受け取れます。

```java
void main(String[] args) {
    IO.println("引数の数: " + args.length);
    for (String a : args) {
        IO.println(a);
    }
}
```

この `String[] args` は、**コマンドライン引数**（プログラムを起動するときに、外から渡す文字列）を受け取るための配列です。
たとえば、このプログラムを `Args.java` という名前で保存し、次のように実行すると、

```text line-numbers=false
$ java Args.java りんご みかん ぶどう
引数の数: 3
りんご
みかん
ぶどう
```

`りんご`・`みかん`・`ぶどう` の3つが、`args` という `String` の配列に入って渡されているのがわかります。
`args` も、ふつうの配列なので、`args.length` で個数を調べたり、for-each でたどったりできます。

> コマンドライン引数は jshell では試せません（外から引数を渡すしくみがないため）。ファイルに保存して `java Args.java 〜` の形で実行して試してください。

---

## まとめ

- **`Arrays`** は配列を便利に扱う道具。ファイルで使うときは `import java.util.Arrays;` が必要（jshell は不要）
- **`Arrays.toString(配列)`** で中身を `[10, 20, 30]` の形で表示できる（配列を直接 println すると中身は出ない）
- **`Arrays.sort(配列)`** で小さい順に並べ替えられる（**元の配列が直接変わる**）
- `main(String[] args)` の `args` は、**コマンドライン引数**を受け取る配列

次の節では、配列でつまずきやすいポイントを、まとめて確認します。

[^java-arrays-class]: Java SE 25 API Specification, `java.util.Arrays`, [https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Arrays.html](<https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Arrays.html>)。配列の表示（`toString`）、ソート（`sort`、Dual-Pivot Quicksort）、検索（`binarySearch`）、コピー（`copyOf`）、`Stream` 変換（`stream`）など多数のユーティリティを提供する。

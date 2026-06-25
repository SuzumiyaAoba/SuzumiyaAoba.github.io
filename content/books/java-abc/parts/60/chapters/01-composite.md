---
title: Composite パターン
llm: true
co-author: ["Claude Opus 4.7"]
---

## Composite パターン

**Composite**（複合体）パターンは、**「単独の要素（葉）」と「複数の要素を内包する複合体（節）」を、共通のインターフェースで扱える**ようにするパターンです。

呼び出し側からは、葉（leaf）と節（composite）の区別なく、**同じ操作で再帰的に**処理できます。

---

## 解きたい問題

ファイルシステムを例にします。

- **ファイル**は単独。サイズを持つ
- **ディレクトリ**は、中にファイルやディレクトリを持つ。サイズはその合計

「ディレクトリ全体のサイズを求める」のに、毎回 `if (file) ... else if (dir) ...` を書きたくありません。
**「ファイルとディレクトリを、同じ顔で扱える」**ようにしたい。これが Composite の動機です。

---

## 構造と登場人物

```text
Node（共通インターフェース）
  ├ size(): long
  ├ Leaf（葉）            ―― ファイル
  └ Composite（節）        ―― ディレクトリ
       内部に Node のリストを持つ
```

呼び出し側は、`Node` 型として扱うだけ。
**内部の構造を意識せずに、再帰的な操作**ができるようになります。

---

## 実装例 ― ファイルとディレクトリ

```java
public interface Node {
    long size();
}

public class FileLeaf implements Node {
    private final String name;
    private final long sizeBytes;
    public FileLeaf(String name, long sizeBytes) {
        this.name = name;
        this.sizeBytes = sizeBytes;
    }
    @Override public long size() { return sizeBytes; }
}

public class DirectoryComposite implements Node {
    private final String name;
    private final List<Node> children = new ArrayList<>();

    public DirectoryComposite(String name) { this.name = name; }
    public void add(Node child) { children.add(child); }

    @Override
    public long size() {
        long total = 0;
        for (Node c : children) {
            total += c.size();     // 葉も節も同じ size() で呼べる
        }
        return total;
    }
}
```

呼び出し:

```java
DirectoryComposite root = new DirectoryComposite("/");
DirectoryComposite home = new DirectoryComposite("home");
home.add(new FileLeaf("note.txt", 1000));
home.add(new FileLeaf("photo.jpg", 50_000));
root.add(home);
root.add(new FileLeaf("README", 200));

System.out.println(root.size());   // 51200
```

`size()` の中で、**自身の子を再帰的に**呼ぶ ―― これが Composite のキモです。

---

## シールドクラスで安全に表す

第27章で学んだ **シールドクラス** + **レコード**を使うと、Composite の構造を**型レベルで閉じた**形で書けます。

```java
public sealed interface Node permits FileLeaf, DirectoryComposite {
    long size();
}

public record FileLeaf(String name, long sizeBytes) implements Node {
    @Override public long size() { return sizeBytes; }
}

public record DirectoryComposite(String name, List<Node> children) implements Node {
    @Override
    public long size() {
        return children.stream().mapToLong(Node::size).sum();
    }
}
```

これで、`Node` の派生は **`FileLeaf` と `DirectoryComposite` の 2 種類だけ**であることが、コンパイラに保証されます。
**パターンマッチング**で網羅も書きやすくなります。

```java
String describe(Node node) {
    return switch (node) {
        case FileLeaf(var name, var size) -> name + ": " + size + " bytes";
        case DirectoryComposite(var name, var children) ->
            name + "/ (" + children.size() + " items)";
    };
}
```

---

## 使いどころと注意点

向く場面:

- **木構造**を表したい（ファイルシステム、組織図、UI 部品の階層）
- 全体と部分を**一様な操作**で扱いたい

注意点:

- **「葉だけ持つメソッド」「節だけ持つメソッド」**を共通インターフェースに入れると、無理が出る
  （例: `Node` に `add(Node)` を入れてしまう ―― 葉では呼べないので例外を投げる羽目になる）
- 解決策の 1 つは「**子を持てるかどうか**」を**型で分ける**こと（上のシールドクラスの例）

---

## まとめ

- **Composite** は、葉と節を**同じインターフェースで扱う**構造パターン
- 木構造をきれいに表現でき、**再帰的な処理**が自然に書ける
- シールドクラス + レコード + パターンマッチングで、現代的に安全に書ける
- 「葉だけ／節だけのメソッド」をひとつのインターフェースに混ぜないこと

次の章では、**Bridge** ―― 抽象と実装を**橋で結ぶ**パターンを見ます。

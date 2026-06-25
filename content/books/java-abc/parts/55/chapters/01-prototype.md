---
title: Prototype パターン
llm: true
co-author: ["Claude Opus 4.7"]
---

## Prototype パターン

**Prototype**（原型）パターンは、**「既存のインスタンスをコピーして、新しいインスタンスを作る」**生成パターンです。

`new` で 0 からつくると重い・組み立てが複雑なオブジェクトを、**原型（プロトタイプ）からの複製で済ます**ことが目的です。

---

## 解きたい問題

たとえば、「キャラクターの初期データ」を作るのに、多数の項目をデフォルト値で埋める必要があるとします。

```java
Character base = new Character();
base.setLevel(1);
base.setHp(100);
base.setMp(50);
base.setName("Hero");
// ...30 個続く...
```

「**この初期状態をベースに、少しだけ変えたものを 100 体作りたい**」 ―― 毎回これを全部書くのは大変です。

**1 つの完成品を、複製して使う**――これが Prototype の発想です。

```java
Character c1 = base.copy();
c1.setName("Hero A");
Character c2 = base.copy();
c2.setLevel(5);
```

---

## 浅いコピーと深いコピー

コピーするとき、**フィールドが参照型（オブジェクト）**だと、ややこしい問題が出ます。

```java
public class Character {
    private String name;
    private List<String> skills;   // 参照型!
}
```

「`Character` を 1 つコピーした」と思っても、`skills` リストは**コピー元と同じインスタンスを共有**してしまうかもしれません（**浅いコピー**, shallow copy）。
コピー後にスキルを足すと、コピー元にも反映されて驚きます。

それに対し、**中の参照型まで含めて、すべて新しく作り直す**のが **深いコピー**（deep copy）です。

| 種類 | コピー先のフィールド | 例 |
|---|---|---|
| 浅いコピー | 元と同じ参照を共有 | `List` が共有される |
| 深いコピー | 中身まで複製 | `List` も新しく作り直す |

Prototype を実装するときは、**「どこまで深く複製するか」**を必ず意識します。

---

## `Cloneable` と `clone()` の問題

Java には、もともと **`Object#clone()`** という仕組みがあります。

```java
public class Character implements Cloneable {
    @Override
    public Character clone() {
        try {
            return (Character) super.clone();
        } catch (CloneNotSupportedException e) {
            throw new AssertionError(e);
        }
    }
}
```

しかし、`Cloneable` には設計上の問題が多く、**現代の Java では推奨されません**。

- インターフェースなのにメソッドを持たない（マーカー）
- 例外が**チェック例外**で扱いづらい
- デフォルトの `super.clone()` は**浅いコピー**
- 継承階層の途中で **`Cloneable` を実装しないと壊れる**

『Effective Java』（Joshua Bloch）も、「**`Cloneable` は使わないこと**」を強く勧めています。

---

## 代替 1 ― コピーコンストラクタ

「**自分と同じ型を引数に取るコンストラクタ**」を用意するのが、現代的な書き方です。

```java
public class Character {
    private String name;
    private List<String> skills;

    public Character(String name, List<String> skills) {
        this.name = name;
        this.skills = new ArrayList<>(skills);   // 深いコピー
    }

    // コピーコンストラクタ
    public Character(Character src) {
        this(src.name, src.skills);
    }
}
```

呼び出し:

```java
Character c1 = new Character(base);   // base をコピー
```

明示的に書けるので、

- どこまで複製するか（深さ）が**コードに現れる**
- 例外を投げる仕組みもいらない
- インターフェースに縛られない

と扱いやすくなります。

---

## 代替 2 ― レコードと `with`

第17章で学んだ **レコード**は、**コピーして一部だけ変える**という用途に向いています。
Java 25 時点では `record` に標準の `with` メソッドはありませんが、自分で定義することで「**ほぼ Prototype**」が表現できます。

```java
public record Character(String name, int level, List<String> skills) {
    public Character withName(String newName) {
        return new Character(newName, level, skills);
    }
    public Character withLevel(int newLevel) {
        return new Character(name, newLevel, skills);
    }
}
```

呼び出し:

```java
Character base = new Character("Hero", 1, List.of("Slash"));
Character c1 = base.withName("Hero A");
Character c2 = base.withLevel(5);
```

不変オブジェクトなので、**コピー元が変化しない**ことが言語レベルで保証されます。

---

## 使いどころと注意点

向く場面:

- 0 から作るのが**重い**（DB アクセス、外部 API、複雑な計算が伴う）
- ベースとなる**完成形があり**、それを少しだけ変えたバリエーションを作りたい
- グラフィックエディタの「**図形の複製**」のような UI 操作

向かない場面:

- 単に `new` で済むもの（無理にコピーにしない）
- 内部に**外部リソース**（ファイルハンドル、DB コネクション）を持つもの

---

## まとめ

- **Prototype** は、原型を**複製して新しいインスタンス**を作るパターン
- **浅いコピー / 深いコピー**の区別が、実装の肝
- Java の `Cloneable` は**避け**、**コピーコンストラクタ**や **`record` の `with` メソッド**で書くのが現代流
- 0 から作るのが重いオブジェクトに向く

これで、第6部の**生成パターン**（第51〜55章）は終わりです。
次の第56章からは、**構造パターン**（オブジェクトの組み合わせ方）に入っていきます。

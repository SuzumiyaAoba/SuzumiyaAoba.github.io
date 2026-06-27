---
title: Builder パターン
llm: true
co-author: ["Claude Opus 4.7"]
---

## Builder パターン

**Builder** パターンは、**多くのパラメータを持つオブジェクト**を、**段階的に・読みやすく**組み立てるためのパターンです。

「コンストラクタの引数列が長くて読めない」「全部の組み合わせを書きたくない」 ―― そんなときに使います。

---

## 解きたい問題: テレスコープコンストラクタ

オプション項目が増えると、コンストラクタを**重ねていく**ことになりがちです[^effective-java-builder]。

```java
public class Pizza {
    public Pizza(int size) { ... }
    public Pizza(int size, String crust) { ... }
    public Pizza(int size, String crust, boolean cheese) { ... }
    public Pizza(int size, String crust, boolean cheese, boolean tomato) { ... }
    // ...どんどん増える
}
```

これを「**テレスコープコンストラクタ**」（伸びる望遠鏡のように増えるコンストラクタ）と呼びます。
読みづらい・間違えやすい・拡張しにくい、と三重苦です。

セッターを使う案もありますが、

- **不変オブジェクト**にできない（後からセッターで変えられる）
- 「**作りかけ**の中途半端な状態」が外から見える

という別の問題を抱えます。

---

## Fluent Builder ― 流れるような API

GoF 流の Builder は、**製品クラスとは別に「ビルダークラス」を用意**して、メソッドチェーンで属性を積み上げ、最後に `build()` で完成品を返します。

```java
public class Pizza {
    private final int size;
    private final String crust;
    private final boolean cheese;
    private final boolean tomato;

    private Pizza(Builder b) {
        this.size = b.size;
        this.crust = b.crust;
        this.cheese = b.cheese;
        this.tomato = b.tomato;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private int size = 20;            // デフォルト値
        private String crust = "REGULAR";
        private boolean cheese = false;
        private boolean tomato = false;

        public Builder size(int v)     { this.size = v;     return this; }
        public Builder crust(String v) { this.crust = v;    return this; }
        public Builder cheese(boolean v){ this.cheese = v;  return this; }
        public Builder tomato(boolean v){ this.tomato = v;  return this; }

        public Pizza build() { return new Pizza(this); }
    }
}
```

呼び出し側は、

```java
Pizza pizza = Pizza.builder()
    .size(30)
    .crust("THIN")
    .cheese(true)
    .build();
```

特徴:

- **欲しい項目だけ**書ける（指定しない項目はデフォルト値）
- **順序を気にしなくていい**（メソッド名で意図が伝わる）
- 完成品は**不変オブジェクト**にできる（`final` フィールド + ビルダー経由）

---

## 必須項目を強制したいとき

「サイズだけは必ず指定してほしい」というとき、ビルダーのコンストラクタに**必須引数**を取らせる、または `build()` 内で検証します。

```java
public static class Builder {
    private final int size;
    public Builder(int size) {     // 必須はコンストラクタで受ける
        if (size <= 0) throw new IllegalArgumentException("size must be > 0");
        this.size = size;
    }
    // ... 任意項目はメソッドで ...
}
```

呼び出し:

```java
Pizza pizza = new Pizza.Builder(30).cheese(true).build();
```

---

## レコードとの使い分け

第17章で学んだ **レコード**（`record`）は、**ただデータを束ねる型**を、最小のコードで作れる機能です。
**項目が少なく・全部必須**なら、レコードで十分です。

```java
public record Point(int x, int y) {}
Point p = new Point(1, 2);
```

逆に、

- **項目が多い**（5 つ以上）
- 多くが**省略可能**で、デフォルト値がある
- 構築に**段階的な手順**がある

ようなときは、Builder が向きます。
レコードと Builder は対立する選択肢ではなく、**「レコード本体に Builder を付ける」**という組み合わせもよくあります。

```java
public record Pizza(int size, String crust, boolean cheese, boolean tomato) {
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        // ... 同上のビルダー ...
        public Pizza build() {
            return new Pizza(size, crust, cheese, tomato);
        }
    }
}
```

---

## Lombok の `@Builder`

実務では、**Lombok**（第47章）の `@Builder` を使うことも多いです[^lombok-builder]。
アノテーション 1 つで、上のような Builder クラスを**自動生成**してくれます。

```java
import lombok.Builder;

@Builder
public class Pizza {
    private int size;
    private String crust;
    private boolean cheese;
    private boolean tomato;
}
```

呼び出し側は、

```java
Pizza pizza = Pizza.builder()
    .size(30).crust("THIN").cheese(true).build();
```

「**Builder を書くのが面倒**」が解消されます。
ただし、ライブラリへの依存が増えるので、プロジェクト次第で導入を判断します。

---

## 使いどころと注意点

向く場面:

- フィールドが **5 つ以上**、または **省略可能なものが多い**
- 不変オブジェクトとして**安全に**構築したい
- DSL ふうの **読みやすい呼び出し**を作りたい（HTTPクライアントの設定など）

向かない場面:

- フィールドが **2 〜 3 個** ―― 普通のコンストラクタや `record` で十分
- **作るときの状態遷移**が複雑 ―― 別途ステートマシンを考えるべき

---

## まとめ

- **Builder** は、**多くのパラメータ**を持つオブジェクトを段階的に組むパターン
- テレスコープコンストラクタ・セッター乱用の代わりに、**Fluent な API** を提供する
- **レコード**で済むなら、まずレコード。**Lombok の `@Builder`** も有力
- 「**読みやすさのため**」がいちばんの目的

次の章では、生成パターンの最後 ―― **Prototype**（コピーで作る）を見ます。

[^effective-java-builder]: Joshua Bloch, *Effective Java*, 3rd Edition, Item 2 "Consider a builder when faced with many constructor parameters"。テレスコープコンストラクタや JavaBeans パターン（セッター方式）の問題点と、Builder パターンによる解決が論じられている。

[^lombok-builder]: Project Lombok, "@Builder," <https://projectlombok.org/features/Builder>。アノテーションプロセッサで Builder クラスを自動生成する Lombok の機能。`@Builder.Default` でデフォルト値を指定できる。

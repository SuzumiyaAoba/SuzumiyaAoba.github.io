---
title: Strategy パターン
llm: true
co-author: ["Claude Opus 4.7"]
---

## Strategy パターン

**Strategy**（戦略）パターンは、**アルゴリズムを「取り替え可能な部品」として外に出し、切り替えられるようにする**振る舞いパターンです。

「**何をするか**」は決めず、「**どうやるか**」は部品ごとに変える ―― これが Strategy の発想です。

---

## 解きたい問題

たとえば、リストを並べ替えるサービス。比較方法が**いろいろある**とします。

- 名前順
- 値段順
- 日付順
- 人気順

これを if-else で書くと、

```java
if (mode.equals("NAME")) { ... }
else if (mode.equals("PRICE")) { ... }
else if (mode.equals("DATE")) { ... }
else if (mode.equals("POPULAR")) { ... }
```

並べ替え方が増えるたびに、**1 つのメソッドの中身が肥える**。
**「並べ方」**という**アルゴリズム**を、**取り替え可能な部品**として外に出すのが Strategy です。

---

## 古典的な書き方

共通インターフェース:

```java
public interface SortStrategy<T> {
    List<T> sort(List<T> items);
}
```

具体的な戦略:

```java
public class NameSort implements SortStrategy<Product> {
    @Override
    public List<Product> sort(List<Product> items) {
        return items.stream()
            .sorted(Comparator.comparing(Product::name))
            .toList();
    }
}

public class PriceSort implements SortStrategy<Product> {
    @Override
    public List<Product> sort(List<Product> items) {
        return items.stream()
            .sorted(Comparator.comparingInt(Product::price))
            .toList();
    }
}
```

クライアント:

```java
public class ProductService {
    private final SortStrategy<Product> strategy;

    public ProductService(SortStrategy<Product> strategy) {
        this.strategy = strategy;
    }

    public List<Product> getProducts() {
        return strategy.sort(loadProducts());
    }
}
```

呼び出し:

```java
new ProductService(new PriceSort()).getProducts();
new ProductService(new NameSort()).getProducts();
```

`ProductService` は、「並べ方」を**知らない**まま動きます。

---

## ラムダで書く現代的な Strategy

メソッドが 1 つしかないインターフェースなら、**ラムダ式**で済みます。
さらに、Java 標準の `Comparator<T>` がそのまま Strategy として機能します。

```java
public class ProductService {
    private final Comparator<Product> sort;

    public ProductService(Comparator<Product> sort) {
        this.sort = sort;
    }

    public List<Product> getProducts() {
        return loadProducts().stream().sorted(sort).toList();
    }
}
```

呼び出し:

```java
new ProductService(Comparator.comparing(Product::name)).getProducts();
new ProductService(Comparator.comparingInt(Product::price)).getProducts();
new ProductService(Comparator.comparing(Product::date).reversed())
    .getProducts();
```

「並べ方」を、**1 行で**渡せます。
**標準の関数型インターフェース**（`Comparator`, `Function`, `Predicate`…）で表せるなら、専用の `interface` は作らなくて構いません。

---

## State パターンとの違い

「**実装を差し替える**」という点で、Strategy は **State パターン**（第68章）に似ています。
違いは「**誰が・いつ差し替えるか**」です。

| 観点 | Strategy | State |
|---|---|---|
| 差し替えるのは | **呼び出し側** | **オブジェクト自身**（内部の状態） |
| 動機 | アルゴリズムの選択肢を切り替えたい | 状態によって振る舞いを変えたい |
| 関心 | **何をするか**（アルゴリズム） | **今どの状態にあるか**（モード） |

Strategy は「**外部から渡す**」、State は「**自分で抱えて変わる**」と覚えるとよいでしょう。

---

## 使いどころと注意点

向く場面:

- 同じ目的のために、**複数のアルゴリズム**を切り替えたい
- 拡張のために、**呼び出し側からアルゴリズムを注入**したい
- `if-else` チェーンが、**振る舞いの分岐**そのものになっている

注意点:

- 戦略が **2 〜 3 個**で増えない見込みなら、Strategy にしないほうが軽い
- ラムダで済むものに**わざわざクラスを 3 つ作らない**

---

## まとめ

- **Strategy** は、**取り替え可能なアルゴリズム**を外に出す振る舞いパターン
- 現代の Java では、ラムダ・関数型インターフェースで軽く書ける
- `Comparator` のような標準型が、そのまま Strategy として使える
- **State パターン**との違い: 外から渡すか、内側で持つか

次の章では、**Template Method** ―― 流れの骨組みを親に置く振る舞いパターンを見ます。

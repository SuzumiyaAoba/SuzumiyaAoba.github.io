---
title: Factory Method パターン
llm: true
co-author: ["Claude Opus 4.7"]
---

## Factory Method パターン

**Factory Method**（ファクトリメソッド）パターンは、**「インスタンスをどう作るか」をメソッドの形で外に出し、サブクラスや実装側に決めさせる**パターンです。

「`new` を、呼ぶ側に直接書かせない」――これが Factory Method の基本姿勢です。

---

## 解きたい問題

たとえば、運送業者ごとに「配送伝票」を作るコードを考えます。

```java
public class ShippingService {
    public Label createLabel(String carrier, Order order) {
        if (carrier.equals("YAMATO")) {
            return new YamatoLabel(order);
        } else if (carrier.equals("SAGAWA")) {
            return new SagawaLabel(order);
        }
        return new DefaultLabel(order);
    }
}
```

業者が増えるたびに、

- `if-else` が**さらに長くなる**
- `ShippingService` が**全業者を知る神クラス化**する
- 業者ごとのテストが**書きにくい**

この、「**生成の責任を 1 か所が全部背負っている**」状態を解きほぐすのが、Factory Method です。

---

## Factory Method の考え方

GoF の定義に近い形は、**抽象クラスとサブクラス**の組み合わせです。

```text
Creator（抽象クラス）
  ├ createProduct()  ← 抽象メソッド = Factory Method
  └ use()            ← 共通の流れ。中で createProduct() を呼ぶ
       ↑
  YamatoCreator         createProduct() → new YamatoLabel(...)
  SagawaCreator         createProduct() → new SagawaLabel(...)
```

**「製品（Product）を作る抽象メソッド」**を親が宣言し、**実際にどの製品を作るか**は子が決めます。

```java
public abstract class ShippingService {
    public final void ship(Order order) {        // 共通の流れ
        Label label = createLabel(order);        // ← Factory Method
        sendToWarehouse(label);
    }

    protected abstract Label createLabel(Order order);  // 子が実装する

    private void sendToWarehouse(Label label) { /* ... */ }
}

public class YamatoShippingService extends ShippingService {
    @Override
    protected Label createLabel(Order order) {
        return new YamatoLabel(order);
    }
}
```

呼び出し側は、

```java
ShippingService service = new YamatoShippingService();
service.ship(order);
```

`ship` の中身は親が定義しているので、**共通の流れは 1 か所**にまとまります。一方、伝票の具体クラスは**子が決めます**。

---

## `static` ファクトリメソッドとの違い

Java の標準ライブラリでよく見る `List.of(...)` や `Integer.valueOf(...)` は、「**`static` ファクトリメソッド**」と呼ばれます。

```java
List<Integer> nums = List.of(1, 2, 3);        // インスタンス生成
Integer n = Integer.valueOf(42);              // 内部でキャッシュを使うかも
```

これは GoF の Factory Method **そのもの**ではありません。
GoF の Factory Method は「**サブクラスに任せる**」ことが本質。
一方、`static` ファクトリメソッドは「**`new` の代わりに、名前付きの生成メソッドを使う**」ことに重点があります。

| 観点 | GoF Factory Method | `static` ファクトリメソッド |
|---|---|---|
| 主体 | サブクラス | 自身（`static`） |
| 目的 | 生成する型をサブクラスに委ねる | 生成手段を `new` ではなく名前で表す |
| 例 | `ShippingService#createLabel` | `List.of`, `Optional.empty`, `Path.of` |

実務では、**`static` ファクトリメソッド**のほうが圧倒的によく使います。
両者は紛らわしいですが、**「実装側に決定権を渡す」のが GoF 流**と覚えましょう。

---

## ラムダで書く「軽い Factory」

サブクラスを増やさなくても、**ラムダ式**で済むことが多いです。
ラムダを「**生成する関数**」とみなすと、`Supplier<T>` がぴったりです。

```java
import java.util.function.Function;

public class ShippingService {
    private final Function<Order, Label> labelFactory;

    public ShippingService(Function<Order, Label> labelFactory) {
        this.labelFactory = labelFactory;
    }

    public void ship(Order order) {
        Label label = labelFactory.apply(order);
        // ... 共通処理 ...
    }
}
```

呼び出し側は、

```java
ShippingService yamato = new ShippingService(YamatoLabel::new);
ShippingService sagawa = new ShippingService(SagawaLabel::new);
```

`YamatoLabel::new` は「**`new YamatoLabel(order)` を呼ぶラムダ式**」のメソッド参照（第22章）です。
サブクラスを 3 つも書かず、**コンストラクタ参照だけ**で同じ柔軟性が得られます。

---

## 使いどころと注意点

Factory Method が効くのは、次のような場面です。

- **作るオブジェクトの種類が、状況によって変わる**
- 呼び出し側に **`new` させたくない**（テストで差し替えたい、共通の前処理を入れたい）
- 生成の流れに、**共通のロジック**（バリデーション・ログ）を挟みたい

逆に、**`new Foo()` で済むものは、Factory にしない**でください。
パターン病（むやみにパターンを当てる病気）にかかると、`new` 1 行で書けるコードに 3 クラス使う、というぐったり感のあるコードを生みやすくなります。

---

## まとめ

- **Factory Method** は、生成の責任を**サブクラスや実装側に委ねる**パターン
- 呼び出し側は **インターフェース型** だけ知っていればよくなる
- `List.of` のような **`static` ファクトリメソッド** は別の概念
- 現代の Java では、**ラムダ式・メソッド参照**で軽く書けることが多い
- **「`new` をどこに置くか」**で迷ったら、Factory Method の出番

次の章では、**Abstract Factory** ―― 「**製品の家族**」をまとめて作るパターンを見ます。

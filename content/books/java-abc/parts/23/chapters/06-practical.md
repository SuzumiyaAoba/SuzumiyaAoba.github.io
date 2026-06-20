---
title: ストリームの実践 ― 操作を組み合わせる
llm: true
---

## ストリームの実践 ― 操作を組み合わせる

ここまでで、ストリームの「作る → 中間操作 → 終端操作」の道具がそろいました。
この節では、それらを**組み合わせて**、実践的なデータ処理を書いてみます。
題材として、「商品のリスト」を使います。

---

## 題材 ― 商品のリスト

商品を表すレコード（第17章）と、そのリストを用意します。

```java
record Product(String name, String category, int price) {}

List<Product> products = List.of(
    new Product("りんご",   "果物", 150),
    new Product("バナナ",   "果物", 100),
    new Product("にんじん", "野菜", 80),
    new Product("トマト",   "野菜", 200),
    new Product("いちご",   "果物", 400)
);
```

この商品リストに対して、いろいろな処理をストリームで書いていきましょう。

---

## 例1 ― 絞り込み・並べ替え・変換をつなぐ

「**果物の名前を、価格の高い順に**」取り出してみます。
`filter`（絞る）→ `sorted`（並べる）→ `map`（変換する）→ `toList`（集める）と、4つの操作をつなぎます。

```java
List<String> fruitNames = products.stream()
    .filter(p -> p.category().equals("果物"))                  // 果物だけ
    .sorted(Comparator.comparingInt(Product::price).reversed()) // 価格の高い順
    .map(Product::name)                                        // 名前だけに変換
    .toList();

IO.println(fruitNames);
```

```text
[いちご, りんご, バナナ]
```

「果物（いちご400・りんご150・バナナ100）を、高い順に並べて、名前を取り出す」が、流れるように書けました。

ここで `Comparator.comparingInt(Product::price)` は、「**`price` を基準に並べる**」という比較ルールです。
`.reversed()` を付けると、その逆順（高い順）になります。
「何を基準に並べるか」を、`comparing(...)` でこのように指定できます。

---

## 例2 ― カテゴリごとに集計する

「**カテゴリごとの、平均価格**」を求めてみます。
第5節の `groupingBy` に、平均を求める `averagingInt` を組み合わせます。

```java
import java.util.stream.Collectors;

Map<String, Double> avgByCategory = products.stream()
    .collect(Collectors.groupingBy(
        Product::category,                       // カテゴリでグループ分け
        Collectors.averagingInt(Product::price)  // グループごとに価格の平均
    ));

IO.println(avgByCategory);
```

```text
{果物=216.66666666666666, 野菜=140.0}
```

「果物の平均は216.6…円、野菜の平均は140.0円」と、カテゴリ別の集計が一発で求まりました。
`groupingBy` の第2引数を変えるだけで、「個数（`counting`）」「平均（`averagingInt`）」「合計（`summingInt`）」など、さまざまな集計に対応できます。
（結果の Map の順序は保証されません。）

---

## 例3 ― 合計を求める

「**全商品の合計金額**」を求めます。`mapToInt` で価格の `IntStream` にして、`sum()` です。

```java
int total = products.stream()
    .mapToInt(Product::price)   // 価格の IntStream に
    .sum();                     // 合計

IO.println(total);
```

```text
930
```

`150 + 100 + 80 + 200 + 400 = 930` 円。これも、ループなしの1行です。

---

## 例4 ― 条件に合うものを連結する

「**200円以上の商品名を、カンマ区切りで**」表示します。`filter` → `map` → `joining` です。

```java
String expensive = products.stream()
    .filter(p -> p.price() >= 200)        // 200円以上
    .map(Product::name)                   // 名前に
    .collect(Collectors.joining(", "));   // カンマでつなぐ

IO.println(expensive);
```

```text
トマト, いちご
```

「絞り込んで、名前を取り出して、つなぐ」が、自然な流れで書けました。

---

## for ループと比べてみる

例1（果物を高い順に、名前で）を、for ループで書くと、どうなるでしょうか。

```java
// for ループ版（参考）
List<Product> fruits = new ArrayList<>();
for (Product p : products) {
    if (p.category().equals("果物")) {
        fruits.add(p);
    }
}
fruits.sort(Comparator.comparingInt(Product::price).reversed());
List<String> fruitNames = new ArrayList<>();
for (Product p : fruits) {
    fruitNames.add(p.name());
}
```

動きは同じですが、一時的なリスト（`fruits`）を用意したり、ループを2回書いたりと、**手順の管理**が必要です。
ストリーム版は、その管理を Java に任せ、「**絞る・並べる・取り出す**」という**意図**だけを、上から並べられます。

| | for ループ | ストリーム |
|---|---|---|
| 書く内容 | 手順（どうやるか） | 意図（何をしたいか） |
| 一時変数 | 自分で用意 | 不要 |
| 処理の追加 | コードを書き足す | `.操作()` をつなぐ |

どちらが正しいということはありませんが、「**データを絞る・変換する・集計する**」処理では、ストリームのほうが、簡潔で読みやすくなることが多いのです。

---

## まとめ

- 中間操作と終端操作を**組み合わせる**と、複雑なデータ処理を簡潔に書ける
- `filter` → `sorted` → `map` → `toList` のように、**意図を上から並べる**
- 並べ替えは `Comparator.comparing(...)`／`comparingInt(...)`、逆順は `.reversed()`
- `groupingBy` に `averagingInt`・`summingInt`・`counting` を組み合わせて集計できる
- for ループは「手順」、ストリームは「意図」を書く。データ処理ではストリームが読みやすい

次の節では、ストリームでつまずきやすいポイントを、まとめて確認します。

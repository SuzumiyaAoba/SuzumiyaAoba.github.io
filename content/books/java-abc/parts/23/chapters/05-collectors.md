---
title: Collectors とグループ化
llm: true
co-author: ["Claude Opus 4.7"]
---

## Collectors とグループ化

終端操作の **`collect(...)`** に **`Collectors`**（コレクターズ）を渡すと、結果を「集める方法」を、こまかく指定できます。
リストにまとめるだけでなく、**文字列に連結する**・**グループに分ける**・**集計する**といった、より高度な集約ができます。
この節では、よく使う `Collectors` を学びます。

（`Collectors` は `java.util.stream` パッケージにあります。jshell では自動 import されます。）

---

## 文字列に連結する ― joining

**`Collectors.joining(区切り)`** は、ストリームの文字列を、1つの文字列に**連結**します。

```java
import java.util.stream.Collectors;

List<String> names = List.of("佐藤", "鈴木", "高橋");

String joined = names.stream()
    .collect(Collectors.joining(", "));   // 「, 」でつなぐ

IO.println(joined);
```

```text line-numbers=false
佐藤, 鈴木, 高橋
```

`joining(", ")` で、各要素を `, ` でつないでいます。
「リストを、カンマ区切りの1行にしたい」ときに便利です。
前後に飾りを付けることもできます（`joining(", ", "[", "]")` で `[佐藤, 鈴木, 高橋]` のように）。

---

## グループに分ける ― groupingBy

`Collectors` のいちばんの目玉が、**`Collectors.groupingBy(...)`** です。
これは、要素を「**あるキーごとに、グループ分け**」して、Map にまとめます。

例として、人のリストを「都市ごと」にグループ分けしてみましょう。
まず、人を表すレコード（第17章）を用意します。

```java
record Person(String name, int age, String city) {}

List<Person> people = List.of(
    new Person("佐藤", 25, "東京"),
    new Person("鈴木", 30, "大阪"),
    new Person("高橋", 28, "東京")
);

Map<String, List<Person>> byCity = people.stream()
    .collect(Collectors.groupingBy(Person::city));   // 都市でグループ分け

IO.println(byCity.get("東京").size());   // 東京の人数
```

```text line-numbers=false
2
```

`groupingBy(Person::city)` は、「`city`（都市）が同じ人を、1つのグループにまとめる」という意味です。
結果は `Map<String, List<Person>>` ―― 「都市名 → その都市の人のリスト」という Map になります。
`byCity.get("東京")` で、東京在住の人のリスト（佐藤・高橋の2人）が取り出せました。

「カテゴリごとに分ける」「ステータスごとに集める」といった処理が、たった1行で書けるのです。

---

## グループごとに数える ― groupingBy + counting

`groupingBy` の第2引数に、さらに集計方法を渡せます。
**`Collectors.counting()`** を組み合わせると、「**グループごとの個数**」を数えられます。

```java
Map<String, Long> countByCity = people.stream()
    .collect(Collectors.groupingBy(Person::city, Collectors.counting()));

IO.println(countByCity);
```

```text line-numbers=false
{東京=2, 大阪=1}
```

「都市ごとに、何人いるか」が、`{東京=2, 大阪=1}` という Map で得られました。
アンケートの集計（「年代ごとの人数」など）に、まさにうってつけです。
（結果の Map の表示順序は保証されません。第21章の `HashMap` と同じです。）

---

## キーと値の Map にする ― toMap

「あるものから、別のものを引く対応表」を作りたいときは、**`Collectors.toMap(キー, 値)`** を使います。

```java
List<Person> people = List.of(
    new Person("佐藤", 25, "東京"),
    new Person("鈴木", 30, "大阪")
);

Map<String, Integer> ageByName = people.stream()
    .collect(Collectors.toMap(Person::name, Person::age));   // 名前 → 年齢

IO.println(ageByName.get("佐藤"));
```

```text line-numbers=false
25
```

`toMap(Person::name, Person::age)` で、「名前をキー、年齢を値とする Map」ができました。
「名前から年齢を引く」対応表が、リストから一発で作れます。

---

## Collectors のまとめ

| Collector | 役割 | 結果 |
|---|---|---|
| `Collectors.toList()` | リストにする（`toList()` と同じ） | `List` |
| `Collectors.joining(区切り)` | 文字列を連結する | `String` |
| `Collectors.groupingBy(キー)` | キーごとにグループ分け | `Map<キー, List>` |
| `Collectors.groupingBy(キー, counting())` | グループごとに数える | `Map<キー, Long>` |
| `Collectors.toMap(キー, 値)` | キーと値の Map にする | `Map<キー, 値>` |

`collect(...)` と `Collectors` を組み合わせることで、「集める・つなぐ・分ける・数える」といった、さまざまな集約ができます。
中でも **`groupingBy`** は、実務でも非常によく使うので、ぜひ覚えておきましょう。

---

## まとめ

- 終端操作 **`collect(...)`** に **`Collectors`** を渡すと、高度な集約ができる
- **`Collectors.joining(区切り)`** … 文字列を連結する
- **`Collectors.groupingBy(キー)`** … キーごとにグループ分けし、Map にする（目玉）
- **`groupingBy(キー, counting())`** … グループごとの個数を数える
- **`Collectors.toMap(キー, 値)`** … キーと値の対応表（Map）を作る

次の節では、ここまでの操作を組み合わせた、ストリームの**実践例**を見ていきます。

---
title: 用語集 ― この章で学んだ言葉
llm: true
---

## 用語集 ― この章で学んだ言葉

第23章では、データを流れ作業で処理する「ストリーム API」を学びました。
節ごとに、言葉を整理しておきます。

---

## ストリームの基本（第1〜2節）

| 用語 | 英語・読み | 意味 |
|---|---|---|
| ストリーム | Stream | データを流れ作業のように処理するしくみ |
| メソッドチェーン | Method Chain | `.操作()` をつなげて書くスタイル |
| 中間操作 | Intermediate Operation | 加工する操作。ストリームを返す（まだ実行されない） |
| 終端操作 | Terminal Operation | 結果を得る操作。これで全体が実行される |
| 遅延評価 | Lazy Evaluation | 終端操作が呼ばれて初めて処理が走る性質 |

ストリームの生成：`コレクション.stream()`／`Stream.of(...)`／`IntStream.rangeClosed(a, b)`。

---

## 中間操作（第3節）

| 操作 | 役割 |
|---|---|
| `filter(条件)` | 条件に合う要素だけ通す |
| `map(変換)` | 各要素を別の値に変換する |
| `sorted()` / `sorted(Comparator)` | 並べ替える |
| `distinct()` | 重複を取り除く |
| `limit(n)` / `skip(n)` | 先頭 n 個 / 先頭 n 個を飛ばす |

---

## 終端操作（第4節）

| 操作 | 役割 |
|---|---|
| `toList()` | リストにまとめる |
| `forEach(処理)` | 各要素に処理する |
| `count()` | 個数を数える |
| `sum()` / `average()` | 合計 / 平均（`mapToInt` のあと） |
| `anyMatch` / `allMatch` / `noneMatch` | 条件判定（`boolean`） |

---

## Collectors（第5〜6節）

| Collector | 役割 |
|---|---|
| `Collectors.joining(区切り)` | 文字列を連結する |
| `Collectors.groupingBy(キー)` | キーごとにグループ分け（Map） |
| `Collectors.groupingBy(キー, counting())` | グループごとに数える |
| `Collectors.toMap(キー, 値)` | キーと値の Map を作る |

並べ替えのルール：`Comparator.comparing(...)`／`comparingInt(...)`、逆順は `.reversed()`。

---

## おわりに

この章では、モダン Java の華とも言える「ストリーム API」を学びました。

- ストリームは「**作る → 中間操作 → 終端操作**」の流れ作業
- **`filter`**（絞る）・**`map`**（変換）・**`sorted`**（並べる）で加工する
- **`toList`**・**`count`**・**`sum`**・**`collect`** で結果を得る
- **`groupingBy`** で、データをグループ分け・集計できる

第21章のコレクション、第22章のラムダ式が、ここで1つに結びつき、「データを宣言的に処理する」という、新しい書き方を手に入れました。
for ループと if を何重にも書いていた処理が、`filter`・`map`・`collect` をつなぐだけで、見違えるほどすっきり書けるようになったはずです。

ところで、第4節の `average()` は、「要素が0個かもしれない」ため、結果が直接の数値ではなく **`Optional`** という型で返りました。
`max()`・`min()`・`findFirst()` なども同じです。
この `Optional` は、「**値があるかもしれないし、ないかもしれない**」を安全に表す、とても重要なしくみです。

次の第24章「Optional」では、この `Optional` と、その背後にある「**`null` との戦い**」に、正面から向き合います。
`null` による `NullPointerException` を、根本から減らすための、モダン Java の重要な道具を学びましょう。

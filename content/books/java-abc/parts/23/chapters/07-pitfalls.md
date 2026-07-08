---
title: よくあるつまずき
llm: true
co-author: ["Claude Opus 4.7"]
---

## よくあるつまずき

ストリームで、初心者がつまずきやすいポイントを、まとめて確認します。

---

## 1. 終端操作を忘れて、何も起きない

第1節で学んだとおり、中間操作（`filter`・`map` など）だけでは、ストリームは**実行されません**。
終端操作を呼んで、初めて動きます。

```java
List<String> names = List.of("佐藤", "鈴木", "高橋");

names.stream()
    .filter(name -> name.contains("藤"));   // ✕ 終端操作がない → 何も起きない
```

このコードは、`filter` を書いただけで、終端操作がありません。
そのため、**何も実行されず、結果も得られません**（エラーにもなりませんが、絞り込みは行われていません）。

`toList()` や `forEach(...)` のような**終端操作**を、最後に必ず付けましょう。

```java
List<String> result = names.stream()
    .filter(name -> name.contains("藤"))
    .toList();   // ◯ 終端操作で実行される
IO.println(result);
```

```text line-numbers=false
[佐藤]
```

「**中間操作を並べたら、最後に終端操作で締める**」を、いつも忘れないようにしましょう。

---

## 2. 1つのストリームを、2回使う

ストリームは、**一度終端操作を呼ぶと、もう使えません**（使い捨てです）。
同じストリームを変数に入れて、2回使おうとすると、エラーになります。

```java
import java.util.stream.Stream;

Stream<Integer> s = List.of(1, 2, 3).stream();
s.forEach(x -> IO.println(x));   // 1回目（終端操作）
long c = s.count();              // ✕ 2回目 → エラー
```

```text line-numbers=false
Exception in thread "main" java.lang.IllegalStateException: stream has already been operated upon or closed
```

`IllegalStateException`（不正な状態の例外）で、「このストリームは、すでに操作されたか閉じられている」と言われます。
ストリームを使い回したいときは、変数に入れず、**そのつど `コレクション.stream()` で作り直します**。

```java
List<Integer> nums = List.of(1, 2, 3);
nums.stream().forEach(x -> IO.println(x));   // 1回目
long c = nums.stream().count();              // 2回目（作り直すのでOK）
```

「ストリームは使い捨て。元のコレクションから、何度でも作り直せる」と覚えておきましょう。

---

## 3. forEach の中で、結果を集めようとする

「集計したい」のに、`forEach` の中で外のリストに `add` しようとするのは、ストリームらしくありません。

```java
List<Integer> result = new ArrayList<>();
List.of(1, 2, 3, 4).stream()
    .filter(n -> n % 2 == 0)
    .forEach(n -> result.add(n));   // △ forEach で外のリストに追加
```

これは動きはしますが、「結果を集める」のは、本来 `toList()` や `collect(...)` の役目です。
素直に、終端操作で集めましょう。

```java
List<Integer> result = List.of(1, 2, 3, 4).stream()
    .filter(n -> n % 2 == 0)
    .toList();   // ◯ 集めるのは toList
```

`forEach` は「各要素に処理する（表示・保存など）」ためのもの、`toList`/`collect` は「結果を集める」ためのもの、と役割を分けましょう。

---

## 4. ストリームの中身が null

ストリームに `null` が混じっていると、`map` や `filter` の中で `null` を操作して、`NullPointerException`（第11章）になることがあります。

```java
List<String> names = Arrays.asList("佐藤", null, "高橋");
names.stream()
    .map(s -> s.length())   // null に length() → NullPointerException
    .toList();
```

`null` が混じる可能性があるなら、先に `filter` で取り除きます。

```java
names.stream()
    .filter(s -> s != null)   // null を取り除いてから
    .map(s -> s.length())
    .toList();
```

そもそも `null` を入れない設計（第24章の `Optional` など）が望ましいですが、外部から来るデータには、こうした備えが必要です。

---

## 5. 何でもストリームにしようとする

ストリームは強力ですが、**単純な処理まで、無理にストリームにする**と、かえって読みにくくなります。

```java
// △ ただ表示するだけなら、for-each のほうが素直
names.stream().forEach(name -> IO.println(name));

// ◯ シンプルな繰り返しは、ふつうの for-each で十分
for (String name : names) {
    IO.println(name);
}
```

「絞る・変換する・集計する」のように、**処理を組み合わせる**ときに、ストリームは真価を発揮します。
単に全要素を1つずつ処理するだけなら、第8章の for-each のほうが、素直で読みやすいことも多いのです。
「ストリームが向く場面か」を考えて、使い分けましょう。

---

## まとめ

- **終端操作を忘れない**（中間操作だけでは何も起きない）
- ストリームは**使い捨て**。2回使うと `IllegalStateException`。`stream()` で作り直す
- 結果を集めるのは `forEach` ではなく **`toList`/`collect`**
- 中身に `null` がありうるなら、先に `filter` で取り除く
- 単純な繰り返しは、無理にストリームにせず **for-each** でよい

次は、この章で学んだ言葉を、用語集としてまとめます。

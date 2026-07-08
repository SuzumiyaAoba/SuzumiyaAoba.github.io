---
title: よくあるつまずき
llm: true
co-author: ["Claude Opus 4.7", "Claude Opus 4.8"]
---

## よくあるつまずき

ジェネリクスで、初心者がつまずきやすいポイントを、まとめて確認します。

---

## 1. 型引数に基本型を使おうとする

型引数（`< >` の中）には、**参照型しか使えません**。`int` などの基本型は、直接は指定できません。

```java
List<int> numbers = ...;   // ✕ 基本型は使えない
```

```text line-numbers=false
エラー: 予期しない型
```

`int` のかわりに、ラッパークラスの **`Integer`** を使います。

```java
List<Integer> numbers = ...;   // ◯ Integer を使う
numbers.add(123);              // int の 123 を入れられる（自動変換）
```

| 基本型 | ラッパークラス |
|---|---|
| `int` | `Integer` |
| `double` | `Double` |
| `boolean` | `Boolean` |
| `char` | `Character` |

`Integer` を使えば、`int` の値をそのまま入れたり取り出したりできます（オートボクシング）。

---

## 2. 型を指定し忘れる

ジェネリックな型を使うとき、`< >` で型を指定しないと、警告が出たり、安全でない（型チェックが効かない）状態になったりします。

```java
List list = new ArrayList();   // △ 型を指定していない（生の型）
```

このように型引数を省いた形を**生の型**（Raw Type）と呼びますが、これは**避けるべき**書き方です。
型チェックが効かなくなり、ジェネリクスの利点（安全性）が失われてしまいます。
必ず `List<String>` のように、**型を指定**しましょう。

```java
List<String> list = new ArrayList<>();   // ◯ 型を指定する
```

---

## 3. 左辺と右辺で、型をそろえる

`List<String>` の変数に、`new ArrayList<Integer>()` のような、**違う型**を入れることはできません。

```java
List<String> list = new ArrayList<Integer>();   // ✕ String と Integer で食い違い
```

左辺と右辺の型引数は、そろえる必要があります。
ダイヤモンド演算子 `<>` を使えば、右辺の型は左辺から自動で合わせてくれるので、食い違いを防げます。

```java
List<String> list = new ArrayList<>();   // ◯ <> なら左辺に合う
```

---

## 4. `List<Integer>` を `List<Number>` に代入できない（発展）

`Integer` は `Number` の仲間なのに、`List<Integer>` を `List<Number>` に入れようとすると、エラーになります。

```java
List<Integer> ints = new ArrayList<>();
List<Number> nums = ints;   // ✕ ジェネリクスは不変
```

これは間違いではなく、ジェネリクスが**不変**（第7節）だからです。
「リストから**取り出して使うだけ**」なら、`List<? extends Number>` という**共変**の受け皿を使えば渡せます（第8節）。

```java
static double sum(List<? extends Number> list) { ... }   // ◯ List<Integer> も渡せる
```

---

## 5. `? extends` のリストに add しようとする（発展）

`List<? extends Number>` を受け取ったからといって、そこに要素を追加することはできません。

```java
static void bad(List<? extends Number> list) {
    list.add(1);   // ✕ 共変なので追加できない
}
```

`? extends` は「**読み出す側**」専用です。追加もしたいなら、`? super`（反変）を使います。
迷ったら **PECS**（Producer-Extends, Consumer-Super）を思い出してください（第8節）。

---

## 6. ジェネリクスは「読めれば、まず十分」

ジェネリクスを、自分でゼロから設計する（`class Box<T>` を作るなど）のは、最初のうちは、それほど多くありません。
むしろ、`List<String>` や `Map<String, Integer>` のような、**既存のジェネリックな型を使う**場面が、圧倒的に多いです。

ですから、いまの段階では、

- `<>` の中を見て、「何を入れる型か」を**読めること**
- 使うときに、`<String>` のように**型を指定できること**

ができれば、十分です。
複雑なジェネリクスの設計は、必要になったときに、少しずつ学んでいけば大丈夫です。
「全部を完璧に理解しよう」と気負わず、まずは「読めて、使える」を目指しましょう。

---

## まとめ

- 型引数に**基本型は使えない**。`int` → `Integer` のように**ラッパークラス**を使う
- 型を指定しない**生の型**（`List list`）は避け、必ず `List<String>` のように指定する
- 左辺と右辺の型引数はそろえる。右辺は **`<>`**（ダイヤモンド）で省略するのが安全
- （発展）`List<Integer>` は `List<Number>` に代入できない（**不変**）。読むだけなら `? extends` を使う
- （発展）`? extends` のリストには **add できない**。追加したいなら `? super`（**PECS**）
- まずは「`<>` を**読めて、使える**」ことを目標にすればよい

次は、この章で学んだ言葉を、用語集としてまとめます。

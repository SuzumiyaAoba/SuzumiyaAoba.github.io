---
title: ストリーム・コレクションの効率
llm: true
---

## ストリーム・コレクションの効率

第23章で扱った Stream API は、コードを宣言的に・読みやすく書ける素晴らしい道具です。
ただし、何でもストリーム化すれば速い、というわけではありません。
この節では、ストリームとコレクションを効率よく使うコツを整理します。

---

## ストリームは「ふつう」のループより必ずしも速くない

第23章では、ストリームのメリットを多く扱いましたが、

```java
// ストリーム
int sum = list.stream().mapToInt(Integer::intValue).sum();

// ふつうのループ
int sum = 0;
for (int n : list) sum += n;
```

これらを JMH で測ると、**ふつうのループのほうが速い**ことが多いです。
ストリームには、

- **オートボクシング**（`Integer` → `int`）
- **ラムダのインスタンス化**
- **ストリームパイプライン構築のオーバーヘッド**

があり、軽い処理だとそれらが効いてきます。
**「**コードの読みやすさ**」では使う、「**ホットパス**」では避ける** ―― これがバランスです。

---

## `parallelStream()` は注意して使う

ストリーム API には `.parallelStream()` という、**並列化**の魔法のようなメソッドがあります。

```java
list.parallelStream().map(this::heavyWork).collect(Collectors.toList());
```

便利そうですが、

- 内部で **`ForkJoinPool.commonPool`** が使われる ―― **JVM 全体で共有**
- 短時間の処理だと、**並列化のオーバーヘッド**で逆に遅い
- I/O 待ちの処理だと、`commonPool` の枯渇でアプリ全体が止まる

ふつうの業務コードで `parallelStream()` を使う場面は、**ほとんどありません**。
大量の CPU 計算で、それなりに時間がかかる処理に限られます。
仮想スレッド時代（第29章）には、`StructuredTaskScope`（第44章）のほうが選択肢として上です。

---

## `Collectors.toList()` vs `toUnmodifiableList()` vs Java 16+ の `toList()`

ストリームをリストに集めるコレクタには、いくつか種類があります。

| 形式 | 結果 | 用途 |
|---|---|---|
| `.collect(Collectors.toList())` | 可変・実装非保証 | レガシー（避ける） |
| `.collect(Collectors.toUnmodifiableList())` | 不変 | 渡す先で書き換え不可 |
| **`.toList()`**（Java 16+） | 不変、`null` OK | **第一選択** |

Java 16 で追加された `Stream.toList()` は、

- ボイラープレートが少ない
- **不変**を返す
- パフォーマンスも最適化

ふつうのコードでは、これ一択です。

---

## ストリームの「閉じ忘れ」

`Stream` は `AutoCloseable` です。
ふつうのストリーム（`list.stream()`）は閉じる必要がありませんが、**`Files.lines(path)`** などの**リソースを開く**ストリームは、必ず閉じる必要があります。

```java
// NG: ストリームを閉じない、リソースリーク
List<String> lines = Files.lines(path).collect(Collectors.toList());

// OK: try-with-resources で閉じる
try (Stream<String> stream = Files.lines(path)) {
    return stream.collect(Collectors.toList());
}
```

「**ストリームを返すメソッド**」を作るときも、呼び出し側で `close` できるよう、`try-with-resources` で囲いやすく設計します。

---

## 「**サイズが既知ならコレクタにヒントを与える**」

`toList()` のような Collectors は、**最終サイズを知らない**ため、内部で動的サイズの `ArrayList` を作って、リハッシュを繰り返します。
サイズを事前に知っているなら、自前で集めるほうが速いことがあります。

```java
// 標準的
List<String> result = stream.collect(Collectors.toList());

// サイズ既知 ―― 自前で初期化
List<String> result = new ArrayList<>(expectedSize);
stream.forEach(result::add);
```

ホットパスでは、後者のほうが速いことがあります。
これも測ってから採用 ―― 「**先に最適化しない**」を忘れずに。

---

## オートボクシングを避ける

第43章で触れたとおり、ジェネリクスでプリミティブを使う `List<Integer>` などは、**オートボクシング**で遅くなります。

ストリームでは、専用のプリミティブ版があります。

| 通常 | プリミティブ版 |
|---|---|
| `Stream<Integer>` | `IntStream` |
| `Stream<Long>` | `LongStream` |
| `Stream<Double>` | `DoubleStream` |

```java
// 遅い
int sum = list.stream().mapToInt(Integer::intValue).sum();
// より速い (List<Integer> → IntStream の変換時にボクシング解除)

// もっと速い (元から int[] なら)
int[] arr = ...;
int sum = IntStream.of(arr).sum();
```

ホットパスでは、コレクションの**型から見直す**価値があります。

---

## 「**1 回しかストリームを使わない**」

`Stream` は、**1 回しか消費できません**。
2 回 forEach すると、

```text
java.lang.IllegalStateException: stream has already been operated upon or closed
```

ストリームを使い回したいなら、`Supplier<Stream<T>>` で**毎回生成**するか、いったんリストに集めて使い回します。

```java
// NG
Stream<Integer> s = list.stream();
s.forEach(System.out::println);
s.forEach(System.out::println);   // ← Exception

// OK
Supplier<Stream<Integer>> sup = () -> list.stream();
sup.get().forEach(System.out::println);
sup.get().forEach(System.out::println);
```

---

## `forEach` の落とし穴 ―― `parallelStream` の順序

`stream.forEach(System.out::println)` は順序を保証しますが、
`parallelStream.forEach(...)` は**順序を保証しません**。
順序を保ちたいなら、**`forEachOrdered`** を使います。

「**並列で速くしたつもりが、出力順がバラバラ**」 ―― これも典型的なバグです。

---

## ループとストリームのバランス

性能のテーマで、ストリームに辛口でしたが、**業務コードでは読みやすさが第一**です。

- **業務ロジック**: ストリームで宣言的に
- **ホットパス**: ふつうのループに置き換える価値がある
- **「ここは遅いはず」と感じたら**: JMH で測る

「**まず読みやすく、必要なときだけ最適化**」 ―― これが現代の Java の哲学です。

---

## まとめると

- ストリームは**読みやすさ**で使い、**ホットパスでは控える**
- **`parallelStream()` は要注意**、`StructuredTaskScope` の検討も
- リスト変換は **`.toList()`**（Java 16+）が第一選択
- `Stream` の**閉じ忘れ**に注意（`Files.lines` など）
- ホットパスでは、**プリミティブ版ストリーム** (`IntStream`) を活用
- `Stream` は**1 回しか消費できない**
- **業務は読みやすさ、ホットパスは性能**で書き分ける

次の節では、**データベースアクセスの効率**を実践的に整理します。

---
title: データ構造の選択
llm: true
---

## データ構造の選択

性能改善で最も効果が大きいのは、**アルゴリズムとデータ構造**の見直しです。
JVM の設定をいじる前に、**コレクションの選択**を見直すだけで、性能が**桁違い**に変わることがあります。
この節では、第21章のコレクションの実践編として、選択のポイントを整理します。

---

## 「**`ArrayList` でいい**」が大半

まず、Java 標準コレクションの基本姿勢から。

- 90 % のケースで、**`ArrayList`** で十分
- 90 % のケースで、**`HashMap`** / **`HashSet`** で十分

ふつうの業務コードで「`LinkedList` のほうが速いはず」と書き直す ―― これは大抵、逆に遅くなります。
迷ったら**`ArrayList` か `HashMap`** を選ぶのが基本です。

---

## `LinkedList` は基本的に**使わない**

`LinkedList` は、Java の教科書では「**追加削除が O(1) で速い**」と書かれます。
ですが、現代のハードウェアと JIT の上では、**ほぼ常に`ArrayList` のほうが速い**。

理由:

- `LinkedList` はノードを**ヒープに散らばって**置く ―― キャッシュ局所性が**最悪**
- `ArrayList` の `add`・`remove` は**配列のコピー**だが、**現代の CPU はそれが速い**
- ベンチマークすると、**100 万要素**でも `ArrayList` の追加が `LinkedList` より速いことが多い

`LinkedList` を使う合理的な理由は、ほぼ「**`Deque` インタフェースが必要**」だけ、それも `ArrayDeque` のほうが速い。
新規コードに `LinkedList` を書く理由は、現代では**ほぼありません**。

---

## `HashMap` vs `TreeMap`

| 項目 | `HashMap` | `TreeMap` |
|---|---|---|
| 操作の計算量 | **O(1)** | O(log N) |
| 順序 | なし | **ソート順** |
| ヒープ使用量 | 小 | やや大 |
| キーの要件 | `equals` / `hashCode` | `Comparable` |

「**順序が必要かどうか**」で決まります。
要らないなら、**`HashMap` 一択**です。「念のため `TreeMap`」は、無駄な遅さを買うだけです。

---

## 順序付き Map ―― `LinkedHashMap`

「**挿入順を保ちたい**」「**最近アクセス順で LRU を作りたい**」 ―― そんなときは `LinkedHashMap`。

```java
Map<String, String> lru = new LinkedHashMap<>(16, 0.75f, true) {
    protected boolean removeEldestEntry(Map.Entry<String, String> eldest) {
        return size() > 100;   // 100 個を超えたら古いものを削除
    }
};
```

3 引数目の `true` で「アクセス順」モード。
最近アクセスしたエントリが**末尾に移動**し、古いものから自動削除されます。
小規模な LRU キャッシュとして、ライブラリなしで実装できます。

---

## `ConcurrentHashMap`

並行アクセスがあるなら、**`ConcurrentHashMap`** が基本選択。
第43章で見たとおり、内部でセグメント化された CAS により、**ほぼロックなし**の読みを提供します。

```java
ConcurrentHashMap<String, AtomicInteger> counters = new ConcurrentHashMap<>();
counters.computeIfAbsent(key, k -> new AtomicInteger())
        .incrementAndGet();
```

`computeIfAbsent` や `merge` のような**atomic な複合操作**を提供しているので、ロックを書かずに済む場面が多いです。

---

## キーが整数なら `IntMap` を検討

`Map<Integer, V>` でキーが整数の場合、**`Integer` のボクシング**でメモリと CPU を消費します。
専用の **`IntMap`** 型は標準にはありませんが、ライブラリで対応できます。

- **Eclipse Collections** ―― `IntObjectHashMap<V>` などのプリミティブ版コレクション
- **HPPC** ―― 高速 Primitive Collections
- **fastutil** ―― 同じく Primitive 専用

巨大な int キーマップ（1000 万件レベル）では、これらの導入で **10 倍以上**の速度・メモリ改善が出ます。
小規模なら、標準で十分です。

---

## 「**配列**」を忘れない

最も速いデータ構造は、しばしば**ただの配列**です。

- 連続したメモリで、**キャッシュ効率が最高**
- インデックスアクセスは**真の O(1)**
- メモリオーバーヘッドが**最小**

ループの中で何度もアクセスする「**ホットなデータ**」は、`ArrayList` ではなく `int[]` や `double[]` のほうが、**数倍速い**ことがあります。

```java
// 遅い: List<Integer> でループ
List<Integer> nums = ...;
int s = 0;
for (int n : nums) s += n;   // ボクシング解除のコスト

// 速い: int[] でループ
int[] nums = ...;
int s = 0;
for (int n : nums) s += n;
```

業務ロジックは `List<Integer>` で書くとして、**ホットパスだけ `int[]`** に降りる、という構成が、性能と読みやすさのバランス取りに有効です。

---

## 不変コレクション

第43章でも触れたとおり、**`List.of(...)`** / **`Set.of(...)`** / **`Map.of(...)`** で作る不変コレクションは:

- **省メモリ**: 内部実装が極端に最適化されている
- **スレッド安全**: 不変なので、ロック不要
- **早い**: 構造が固定で、JIT に最適化されやすい

「**作成時に内容が決まり、後から変えない**」コレクションには、すべて使えます。
**defensive copy** の代わりにも便利です。

---

## サイズを事前に与える

`new HashMap<>()` のデフォルトサイズは 16。
最終的に 1000 個入れるなら、**初期サイズを指定**したほうが、**リハッシュ**が走らなくて済みます。

```java
// 遅い: 何度もリハッシュ
Map<String, String> m = new HashMap<>();
for (var e : entries) m.put(e.key, e.value);

// 速い: 初期サイズを与える
Map<String, String> m = new HashMap<>(entries.size() * 2);
for (var e : entries) m.put(e.key, e.value);
```

`HashMap` の初期サイズは、**`expected / 0.75`**（負荷率）が目安。
細かいですが、効きます。

---

## まとめると

- **`ArrayList` と `HashMap` で十分**な場面が大半
- **`LinkedList` は使わない**
- 順序が必要なら **`LinkedHashMap`** か **`TreeMap`**
- 並行は **`ConcurrentHashMap`**
- 巨大な整数キーマップは **Eclipse Collections** や **HPPC**
- ホットパスは **`int[]`** など**プリミティブ配列**を検討
- 不変なら **`List.of`** / **`Map.of`**
- **初期サイズを指定**して、リハッシュを回避

次の節では、ストリームとコレクションをめぐる**もう少し細かな効率**を扱います。

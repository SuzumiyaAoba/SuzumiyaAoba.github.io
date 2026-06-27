---
title: ScopedValue ― スレッド境界を超える値
llm: true
---

## `ScopedValue` ― スレッド境界を超える値

並行処理で困るのは、ロジックだけではありません。
「**リクエスト ID**」「**現在のユーザー**」「**トレース情報**」などの**文脈**（context）を、メソッドの引数で持ち回るのは現実的ではなく、`ThreadLocal` に頼ってきました。

その `ThreadLocal` を**置き換える**のが、Java 25 で**正式機能**になった **`ScopedValue`**（JEP 506）です。
この節では、**何が良くなるか**と**使い方**を見ていきます。

---

## なぜ `ThreadLocal` ではダメだったか

第43章の「つまずき」で触れた `ThreadLocal` の弱点を、もう一度整理します。

| 弱点 | 内容 |
|---|---|
| **書き換え可能** | どこでも `set()` できるので、いつ・誰が変えたか追えない |
| **`remove()` を忘れるとリーク** | スレッドプールで再利用されるスレッドでは特に深刻 |
| **継承しにくい** | 子スレッドに伝えるには `InheritableThreadLocal` が必要 |
| **仮想スレッドと相性が悪い** | 大量の仮想スレッドが、それぞれ ThreadLocal を持つとメモリ圧迫 |

特に最後の点は、**仮想スレッド時代**には致命的でした。
仮想スレッドが**何百万本**動く環境で、それぞれが ThreadLocal にデータを抱えると、ヒープがすぐ尽きます。

---

## `ScopedValue` の発想

`ScopedValue` は、`ThreadLocal` の問題を**根本から**解決します。

| | `ThreadLocal` | `ScopedValue` |
|---|---|---|
| 書き換え | できる（`set()`） | **できない**（イミュータブル） |
| スコープ | 明確でない | **明確**（`where(...).run(...)` のブロック） |
| 解放 | `remove()` を呼ぶ必要 | **スコープを抜けたら自動解放** |
| 子スレッドへの伝達 | `InheritableThreadLocal` で明示 | **`StructuredTaskScope` で自動伝達** |
| メモリ効率 | 各スレッドが Map を保持 | **スコープに紐づく軽量な仕組み** |

要するに、

- **書けない**（一度設定したら、その内側では不変）
- **スコープ限定**（`where(...).run(...)` ブロックの中だけ）
- **自動解放**（ブロックを抜けたら消える）
- **構造化と相性がよい**（`StructuredTaskScope` の子タスクに自動継承）

---

## 基本の書き方

`ScopedValue` を使う基本パターンです。

```java
import java.lang.ScopedValue;

class RequestContext {
    static final ScopedValue<String> USER = ScopedValue.newInstance();
}

void handle(String userName) {
    ScopedValue.where(RequestContext.USER, userName).run(() -> {
        doBusinessLogic();
    });
    // ここを抜けると、USER の値は消える
}

void doBusinessLogic() {
    System.out.println("user = " + RequestContext.USER.get());   // "alice"
}
```

3 つのステップに分かれます。

1. **`ScopedValue.newInstance()`** で `ScopedValue<T>` を作る（`static final` が定石）
2. **`ScopedValue.where(value, ...)`** で、値を設定して、その中で**ラムダを実行**
3. ラムダの中（と、その中から呼ばれた全メソッド）で、**`.get()`** で取得できる

`run(...)` のラムダの中だけが**「USER は alice である」スコープ**で、外では値は**そもそも存在しません**（`.isBound()` が `false`）。

---

## `run` と `call`

`ScopedValue.where(...)` には、

- **`.run(Runnable)`** ―― 戻り値なし、checked 例外なし（`Runnable`）
- **`.call(CheckedSupplier<T, ?>)`** ―― 戻り値あり、checked 例外あり

の 2 つがあります。
データを返したいなら `call`、副作用だけなら `run`、と使い分けます。

```java
String result = ScopedValue.where(USER, "alice").call(() -> {
    return "Hello, " + USER.get();
});
// result = "Hello, alice"
```

---

## ネスト ―― 値を「**かぶせる**」

`ScopedValue` は、ネストできます。
内側で `where(...)` を呼ぶと、**その内側だけ**値が上書きされ、抜けると元に戻ります。

```java
ScopedValue.where(USER, "alice").run(() -> {
    System.out.println(USER.get());   // "alice"
    ScopedValue.where(USER, "bob").run(() -> {
        System.out.println(USER.get());   // "bob"
    });
    System.out.println(USER.get());   // "alice"（戻る）
});
```

これは、`ThreadLocal` の `set` → 何か → `set(元の値)` の手作業を、**スコープで自動化**したものと考えると分かりやすいです。

---

## `StructuredTaskScope` との合わせ技

`ScopedValue` の真価は、`StructuredTaskScope` と組み合わせたときに発揮されます。
スコープ内で `fork` した**子タスクは、親の `ScopedValue` を自動的に継承**します。

```java
static final ScopedValue<String> REQUEST_ID = ScopedValue.newInstance();

void handle(String reqId) throws Exception {
    ScopedValue.where(REQUEST_ID, reqId).call(() -> {
        try (var scope = StructuredTaskScope.open()) {
            var t1 = scope.fork(() -> {
                // 子タスクの中でも REQUEST_ID が見える
                log.info("fetching user, req=" + REQUEST_ID.get());
                return fetchUser();
            });
            var t2 = scope.fork(() -> {
                log.info("fetching order, req=" + REQUEST_ID.get());
                return fetchOrder();
            });
            scope.join();
            return combine(t1.get(), t2.get());
        }
    });
}
```

ThreadLocal なら、`InheritableThreadLocal` を使ったり、明示的にコピーしたりする必要がありました。
`ScopedValue` は、**自動で・安全に**子に伝わります。

---

## `ScopedValue` で**できない**こと

`ScopedValue` は強力ですが、`ThreadLocal` でできたいくつかのことは**できません**。

### 1. **後から書き換える**

```java
USER.set("bob");   // ← そんなメソッドはない
```

これは仕様上の不便ではなく、**意図的な制約**です。書き換えを認めると、スレッド安全性とスコープが崩れます。
「**書き換えたい**」場合は、`AtomicReference` のフィールドを `ScopedValue` で渡す、という形で書きます。

### 2. **ブロックを超えて使う**

```java
String name;
ScopedValue.where(USER, "alice").run(() -> {
    name = USER.get();
});
System.out.println(name);   // ← ここではもう USER は無効
```

スコープ外で `.get()` を呼ぶと `NoSuchElementException` が投げられます。
**必要なら、ブロックの外に渡したい値は、明示的に取り出してから持ち出す**こと。

### 3. **マルチスレッドの「**共有状態**」**

`ScopedValue` は**共有状態**ではなく、**スレッド限定の文脈**です。
スレッド間で「同じ値を読む / 書く」 が要件なら、`AtomicReference` や `ConcurrentHashMap` を使います。

---

## 既存の `ThreadLocal` からの移行

既存の `ThreadLocal` ベースのコード（Spring の `SecurityContextHolder` など）を、すべて `ScopedValue` に置き換える必要はありません。
ライブラリレベルでは、まだ `ThreadLocal` ベースのものが多いですし、ScopedValue へのブリッジ実装も整いつつあります。

**新規コード**で、文脈伝達が必要な場面では、`ScopedValue` を**第一選択**にしましょう。
特に、`StructuredTaskScope` と組み合わせるなら、`ScopedValue` を使わない理由はありません。

---

## まとめると

- `ScopedValue` は、`ThreadLocal` の**問題を解決した後継**（Java 25 で正式機能）
- **書けない・スコープ限定・自動解放**で、安全
- 基本パターン: `ScopedValue.where(KEY, value).run(...)`
- ネストすると、内側だけ値が**かぶせ**られる
- **`StructuredTaskScope` の子タスクに自動継承**される
- 書き換えやスコープ外利用は**できない**（仕様）
- 新規コードでは `ScopedValue` を第一選択に

次の節では、ここまでの `StructuredTaskScope` と、よく似た役割を持つ **`CompletableFuture`** との**使い分け**を見ていきます。

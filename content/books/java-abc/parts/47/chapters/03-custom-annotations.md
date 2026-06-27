---
title: 独自アノテーションを定義する
llm: true
---

## 独自アノテーションを定義する

第46章で、`@MyTest` を例に独自アノテーションを宣言しました。
この節では、もう少し**現実的な例**を題材に、独自アノテーションの設計上の選択を整理します。

---

## 例: `@Cached` で「**結果をキャッシュする**」

「**メソッドの結果を一定時間キャッシュしたい**」という、よくある要求を考えます。

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Cached {
    int seconds() default 60;
    String name() default "";
}
```

要素を見てみます。

- `seconds()` ―― キャッシュの寿命。デフォルト 60 秒
- `name()` ―― キャッシュ名。省略時はメソッド名から自動推測

これだけで、利用側はこう書けます。

```java
@Cached
public User findById(long id) { ... }

@Cached(seconds = 300, name = "userByEmail")
public User findByEmail(String email) { ... }
```

そして、ランタイムでこのアノテーションを読み取って、キャッシュロジックを差し込む ―― これが、Spring の `@Cacheable` の原理です。

---

## 要素の型 ―― 何が書けるか

アノテーション要素として使える型には、**制限**があります。

| OK な型 | 例 |
|---|---|
| プリミティブ | `int`、`long`、`boolean` |
| `String` | |
| `Class<?>` | |
| `enum` | |
| 別のアノテーション | |
| 上記の**配列** | `int[]`、`Class<?>[]` |

| NG な型 | 理由 |
|---|---|
| `Object` | コンパイル時に値を確定できない |
| 任意の参照型 | 同上 |
| `List` などの可変コレクション | 配列で代用 |

複数の値を渡したいときは、配列を使います:

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@interface Tags {
    String[] value() default {};
    Class<?>[] groups() default {};
}
```

使う側:

```java
@Tags(value = {"admin", "user"}, groups = {SecurityGroup.class})
public class AdminService { }
```

---

## `value` という特別な名前

要素名が **`value`** だけの場合、利用側で要素名を**省略**できます。

```java
@interface Order {
    int value();
}

// 使う側
@Order(3) public void run() { }    // value を省略
@Order(value = 3) public void run() { }    // 明示しても OK
```

複数要素のときも、`value` 以外を省略するなら、`value =` も省略できます:

```java
@interface Item {
    int value();
    String name() default "";
}

@Item(3)                    // value だけ
@Item(value = 3, name = "x")  // 両方
@Item(name = "x")           // value がデフォルトなしならエラー（必須）
```

このおかげで、`@SuppressWarnings("unchecked")` のように、**1 要素のアノテーション**は読みやすく書けます。

---

## デフォルト値の慣例

要素にデフォルトを与えるなら、

- **空文字** `""` で「**省略時はメソッド名から推測**」
- **0** で「**指定なし**」
- **空配列** `{}` で「**何もない**」

といった慣例があります。
利用側で**省略可能**にしたい要素は、必ずデフォルトを書きます。
デフォルトのない要素は、利用側で**必須**になります。

---

## アノテーションを「**読みやすいドキュメント**」にする

設計のコツとして、**アノテーションがコメントの代わりを果たす**ように使うと、コードが読みやすくなります。

たとえば:

```java
@Cached(seconds = 300, name = "userByEmail")
@RateLimit(perMinute = 60)
@RequireRole("admin")
public User findByEmail(String email) { ... }
```

これだけで、

- 5 分キャッシュ
- 毎分 60 回まで
- 管理者ロール必須

ということが、コメントなしで読み取れます。
**アノテーションは「メタデータ」であり「ドキュメント」でもある** ―― この意識を持つと、無闇に増やすことなく、必要なものだけを設計できます。

---

## アノテーションの組み合わせ ―― メタアノテーション

複数のアノテーションを**まとめた**カスタムアノテーションも作れます。

```java
@Cached(seconds = 60)
@RateLimit(perMinute = 100)
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface PublicApi { }
```

これは、`@Cached` と `@RateLimit` と同じ意味を持つ `@PublicApi` を作る、というアイデア。
利用側は `@PublicApi` 1 つで済みます。

ただし、これを実装するには「**`@PublicApi` が付いたメソッドに対し、その上のアノテーションも有効として扱う**」処理を、フレームワーク側で書く必要があります。
Spring は `AnnotatedElementUtils` でこれを正しくやっていますが、生のリフレクション API には、再帰的なアノテーション探索のサポートがありません。

業務コードでは、ここまでメタプログラミング寄りに作り込まないのが現実的です。

---

## 「**標準を壊すアノテーションを作らない**」

最後に、設計の落とし穴を 1 つ。

- 標準の `@Nullable` と意味のずれる `@Nullable` を独自に作る
- 既存ライブラリの `@Service` と同名のアノテーションを別意味で作る

これらは、ユーザーが**混乱**するもとです。
カスタムアノテーションを作るときは、

1. 標準・有名ライブラリで**同名・近名のものがないか**を調べる
2. ある場合は、**それを使えないか**を考える
3. 別物として作るなら、**名前を変える**

ことを徹底します。
アノテーションの世界は、**名前そのものが言語の語彙**になります。慎重に。

---

## まとめると

- 要素の型は、**プリミティブ・String・Class・enum・別のアノテーション・それらの配列**に限られる
- `value` という名前は特別 ―― **利用側で省略可能**になる
- デフォルト値を与えると、**省略可能**な要素になる
- アノテーションは「**コメント代わりのドキュメント**」として機能する
- メタアノテーションでまとめることもできるが、**フレームワーク側の対応**が必要
- 標準・有名ライブラリと**衝突する名前**は避ける

次の節では、ランタイム処理（リフレクション）とコンパイル時処理（プロセッサ）の**使い分け**を整理します。

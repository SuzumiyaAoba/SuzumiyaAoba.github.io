---
title: アノテーションの種類とライフサイクル
llm: true
---

## アノテーションの種類とライフサイクル

第46章で「アノテーションには **保持期間**（`Retention`）がある」と触れました。
この節では、その違いをじっくり見て、**いつ・どれを選ぶか**の判断ができるようになります。

---

## 3 つの保持期間

```java
@Retention(RetentionPolicy.SOURCE)
@Retention(RetentionPolicy.CLASS)
@Retention(RetentionPolicy.RUNTIME)
```

それぞれの**寿命**を、`.java` から実行まで追ってみます。

```text
[.java ソース]
   │
   ├── SOURCE ── ここで消える（javac が消す）
   │
   ├── CLASS ──── .class まで残る、しかし JVM ロード時には捨てる
   │
   └── RUNTIME ── 実行時もずっと残る ―― リフレクションで読める
```

具体的な例を挙げます。

| 保持期間 | 例 | 主用途 |
|---|---|---|
| **SOURCE** | `@Override`、`@SuppressWarnings`、Lombok の `@Data` | コンパイラへの指示、コード生成 |
| **CLASS** | （実例は少ない） | バイトコード解析ツール用 |
| **RUNTIME** | `@Test`、`@Autowired`、`@Entity`、`@JsonProperty` | リフレクションでの動的処理 |

`CLASS` は使いどころが少なく、`SOURCE` と `RUNTIME` の 2 つを使い分けるのが現実的です。

---

## SOURCE ― コンパイラへの指示

`@Override` を見てみます。

```java
class Parent {
    public void hello() { System.out.println("parent"); }
}

class Child extends Parent {
    @Override
    public void helo() { System.out.println("child"); }   // ← typo!
}
```

ここで `helo`（typo）と書くと、コンパイラが、

```text
error: method does not override or implement a method from a supertype
    @Override
    ^
```

と教えてくれます。
これが `@Override` の正体です。**実行時には何も起きない**、ただ**コンパイラに「親のメソッドを上書きしているはず」と伝える**だけ。

`.class` には残らない、純粋なコンパイル時の合図です。

---

## CLASS ― バイトコード解析向け

`CLASS` 保持期間は、

- `.class` ファイルには情報が**残る**
- JVM のクラスロード時に**捨てられる**
- リフレクションから見えない

この用途は、**バイトコード解析ツール**や**外部の解析器**向けです。
たとえば、

- 静的解析ツール（SpotBugs）が、`.class` を読んでアノテーションをチェック
- ProGuard・R8 が、`@Keep` アノテーションを見て難読化対象から外す

こうしたケースで使われますが、**実例はあまり多くない**ので、本書では「**そういうものがある**」とだけ覚えてください。

`@Retention` を**省略**したアノテーションは、デフォルトで `CLASS` 扱いになります。
これも歴史的な事情で、初心者が「あれ、`getAnnotation` で読めない」とハマる地雷です。
**`RUNTIME` で読みたいなら、明示的に書く**こと。

---

## RUNTIME ― リフレクションで読む

最も多いパターンです。第46章で見た `@MyTest` のように、**実行時にリフレクションで読み取る**前提のアノテーションは、すべて `RUNTIME` です。

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface Cached {
    int seconds() default 60;
}
```

これで、

```java
Method m = ...;
Cached c = m.getAnnotation(Cached.class);
if (c != null) {
    int ttl = c.seconds();
    // ...
}
```

のように、実行時に読めます。
このパターンは、Spring、JPA、JUnit など、世の中の Java フレームワークの**主役**です。

---

## SOURCE と RUNTIME の使い分け

「自分でアノテーションを作るとき、どっちを選ぶか?」 ―― この判断軸は単純です。

| やりたいこと | 選択 |
|---|---|
| コンパイラに何か指示したい | **SOURCE** |
| コンパイル時に**コードを生成**したい | **SOURCE** |
| 実行時にリフレクションで**読み取りたい** | **RUNTIME** |
| 両方やりたい | **RUNTIME**（コンパイル時にも読める） |

`RUNTIME` は `SOURCE` の上位互換のようですが、

- `RUNTIME` だと `.class` のサイズが少し増える
- `RUNTIME` だと、リフレクションでの**読み取り可能性**がアプリ全体に露出する

ので、「**読まれる必要がないなら SOURCE のほうがクリーン**」という指針があります。

---

## 「**SOURCE のアノテーションが、コードを生成する**」

ここで、第47章の核心を 1 つ予告しておきます。

> `SOURCE` のアノテーションでも、**コンパイル時にアノテーションプロセッサが起動**し、そこで**追加のソースを生成**できる。
> 生成されたソースは、その後の `javac` で**ふつうのコード**としてコンパイルされる。

つまり、Lombok の `@Data` は、

1. `SOURCE` 保持なので、`.class` には残らない
2. ですが、コンパイル時にプロセッサが起動して、`getName()` などの**メソッドを追加**する
3. 出来上がった `.class` には、`@Data` は残らないが、メソッドはちゃんと入っている

という流れです。
これが、アノテーション処理の最大の魅力 ―― **実行時コストゼロのメタプログラミング**です。

---

## メタアノテーション

アノテーション自身に付ける、メタレベルのアノテーションを **メタアノテーション**と呼びます。
ここまでに出てきた `@Retention`、`@Target`、`@Inherited`、`@Repeatable` ―― すべてメタアノテーションです。

`java.lang.annotation` パッケージに、メタアノテーションは集約されています。

| メタアノテーション | 意味 |
|---|---|
| `@Retention` | 保持期間 |
| `@Target` | 付けられる場所 |
| `@Inherited` | サブクラスに継承するか（クラスのみ） |
| `@Repeatable` | 複数回付けられるか |
| `@Documented` | Javadoc に含めるか |
| `@Native` | ネイティブコードから参照される定数（あまり使わない） |

カスタムアノテーションを宣言するときは、最低限 **`@Retention`** と **`@Target`** をきちんと書く ―― これが基本です。

---

## まとめると

- アノテーションには **3 つの保持期間**: SOURCE / CLASS / RUNTIME
- **SOURCE** ―― コンパイラへの指示、コード生成（`@Override`、Lombok）
- **CLASS** ―― バイトコード解析向け（実例少）、`@Retention` 省略時のデフォルト
- **RUNTIME** ―― リフレクションで読む（フレームワークの主役）
- `RUNTIME` は `SOURCE` の上位互換に見えるが、不要なら `SOURCE` のほうがクリーン
- **SOURCE でもコンパイル時に処理できる** ―― それが第5節のアノテーションプロセッサ

次の節では、JDK が提供する**標準アノテーション**を、一通り眺めていきます。

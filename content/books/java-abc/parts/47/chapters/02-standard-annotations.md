---
title: 標準アノテーションを読む
llm: true
---

## 標準アノテーションを読む

JDK には、いくつかの**標準アノテーション**が用意されています。
これらは「自分で作る」より「**読み解いて意図に従う**」ことが目的です。
この節では、よく登場する 5 つを掘り下げます。

---

## `@Override`

最も身近なアノテーション。**メソッドを上書きしている**ことを宣言します。

```java
class Parent {
    public String hello() { return "parent"; }
}

class Child extends Parent {
    @Override
    public String hello() { return "child"; }
}
```

`@Override` の効果:

1. **メソッド名のタイプミスを検出**: `helo()` と書いたらコンパイルエラー
2. **シグネチャの違いを検出**: 引数の型が違ったらコンパイルエラー
3. **コードの意図を明示**: 「これは親のメソッドを上書きしている」と読み手に伝える

3 つめが特に大事です。`@Override` は**いつでも付けるのが良い習慣**で、IDE もそう警告してくれます。
インタフェースを実装するメソッドにも、Java 6 以降は `@Override` を付けられます。

---

## `@Deprecated`

「**もう使わないでほしい**」メソッド・クラスに付けます。

```java
@Deprecated
public void oldMethod() { ... }

@Deprecated(since = "Java 9", forRemoval = true)
public void veryOldMethod() { ... }
```

- `since`: いつから非推奨か
- `forRemoval`: 将来の削除予定があるか

これを呼ぶと、

```text
warning: oldMethod() in MyClass has been deprecated
```

という警告が出ます。`forRemoval = true` のほうは、より強い警告（**削除予告**）です。

ライブラリの**バージョン進化**を進めるための、合意形成の手段とも言えます。

---

## `@SuppressWarnings`

特定の**警告を抑止**するアノテーション。

```java
@SuppressWarnings("unchecked")
List<String> list = (List<String>) someRawList;
```

「ジェネリクスの未チェックキャストの警告」を黙らせます。
よく使う値は:

| 値 | 何の警告を抑止 |
|---|---|
| `"unchecked"` | ジェネリクスのキャスト警告 |
| `"deprecation"` | 非推奨 API の使用警告 |
| `"rawtypes"` | 生型（`List` を `List<?>` でなく書く） |
| `"all"` | **すべて** ―― 推奨しない |
| `"preview"` | プレビュー機能の使用警告（Java 14+） |

複数指定するなら `{...}` で配列にします:

```java
@SuppressWarnings({"unchecked", "deprecation"})
```

「**警告を黙らせる前に、なぜ警告が出ているか考える**」のが原則です。
納得した上で抑止するならよし、よく分からないまま `@SuppressWarnings("all")` を貼るのは**禁物**です。

---

## `@FunctionalInterface`

「**このインタフェースは関数型インタフェースである**」と宣言するアノテーション（Java 8+）。

```java
@FunctionalInterface
interface Calculator {
    int calc(int x, int y);
}
```

これを付けると、

- **抽象メソッドが 2 つ以上**あったらコンパイルエラー
- ラムダ式・メソッド参照で**実装できる**ことが保証される

`@FunctionalInterface` は、**意図を明示する**役割が大きいです。
誰かが「**もう 1 つ抽象メソッドを足そうかな**」としたとき、コンパイルエラーで止められます。

---

## `@SafeVarargs`

ジェネリクスと可変長引数を組み合わせたときに出る警告（**ヒープ汚染**の可能性）を抑止します。

```java
@SafeVarargs
public static <T> List<T> of(T... args) {
    return List.of(args);
}
```

可変長引数 `T...` は、内部的には `T[]` を作って渡しますが、ジェネリクスの型消去（第46章）と相まって、`Object[]` の罠を作りやすいのです。
**「自分の実装はその罠を踏まない」と宣言するのが `@SafeVarargs`** です。

`static` または `final` メソッドにしか付けられません（オーバーライドできるとセマンティクスが崩れるため）。

---

## モジュール関連: `@Generated`

`javax.annotation.processing.Generated` という、**コード生成ツールが付与する**アノテーションがあります。

```java
@Generated(value = "com.example.MyProcessor", date = "2026-06-24T...")
public class GeneratedThing {
    // ...
}
```

これは、IDE や Lint ツールに「これは**自動生成**だから、リファクタリング対象から外して」と伝える役割を持ちます。
あなたが自前のプロセッサを書くなら、**生成したクラスには `@Generated` を付ける**のが推奨です。

---

## 仮想スレッド時代の `@RestrictedMethod`、`@MustBeClosed`、`@Owning`

最新の Java では、**所有権**や**安全性**に関する新しいアノテーションも検討されています（実装中・先進的）。
本書では「**そういう動きがある**」とだけ紹介します。

| アノテーション | 何を宣言するか |
|---|---|
| `@MustBeClosed` | 戻り値が `AutoCloseable` で、**`close()` を呼ばないと警告** |
| `@RestrictedMethod` | 「制限付き API」へのアクセス（Panama 関連） |

これらが標準化されると、`try-with-resources` の自動付与・リソースリーク防止に役立ちます。
今後の Java 26、27 で追われる領域です。

---

## まとめると

- **`@Override`** ―― 上書きの意図を明示、タイプミスを検出
- **`@Deprecated`** ―― 非推奨を宣言、`forRemoval = true` は削除予告
- **`@SuppressWarnings`** ―― 警告抑止、**理由のないまま使わない**
- **`@FunctionalInterface`** ―― 関数型インタフェースの意図表明
- **`@SafeVarargs`** ―― ジェネリクス + 可変長引数の警告抑止
- **`@Generated`** ―― 自動生成コードのマーキング

これらは「自分でアノテーションを作る前に、まず知っておくべき**標準の語彙**」です。

次の節では、自分で**カスタムアノテーション**を定義する方法を、もう少し深く見ていきます。

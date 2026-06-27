---
title: 用語集 ― この章で学んだ言葉
llm: true
---

## 用語集 ― この章で学んだ言葉

### リフレクション（Reflection）

実行時にクラスの構造（フィールド、メソッド、コンストラクタ、アノテーション）を**覗き・操作する**仕組み。
`java.lang.reflect` パッケージが中心。

### `Class<?>`

クラスそのものを表す型。
JVM 上ではクラスごとに**1 つだけ**存在する。
取得方法は **クラスリテラル・`getClass()`・`Class.forName(...)`** の 3 つ。

### `Field` / `Method` / `Constructor`

それぞれフィールド・メソッド・コンストラクタを表すリフレクションの型。
`Class<?>.getDeclaredXxx()` などで取得する。

### `getXxx` と `getDeclaredXxx` の違い

| `getXxx()` | **public** のみ、**継承**したものも含む |
| `getDeclaredXxx()` | **そのクラスの宣言**のみ、private 含む、継承は**含まない** |

### `Class.forName(name)`

名前からクラスを動的にロードし、**初期化まで**走らせる。
初期化を避けたいときは 3 引数版 `Class.forName(name, false, classLoader)`。

### `setAccessible(true)`

private 要素にリフレクションでアクセスするための呼び出し。
JPMS では、対象パッケージが `opens` されていないと **`InaccessibleObjectException`**。

### `InvocationTargetException`

`Method.invoke` や `Constructor.newInstance` で呼ばれたメソッドが投げる**例外をラップ**する例外。
本当の原因は `getCause()` で取得する。

### `ReflectiveOperationException`

リフレクション系の checked 例外の**共通基底**（`ClassNotFoundException`、`NoSuchMethodException`、`IllegalAccessException`、`InvocationTargetException` の親）。
一括 catch に便利。

### 型消去（type erasure）

ジェネリクスの実引数（`List<String>` の `String`）が、**実行時には消える**仕様。
リフレクションでは、宣言時のジェネリック情報しか取れない。

### アノテーション（Annotation）

クラス・メソッド・フィールドなどに付けるメタデータ。
`@interface` で定義する。

### `RetentionPolicy`

アノテーションの**保持期間**を指定する。

- `SOURCE` ―― ソースのみ、コンパイル時に消える
- `CLASS` ―― `.class` には残る、実行時には読めない
- `RUNTIME` ―― **リフレクションで読める**

### `@Target`

アノテーションを**どこに付けられるか**を制限する宣言。
`METHOD`、`FIELD`、`TYPE`、`PARAMETER`、`TYPE_USE` などを指定。

### `@Inherited`

クラスに付けたアノテーションを、**サブクラスの `getAnnotation` でも見える**ようにする。
フィールド・メソッド・インタフェースには効かない。

### `@Repeatable`

同じアノテーションを**複数回**付けられるようにする宣言。

### `AnnotatedElement`

`Class`・`Field`・`Method`・`Constructor` などが実装する、アノテーション読み取り用のインタフェース。
`getAnnotation(...)`、`isAnnotationPresent(...)`、`getAnnotationsByType(...)` を提供。

### `MethodHandle`

`java.lang.invoke` の動的呼び出しハンドル。リフレクションより**1〜2 桁速い**。
`invokeExact` で最高速。

### `Lookup`

`MethodHandles.lookup()` で取得する**呼び出し権限のチェッカー**。
ふつうのコードから見える範囲だけを発見できる。

### `MethodType`

`MethodHandle` の引数・戻り値の型を表す不変オブジェクト。
バイトコードの**メソッドディスクリプタ**と情報的に等価。

### `invokeExact`

`MethodHandle` の最速の呼び出し方法。引数と戻り値の型が**完全一致**必須。

### `invokedynamic`

JVM のバイトコード命令で、**実行時にメソッドハンドルを解決**して呼び出す。
ラムダ式・文字列連結・switch パターンマッチングの実装に使われている。

### `Proxy`

`java.lang.reflect.Proxy` で、**インタフェースを実装する動的クラス**を実行時に作る仕組み。
Spring AOP、Hibernate の遅延ロード、JDBC ドライバなどで使われる。

### `InaccessibleObjectException`

JPMS の `opens` がなく、`setAccessible(true)` が失敗したときに投げられる例外。
対処は、対象モジュールの `opens` 宣言、または `--add-opens` の起動オプション。

### `LambdaMetafactory`

Java のラムダ式の**実体を実行時に生成**する内部ライブラリ。
`invokedynamic` と組み合わせて、ラムダを効率的に動かす。

---

これで第46章の用語整理は終わりです。
リフレクションは、Java の動的な顔を扱う、強力で危険な道具立てでした。
**「業務コードでは使わず、フレームワーク経由で利用する**」 ―― これが本書の結論です。

次の第47章では、リフレクションの**コンパイル時版**にあたる ―― **アノテーション処理**を扱います。

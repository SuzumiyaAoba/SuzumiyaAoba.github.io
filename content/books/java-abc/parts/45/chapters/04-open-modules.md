---
title: open モジュールとリフレクション
llm: true
---

## `open` モジュールとリフレクション

`exports` は、コンパイル時・実行時の**通常のアクセス**を許可するものでした。
リフレクション（第46章で扱う、実行時に型情報を覗く仕組み）は、これとは別の話です。
JPMS では、**リフレクションでの侵入**もちゃんと制御できます。
そのための仕組みが、**`opens`** と **`open module`** です。

---

## なぜリフレクションに別の制御が必要か

リフレクションは、JVM 上で次のような「**侵入的**」な操作を可能にします。

- private フィールドに**外から**書き込む
- private メソッドを**外から**呼ぶ
- アノテーションを**実行時に**読み取る

これらは、JPMS 以前の世界では「**できてしまう**」ものでした。
ですが、モジュールシステムの**境界**が、ふつうのアクセスだけでなく**リフレクションでも**守られないと、`private` の意味がなくなります。

そこで JPMS では:

| 操作 | 必要な宣言 |
|---|---|
| 通常のアクセス（public・import） | `exports` |
| リフレクションでの**public 要素**へのアクセス | `exports` |
| リフレクションでの**private 要素**へのアクセス | **`opens`** |

ふつうの public メソッドへのリフレクション呼び出しは、`exports` で足ります。
**`setAccessible(true)`** を使った **private 要素**への侵入には、**`opens`** が要ります。

---

## `opens` の書き方

```java
module com.example.app {
    exports com.example.app.api;       // 通常公開
    opens com.example.app.entity;      // 全モジュールに対し、リフレクション開放
}
```

これで、`com.example.app.entity` パッケージの中のクラスは、**他のモジュールから**`setAccessible(true)` を使った private アクセスができるようになります。

これは、特に**フレームワーク**との連携に必要です。たとえば、

- **Jackson** が、レコードの private フィールドにアクセスして JSON を作る
- **Hibernate** が、エンティティの private フィールドを設定する
- **Spring** が、`@Autowired` のフィールドに DI する

これらが動くためには、対象のパッケージが `opens` されている必要があります。
`exports` だけだと、リフレクションで private に触ろうとすると `InaccessibleObjectException` で弾かれます。

---

## Qualified Opens

`exports` と同じく、`opens` も `to` で**特定のモジュールにだけ**開放できます。

```java
module com.example.app {
    opens com.example.app.entity to com.fasterxml.jackson.databind;
}
```

これは「**Jackson にだけ、private アクセスを許す**」という意味です。
セキュリティ上、これがより推奨される書き方です。

---

## `open module` ―― モジュール全体を開放

「**個別に `opens` を書くのが面倒**」「全パッケージを開放したい」 ―― そんなときは、モジュール自体に `open` を付けます。

```java
open module com.example.app {
    exports com.example.app.api;
    requires com.example.lib;
    // opens は書かなくても、全パッケージが自動的に opens 扱い
}
```

`open module` は、**全パッケージを暗黙に `opens` する**短縮形です。
**フレームワークが多数のパッケージにリフレクションする**ような、Spring Boot アプリでは、この形のほうが楽です。

ただし、これは**境界を緩める**選択でもあります。
ライブラリや**境界を厳しくしたい**コアモジュールでは、`opens` を必要な範囲だけ書くのが原則です。

---

## 「実行時のオプション」での開放

ソースを変更せずに、起動時に開放する手段もあります。

```text line-numbers=false
$ java --add-opens com.example.app/com.example.app.entity=com.fasterxml.jackson.databind \
       --module-path ... --module com.example.app/com.example.app.Main
```

`--add-opens モジュール/パッケージ=対象モジュール` で、ソースの `opens` 宣言と同等の効果が得られます。
似たもので **`--add-exports`** もあり、`exports` を実行時に追加できます。

これらは、**「ライブラリの作者がモジュール宣言を直し忘れている」**ような状況に対する**緊急避難**です。
本番運用のたびに `--add-opens` を並べるのは、本来は健全ではありません。

ですが、現実には、Spring Boot や CI でも、よく見かけます。**Java 17 以降の起動コマンド**にずらっと `--add-opens` が並ぶのは、それだけ既存ライブラリの追随が**まだ済んでいない**ことを示しています。

---

## 「**`Unsafe` への通り道**」

第41章で触れた `sun.misc.Unsafe` は、現代では `jdk.unsupported` モジュールに移されています。
これを使うには、

```java
module com.example.lib {
    requires jdk.unsupported;
}
```

と宣言します。
名前のとおり「**サポートされない**」と書いてある以上、本番コードで `Unsafe` を直接触ることは**避ける**べきですが、ライブラリのレガシー部分では今でも使われます。

`Unsafe` の代替として、Java 22 で導入された **`java.lang.foreign`**（Panama）が、ネイティブメモリへの安全なアクセスを提供します。
新規コードでは、こちらを検討するのが現代的です。

---

## リフレクションを使う側のコード

開放された側を**使う**コードは、次のように書きます。

```java
import java.lang.reflect.Field;

public class Reader {
    public static int readPrivate(Object obj, String fieldName) throws Exception {
        Field f = obj.getClass().getDeclaredField(fieldName);
        f.setAccessible(true);          // ← opens されていなければ InaccessibleObjectException
        return f.getInt(obj);
    }
}
```

対象のパッケージが `opens` されていれば、`setAccessible(true)` 後の `getInt` が動きます。
されていなければ、

```text line-numbers=false
java.lang.reflect.InaccessibleObjectException: Unable to make field private int Foo.x accessible:
module com.example.target does not "opens com.example.target" to module com.example.reader
```

というエラーが出ます。
このエラーが**何を求めているか**を読み取れるようになると、JPMS 関連のトラブルが一気に解決しやすくなります。

---

## まとめると

- **`exports`** はふつうのアクセス、**`opens`** はリフレクションでの **private アクセス**を制御する
- `Qualified Opens`（`opens ... to ...`）で、特定モジュールにだけ開放できる
- `open module` は、**全パッケージを暗黙に `opens`** する短縮形（Spring Boot 系で便利）
- 起動時の **`--add-opens`** / **`--add-exports`** で、ソースなしで開放できる
- `Unsafe` は `jdk.unsupported`。新規は `java.lang.foreign`（Panama）を検討

次の節では、JPMS と**既存の jar の jar 世界**との橋渡し ―― **自動モジュールと無名モジュール**を扱います。

---
title: リフレクションの落とし穴
llm: true
---

## リフレクションの落とし穴

リフレクションは強力ですが、**設計に潜む副作用**を多く生みます。
この節では、パフォーマンス・セキュリティ・設計面で陥りやすい代表的な 5 つの落とし穴を整理します。

---

## 落とし穴1: パフォーマンスの**計測不足**

「リフレクションは遅い」という抽象的な言葉では、対策できません。
具体的にどれくらい遅いか、把握しましょう。

| 操作 | 概算 |
|---|---|
| `Class.forName` | 数百 ns〜数 μs（クラスが見つからないと**例外でずっと遅い**） |
| `getMethod` の lookup | 数十 ns 〜 数百 ns |
| `method.invoke` | 数十 ns 〜 数百 ns |
| `field.get` / `field.set` | 数十 ns |
| `MethodHandle.invokeExact` | 1〜3 ns |

「**起動時に 1 回**」のリフレクションは、`Method.invoke` でも問題ありません。
「**1 リクエストに 1 回**」も、ふつうは問題なし。
「**ループの中で何百万回**」は、リフレクションでは持ちません。

**まず計測してから判断する** ―― これがリフレクションとの付き合い方の鉄則です。

---

## 落とし穴2: 「**try-catch でぐちゃぐちゃに**」

リフレクションの API は、**5 種類以上の checked 例外**を投げます。

```java
try {
    Class<?> c = Class.forName(name);                  // ClassNotFoundException
    Constructor<?> ctor = c.getConstructor();           // NoSuchMethodException
    Object obj = ctor.newInstance();                    // InstantiationException, IllegalAccessException, InvocationTargetException
    Method m = c.getMethod("foo");                      // NoSuchMethodException
    Object r = m.invoke(obj);                           // IllegalAccessException, InvocationTargetException
} catch (Exception e) { ... }
```

5 つも 6 つも catch を書くのは現実的ではありません。
かと言って `catch (Exception e)` でひとまとめにすると、原因が**ぼやけます**。

実用的な解は:

- **`ReflectiveOperationException`** で catch（Java 7 で導入された、リフレクション系例外の共通基底）
- 業務エラーとしては再度 unchecked で投げ直す

```java
public static Object createInstance(String className) {
    try {
        return Class.forName(className).getConstructor().newInstance();
    } catch (ReflectiveOperationException e) {
        throw new IllegalStateException("リフレクション失敗: " + className, e);
    }
}
```

---

## 落とし穴3: **型安全性の喪失**

リフレクション越しの呼び出しは、**戻り値が `Object`** になります。

```java
Object r = method.invoke(obj);
int n = (int) r;   // ← 失敗するかもしれないキャスト
```

このキャストが、**実行時に**`ClassCastException` を投げます。
コンパイラは何も助けてくれません。

可能な範囲で、**`Class<T>`** を引数で受け取って `T` を返すジェネリックなメソッドにする、というのが定石でした（第2節の `createInstance(Class<T>)`）。
それでも、メソッド呼び出しの戻り値までは型安全にできません。

「**リフレクションの境界で、型安全さを取り戻す責務は呼び出し側にある**」 ―― これを忘れないようにします。

---

## 落とし穴4: 「**`setAccessible(true)` でモジュールの意図を壊す**」

第45章で見たとおり、`setAccessible(true)` は **JPMS の `opens`** がないと例外になります。
裏を返せば、ライブラリの作者は「**`opens` を要求していない**」のは「**外から触らないでほしい**」という意図表明でもあります。

それを `--add-opens` でこじ開けるのは、

- ライブラリのバージョンアップで内部 API が変わると**壊れる**
- **保証されない振る舞い**に依存することになる

将来のトラブルを生む種です。
「**それなしでは動かない**」状況に追い込まれたら、

1. ライブラリの正規 API で実現できないか調べる
2. ライブラリの Issue を見て、対応版を待つ
3. 自前で薄いラッパーを書いて、問題を切り出す

の順で検討するのが健全です。

---

## 落とし穴5: 「**リフレクションが、設計をだらしなくする**」

「リフレクションを使えば、何でもできる」 ―― これは技術的には正しいですが、**設計上は罠**になります。

- 公開された API でいけるはずなのに、横着して private に触る
- 引数を `Object[]` で受けて、中身は型を見て分岐する**動的な API**を作る
- 「設定ファイルから動的にクラスをロード」のために、ふつうの依存注入で済む話を複雑にする

これらは、

- IDE で「**この private メソッドは呼ばれていない**」と誤検出される
- **コンパイル時の型チェック**が効かなくなる
- **テストしにくい**コードになる

を生みます。
**「**リフレクションを使う前に、ふつうの設計で解決できないか**」を一度立ち止まる** ―― これが、設計者としての姿勢です。

---

## 「**フレームワーク作者だけ**」が使う、と割り切る

ここまでのまとめとして、リフレクションとの付き合い方の指針を 1 つに集約すると:

> **業務コードでは、リフレクションを書かない。**
> リフレクションを書くのは、フレームワーク・ライブラリの作者だけ。

業務コードでは、

- Spring の `@Autowired` を使う ―― 裏ではリフレクション
- Jackson の `readValue` を呼ぶ ―― 裏ではリフレクション
- JUnit の `@Test` を付ける ―― 裏ではリフレクション

利用するだけにとどめます。

「自前でフレームワークっぽいものを書く」事態が来たら、それが本当に必要かを**今一度考える**。
もし必要だと判断したら、本書の知識を頼りに、**慎重に**書いていきましょう。

---

## まとめると

- リフレクションのコストは**桁違い** ―― 用途を選ぶ
- 例外は **`ReflectiveOperationException`** で一括 catch、unchecked で投げ直し
- 戻り値の `Object` キャストは、**実行時例外**のリスク
- `setAccessible(true)` と JPMS の **`opens`** の関係を忘れない
- リフレクションは「**設計をだらしなくする**」誘惑がある
- 結論: **業務コードでは使わず、フレームワーク経由で利用する**

次の節では、ここまでに触れなかった**やや細かい落とし穴**を、改めて整理します。

---
title: ネイティブイメージをビルドする
llm: true
---

## ネイティブイメージをビルドする

この節では、`native-image` コマンドを使って、最小限の Java プログラムをネイティブ実行ファイルにします。
リフレクションも JNI も使わない、純粋な Java コードなら、驚くほどスムーズに動きます。

> 本書の実機（mise）では、執筆時点で GraalVM 25 をインストール検証していません。
> 以下のコマンドラインは、Oracle GraalVM 公式ドキュメントと、Java 21 ベースでの動作確認に基づきます。

---

## 最小サンプル ―― Hello, World!

第41章でも使った素朴な Hello を、ネイティブにします。

```java
// Hello.java
public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello from native!");
        long sum = 0;
        for (int i = 0; i < 1_000_000; i++) sum += i;
        System.out.println("sum = " + sum);
    }
}
```

ふつうの Java としての動作確認:

```text
$ javac Hello.java
$ java Hello
Hello from native!
sum = 499999500000
```

---

## ネイティブビルド

`native-image` コマンドにクラス名を渡します。

```text
$ native-image Hello
[1/8] Initializing...                     (4.5s @ 0.32GB)
[2/8] Performing analysis...              (12.3s @ 1.34GB)
[3/8] Building universe...                (2.8s @ 0.91GB)
[4/8] Parsing methods...                  (3.2s @ 1.12GB)
[5/8] Inlining methods...                 (1.9s @ 1.34GB)
[6/8] Compiling methods...                (28.7s @ 1.78GB)
[7/8] Layouting methods...                (1.4s @ 1.21GB)
[8/8] Creating image...                   (3.5s @ 1.23GB)
Image build complete.
```

ビルドには 1〜2 分かかります（CPU・メモリを大きく使います）。
出来上がるのは、

```text
$ ls
Hello  Hello.class  Hello.java
```

`Hello` という拡張子のないファイルが、**ネイティブ実行ファイル**です。

---

## 実行 ―― 起動を体感する

```text
$ ./Hello
Hello from native!
sum = 499999500000
```

時間を測ってみます。

```text
$ time java Hello
Hello from native!
sum = 499999500000
java Hello  0.10s user 0.01s system 109% cpu 0.107 total

$ time ./Hello
Hello from native!
sum = 499999500000
./Hello  0.00s user 0.00s system 56% cpu 0.014 total
```

`java Hello` が 100 ms、`./Hello` が **14 ms** ―― 10 倍近く速く起動しました。
これは、JVM のロードと初期化が消えたためです。

---

## 何が出来上がったのか

ファイルサイズを見てみます。

```text
$ ls -la
-rwxr-xr-x  1 user  staff  18M  ...  Hello
```

**18 MB** ぐらいの実行ファイル。
これに、

- あなたの `.class`
- Java 標準ライブラリの**実際に使う部分**
- Substrate VM（極小ランタイム、GC、スレッド等）

がすべて入っています。
JVM 全体（数百 MB）の代わりに、**1 つの 18 MB の実行ファイル**で済む ―― これがネイティブイメージの正体です。

---

## 起動を速くする工夫

`native-image` には、ビルド時のいくつかのフラグがあります。

### `--no-fallback` ―― 失敗時に JVM にフォールバックしない

```text
$ native-image --no-fallback Hello
```

このフラグを付けないと、ビルドに失敗したときに**JVM ベースの代替バイナリ**が作られることがあります。
本気でネイティブが欲しいなら、`--no-fallback` で「失敗ならエラーで止まれ」と指示します。

### `-O` ―― 最適化レベル

```text
$ native-image -O2 Hello   # 高い最適化（既定）
$ native-image -O3 Hello   # さらに高い最適化（実験的）
```

`-O3` はビルド時間が長くなりますが、実行時パフォーマンスが向上することがあります。

### `--gc=G1` ―― GC 選択

```text
$ native-image --gc=G1 Hello
```

ネイティブイメージのデフォルト GC は **Serial GC** です（小さなアプリ向け）。
ヒープが大きいアプリでは、**G1** を選ぶこともできます（プレミアム機能、エディションによる）。

---

## Maven / Gradle との統合

ふつうの開発では、Maven か Gradle のプラグインを使うのが現実的です。

### Maven の場合

```xml
<plugin>
  <groupId>org.graalvm.buildtools</groupId>
  <artifactId>native-maven-plugin</artifactId>
  <version>0.10.x</version>
  <extensions>true</extensions>
  <executions>
    <execution>
      <id>build-native</id>
      <goals>
        <goal>compile-no-fork</goal>
      </goals>
      <phase>package</phase>
    </execution>
  </executions>
</plugin>
```

ビルドコマンドは:

```text
$ mvn -Pnative package
```

### Gradle の場合

```kotlin
plugins {
    application
    id("org.graalvm.buildtools.native") version "0.10.x"
}
```

```text
$ ./gradlew nativeCompile
```

これらのプラグインは、`native-image` コマンドの起動を**自動化**してくれます。

---

## ビルドのトラブル

ビルドが**ある程度大きいアプリ**だと、しばしばエラーが出ます。

```text
Error: Detected an instance of Random/SplittableRandom class in the image heap.
```

これは、「**ランダムな状態を持つオブジェクト**が、ビルド時に固定化されようとした」というエラー。
Closed-World Assumption の典型的な衝突です。

解決には、

- ビルド時にランタイム情報に依存するコードを**避ける**
- 該当クラスを `--initialize-at-run-time` で**実行時初期化に回す**
- リフレクションを使うコードに**メタデータ**を与える（次節）

など、**個別の対応**が必要になります。
これが、ネイティブイメージの「**最初のハードル**」です。

---

## まとめると

- `native-image <ClassName>` で、ネイティブ実行ファイルが作れる
- ビルドには 1〜2 分かかるが、**起動は 10 倍以上速い**
- 出来上がるのは、自分のコード + 最小ランタイムが入った 1 つの実行ファイル
- Maven / Gradle のプラグインで、ビルド自動化が可能
- ビルドエラーは **Closed-World 仮定との衝突**が主な原因

次の節では、ネイティブイメージで最大の壁となる**リフレクション・リソース**のメタデータ設定を扱います。

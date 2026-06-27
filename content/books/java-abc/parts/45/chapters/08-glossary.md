---
title: 用語集 ― この章で学んだ言葉
llm: true
---

## 用語集 ― この章で学んだ言葉

### JPMS（Java Platform Module System）

Java 9 で導入された、モジュール単位でコードを組み立てる仕組み。

### モジュール（module）

複数のパッケージを束ね、**公開・依存・リフレクション開放**を宣言する単位。
`module-info.java` で定義する。

### `module-info.java`

モジュールのメタ宣言を書くファイル。
モジュールのルートに置き、**1 モジュール 1 ファイル**。

### `exports`

このモジュール内のパッケージを、**他のモジュールから** import 可能にする宣言。
`exports ... to ...` で**特定モジュールにだけ**公開できる（**Qualified Export**）。

### `requires`

このモジュールが**依存する**モジュールを宣言する。

### `requires transitive`

依存を、**このモジュールの利用者にも**伝える宣言。
公開 API に出てくる型のモジュールには、ほぼ常に付ける。

### `requires static`

**コンパイル時のみ**依存する宣言。実行時には不要。
アノテーションや、オプショナル機能で使う。

### `opens`

このパッケージを、**リフレクションで** private アクセス可能にする宣言。
`opens ... to ...` で特定モジュールにだけ開放できる。

### `open module`

モジュール全体を `opens` する短縮形。Spring Boot 系のアプリでよく使う。

### `uses` / `provides`

**ServiceLoader** を JPMS に統合した宣言。
`uses` で使うサービスを、`provides` で実装を宣言する。

### `--module-path` / `-p`

クラスパスの代わりに、**モジュールパス**として jar や `.class` を渡すオプション。
モジュールパスにある jar が**モジュール**として扱われる。

### `--module` / `-m`

実行時に「**起動モジュール**」を指定するオプション。
`--module モジュール名/メインクラス` の形で書く。

### 自動モジュール（Automatic Module）

`module-info.class` を**持たない jar** を **`--module-path`** に置いたときに、自動でモジュールとして扱われるもの。
すべてのパッケージを `exports` / `opens` した状態。
名前は `Automatic-Module-Name` または jar ファイル名から決まる。

### 無名モジュール（Unnamed Module）

`-cp` または `-classpath` に置かれた jar は、まとめて 1 つの**無名モジュール**として扱われる。
従来のクラスパス世界そのもの。

### `Automatic-Module-Name`

jar の `MANIFEST.MF` に書く、**自動モジュール用の正式名**。
ライブラリ作者が「**こう呼んでほしい**」と宣言する。

### Split Package

**同じパッケージ名**を、複数のモジュールが提供している状態。
JPMS では**禁止**され、起動時にエラー。

### 読み取り関係（readability） / アクセシビリティ（accessibility）

- **読み取り** ―― `requires` で宣言した依存関係
- **アクセシビリティ** ―― `exports` で許可された公開
- 両方が成立して、はじめて他モジュールのクラスが**使える**。

### `--add-opens`

実行時のオプションで、**ソースを変えずに `opens` を追加**する。
`--add-opens モジュール/パッケージ=対象モジュール` の形。

### `--add-exports`

実行時のオプションで、**`exports` を追加**する。
`--add-exports モジュール/パッケージ=対象モジュール` の形。

### `--add-modules`

実行時に**読み込むモジュール**を追加する。
たとえば `--add-modules jdk.unsupported` で `sun.misc.Unsafe` が見える。

### `jlink`

JPMS を活用して、自分のアプリに**必要なモジュールだけ**を含むカスタム JDK を作るツール。
**コンテナサイズの削減**に有効。

### `jpackage`

`jlink` の上に、OS ネイティブのインストーラ（`.msi`、`.dmg`、`.deb` など）を作るツール。
デスクトップアプリの配布に便利。

### `InaccessibleObjectException`

リフレクションで**`opens` されていない**パッケージに `setAccessible(true)` で侵入しようとして弾かれた、というエラー。

### `jdk.unsupported`

`sun.misc.Unsafe` を含む、サポートされない JDK 内部 API を集めたモジュール。
明示的に `requires jdk.unsupported` か `--add-modules` で取り込む。

### `java.lang.foreign`（Panama）

Java 22 で導入された、ネイティブメモリへの**安全なアクセス API**。
`sun.misc.Unsafe` の**現代版の代替**。

---

これで第45章の用語整理は終わりです。
次の第46章では、JPMS の `opens` 宣言が守る対象である**リフレクション**と、その**高速な代替**である **MethodHandle** を扱います。

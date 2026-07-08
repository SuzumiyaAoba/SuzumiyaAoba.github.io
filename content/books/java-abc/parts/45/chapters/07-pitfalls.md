---
title: よくあるつまずき
llm: true
---

## よくあるつまずき

JPMS は、概念的にはきれいですが、現実世界の jar とぶつかると**さまざまな摩擦**が起きます。
ここでは、現場で遭遇する 6 つの典型を整理します。

---

## つまずき1: 「`InaccessibleObjectException`」

```text line-numbers=false
java.lang.reflect.InaccessibleObjectException: Unable to make field private java.lang.String
    com.example.Foo.x accessible: module com.example.target does not "opens com.example.target"
    to unnamed module @1234abcd
```

リフレクションで private にアクセスしようとして、`opens` がないために弾かれたエラーです。
対処は 3 段階で考えます。

1. **モジュール宣言を直す**: 自分のモジュールなら、`opens com.example.target;` を追加
2. **`--add-opens` を起動オプションに渡す**: ライブラリ側を直せないとき
3. **設計を見直す**: 本当にリフレクションが必要か?（多くの場合、レコード + Jackson などで解決）

ライブラリの **Issue を見て**、対応版が出ていないかも確認しましょう。

---

## つまずき2: 「`NoClassDefFoundError`」at runtime

JPMS のはずなのに、実行時にクラスが見つからない ―― これは、**モジュールパスとクラスパスの混乱**が原因のことが多いです。

- 依存を `--module-path` に置くべきか、`-cp` に置くべきか
- `module-info` を書いたが、依存元が `requires` を書き忘れている

`java --show-module-resolution` を起動オプションに渡すと、

```text line-numbers=false
root com.example.app
 com.example.app -> java.base
 com.example.app -> com.example.lib
 ...
```

のような**モジュール解決の様子**が出力されます。
「期待していたのに来てない」モジュールが、ここで見つかります。

---

## つまずき3: 「Split Package」エラー

```text line-numbers=false
Module com.example.a contains package com.example.shared,
module com.example.b exports package com.example.shared to module ...
```

同じパッケージを 2 つのモジュールが含もうとして弾かれた、というエラー。
代表的なケース:

- 古い `javax.annotation` 関連の jar が、複数の依存に間接的に入っている
- 大規模アプリで、**ライブラリ A の internal が、ライブラリ B でもコピーされて入っている**

対処は、

1. **どちらか片方の jar を排除**する（Maven の `<exclusions>` など）
2. **パッケージ名を変える**（自分のコードなら）

依存グラフを `mvn dependency:tree` で見て、犯人を探します。

---

## つまずき4: 「自動モジュールの名前が長くて違和感」

`module-info.java` を書いていない jar をモジュールパスに置くと、jar 名から名前が推測されます。

- `spring-core-6.0.0.jar` → `spring.core`（`Automatic-Module-Name` が設定済み）
- `commons-lang3-3.12.jar` → `org.apache.commons.lang3`
- `foo-bar-baz-1.0.jar` → `foo.bar.baz`

これらの推測名は、**ライブラリのバージョンアップ**で**変わることがあります**（`Automatic-Module-Name` が後付けされたなど）。
変わると、**`requires`** で書いていた名前と合わなくなり、**動かなくなります**。

対策は、

- 自分が `requires` する自動モジュールは、**できれば `Automatic-Module-Name` 設定済みの**バージョンを選ぶ
- バージョンアップ時には、**自動モジュール名の変更**を確認する

---

## つまずき5: 「Spring Boot で JPMS が動かない」

「**Spring Boot で `module-info.java` を書こうとしたら、何もかも壊れた**」 ―― 実際よくあります。

理由は:

- Spring が**多くのパッケージにリフレクション**するため、`opens` が大量に必要
- `spring-boot-maven-plugin` の **`repackage` ゴール**が、fat jar を作るときにモジュール構造を壊す
- Auto-Configuration 系のクラススキャンが、モジュール境界と相性が悪い

Spring Boot で JPMS をやる現実的な解は、

- アプリ自体は `module-info.java` を**書かない**（クラスパス／無名モジュール）
- ライブラリだけは JPMS 化する
- 必要な `--add-opens` は、**Spring Boot 自身がデフォルトで設定**してくれる

これだけで、JDK モジュール化の恩恵は受けつつ、JPMS の摩擦は最小限になります。

---

## つまずき6: 「**`--add-opens` だらけのコマンドライン**」

本番のコマンドラインに、こんなのが並んでいるアプリを見たことがあるでしょう。

```text line-numbers=false
$ java \
  --add-opens java.base/java.lang=ALL-UNNAMED \
  --add-opens java.base/java.util=ALL-UNNAMED \
  --add-opens java.base/java.nio=ALL-UNNAMED \
  ... \
  -jar app.jar
```

`--add-opens` は、本来は**緊急避難**として用意されたものです。
これが大量に並んでいるのは、ライブラリが**JDK 内部 API に深く依存**しているサインです。

長期的には:

- ライブラリのアップデートで、より新しい API（`java.lang.foreign` など）に移行
- 古いライブラリは入れ替えを検討

短期的には、`--add-opens` を**スクリプトに集約**して、起動コマンドラインを汚さない工夫をします。

---

## まとめると ―― 4 つの心得

JPMS との付き合い方を、4 つの心得にまとめます。

1. **「全部 JPMS 化」を目指さない**。目的に応じて選ぶ
2. `InaccessibleObjectException` を**読み解く** ―― 対象モジュールと必要な `opens` が書いてある
3. **自動モジュール名の変化**に注意 ―― バージョンアップ時に確認
4. **`--add-opens` だらけ**は、依存の見直しサイン

JPMS は、Java 9 で導入されてから**まだ進化中**の仕組みです。
今後、ライブラリ側の対応が進むにつれて、もっと使いやすくなるはずです。
焦らず、**境界の知識**だけは今のうちに身に付けておきましょう。

次の節「用語集」で本章の言葉を整理し、第46章では、JPMS の**`opens`** と密接に関わる **リフレクションと MethodHandle** を扱います。

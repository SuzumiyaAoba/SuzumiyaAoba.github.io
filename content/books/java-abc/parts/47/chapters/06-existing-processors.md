---
title: 既存のプロセッサ ― Lombok・MapStruct
llm: true
---

## 既存のプロセッサ ― Lombok・MapStruct

世の中で広く使われているアノテーションプロセッサは、大きく **2 派**あります。

- **Lombok** ―― **既存のクラスにメソッドを追加**するタイプ
- **MapStruct**・**JavaPoet 系** ―― **新しいクラスを生成**するタイプ

それぞれ哲学が違います。代表例を見ていきましょう。

---

## Lombok ―― 「**ボイラープレートを消す**」

Lombok は、最も有名な Java のメタプログラミングライブラリでしょう。
`@Data`、`@Builder`、`@Slf4j`、`@RequiredArgsConstructor` ... これらを付けるだけで、ふつうのコードで何十行も必要だったボイラープレートが**消えます**。

```java
@Data
@Builder
public class User {
    private final String name;
    private final int age;
}
```

これだけで、

- `getName()` / `getAge()`
- `equals` / `hashCode` / `toString`
- ビルダー: `User.builder().name("Alice").age(30).build()`

がすべて使えます。

### Lombok の**ちょっとずるい**仕組み

第5節で見たアノテーションプロセッサは、「**新しい `.java` を生成**」しました。
Lombok は、これとは違います。

> Lombok は、**コンパイル中の AST（抽象構文木）を直接書き換え**ます。

つまり、`javac` の内部 API（`com.sun.tools.javac.tree.*`）に**侵入**して、

- `User` クラスに `getName()` メソッドを**直接追加**
- フィールドへの `final` 修飾を**書き換え**
- などをやってのけます

これは「**標準のアノテーション処理 API ではできない**」ことです。
Lombok はそのために、**`-javaagent`** や internal API への `--add-opens` を要求します。
このトリッキーさのおかげで、

- 既存クラスに直接メソッドを生やせる（新クラス生成ではない）
- IDE のエディタ上でも、生成メソッドが**呼び出せる**ように見える

という利便性が得られる一方、

- **JDK のバージョンアップで壊れることがある**
- **IDE プラグインが必要**（IntelliJ・Eclipse 向けに別途）
- **デバッグ時に「ない」はずのメソッドにステップインする**

という、独特の癖もあります。

### `record` で代替できる範囲

Java 14 で導入された **`record`** は、Lombok の `@Data` の典型用途を**標準言語機能**で置き換えました。

```java
public record User(String name, int age) { }
```

これで `getName()`（実際は `name()`）、`equals`、`hashCode`、`toString` がすべて自動生成されます。
`@Data` を使っていたコードの多くは、`record` で書けるようになりました。

ただし、

- `@Builder` ―― `record` にはない
- 可変な POJO ―― `record` は不変なので合わない
- 既存ライブラリ（古い Spring など）が `@Data` 前提 ―― 移行コストあり

これらの理由から、Lombok を完全には捨てきれないチームも多いです。
新規プロジェクトでは、`record` を**第一選択**にする方向が現代的です。

---

## MapStruct ―― 「**変換コードを書かせない**」

ドメイン層とプレゼンテーション層のあいだで、

- `User` → `UserDto`
- `UserDto` → `User`

のようなオブジェクト変換を書く ―― これが本当に面倒。
**MapStruct** は、これを**自動生成**してくれるアノテーションプロセッサです。

```java
@Mapper
public interface UserMapper {
    UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);

    UserDto toDto(User user);
    User toEntity(UserDto dto);
}
```

これを書くだけで、`UserMapper` の**実装クラス**（`UserMapperImpl`）が、コンパイル時に**生成**されます。

```java
// 自動生成された UserMapperImpl
public class UserMapperImpl implements UserMapper {
    @Override
    public UserDto toDto(User user) {
        if (user == null) return null;
        UserDto dto = new UserDto();
        dto.setName(user.getName());
        dto.setAge(user.getAge());
        return dto;
    }
    // ...
}
```

ふつうの Java コードとして生成されるので、

- **デバッグできる**
- **JIT 最適化が効く**
- **リフレクション不要**

という、コンパイル時生成の良さを全て享受できます。
仮想スレッドや大規模システムで、変換コードのオーバーヘッドが目立つようになった今、MapStruct のような**コンパイル時マッパー**の価値はむしろ高まっています。

---

## 「**コード生成系**」のその他

Java の世界には、コード生成系のライブラリがほかにもたくさんあります。

| ライブラリ | 何を生成するか |
|---|---|
| **Immutables** | レコードの先祖。不変オブジェクト + Builder |
| **AutoValue** | Google 製、Immutables と似た不変オブジェクト |
| **Dagger** | Google 製の DI コンテナ ―― **コンパイル時**に DI グラフを解決 |
| **Hilt** | Android 向けの Dagger ラッパー |
| **JOOQ** | DB スキーマから、型安全な SQL DSL を生成 |
| **gRPC** | `.proto` から、Java の通信コードを生成 |

これらすべてが、アノテーションプロセッサか、それに**準じる仕組み**でコードを生成しています。
**「定形コードは、人間に書かせず、機械に書かせる」**――現代の Java は、この方向に明確に進んでいます。

---

## 「**Lombok か `record` か**」の判断

新規プロジェクトでの選択について、現実的な指針を 1 つ:

| 状況 | 推奨 |
|---|---|
| 新規・データ転送向け | **`record`**（言語標準なのが強い） |
| 新規・複雑なドメインオブジェクト | **`record`** + 必要なら自前メソッド |
| 既存コード・大量の `@Data` がある | Lombok 維持 |
| ビルダーが必要 | Lombok の `@Builder`、または手書き |
| `@Slf4j` のような便利機能を使いたい | Lombok を選ぶのもアリ |

「Lombok の `@Data` を **`record`** で置き換える」 ―― この移行を進めるだけで、

- JDK バージョンアップでの破壊リスクが減る
- IDE 設定が簡素化される
- 新規参画メンバーの**学習コスト**が下がる

という具体的なメリットがあります。

---

## まとめると

- **Lombok** ―― 既存クラスに**メソッドを追加**する（標準でないやり方）
- **MapStruct** ―― 新しい**変換クラスを生成**する（標準的やり方）
- **`record`** は、Lombok の `@Data` の典型用途を**言語標準**で置き換える
- コード生成系には、`Dagger`、`JOOQ`、`gRPC` など、多くの選択肢がある
- 「**人間が書かなくていいコード**」は、**機械に書かせる**のが現代の方向

次の節では、ここまでで触れきれなかったアノテーション処理の**よくあるつまずき**を整理します。

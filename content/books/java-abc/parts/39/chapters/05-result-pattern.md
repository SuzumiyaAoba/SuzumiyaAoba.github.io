---
title: Result 型と Optional
llm: true
---

## Result 型と Optional

ここまでは、エラーを**例外**で扱う方針で進めてきました。
ですが、すべてのエラーが例外向きとは限りません。

> 「**例外を投げる**」のは、本来、**例外的**な状況にこそ似合う

という考え方があります。
「**よく起きるエラー**」を例外で表現すると、

- フロー制御が**例外で行われる**ことになり、読みにくい
- パフォーマンスが**少し悪化**する（スタックトレースの生成は重い）
- **`@Transactional` のロールバック**が、意図せず発火することがある

ので、別の手段を選んだほうがよい場面もあります。
そのときに使うのが、**`Optional<T>` を返す**書き方と、**Result 型**です。

---

## `Optional<T>` で「失敗かもしれない値」を返す

第24章で学んだ `Optional<T>` は、「**結果があるかもしれないし、ないかもしれない**」を表す型でした。

```java
Optional<User> findById(long id);
```

「見つからない」は、例外を投げるほどのことではない、**ふつうの結果のひとつ**として扱えます。
呼び出し側は、

```java
userRepository.findById(id)
    .map(User::getName)
    .orElse("ゲスト");
```

と、`null` チェックを書かずに**流れるように扱える**のがメリットです。

---

## `Optional` の使いどころ

`Optional<T>` を返すのが向くケース：

- **存在しないかもしれない**「ない＝ふつう」のケース
- **検索系のメソッド**（`findByXxx`）
- **オプションの設定値**

逆に、`Optional` が向かないケース：

- **失敗の理由を伝えたい**（`Optional.empty()` だと「なぜ空か」が伝わらない）
- **複数の失敗の種類**がある

このような場面では、次に紹介する **Result 型**が出番です。

---

## Result 型 ― 「成功 or 失敗」を型で表す

Result 型は、

- **`Success<T>`**（成功した値）
- **`Failure<E>`**（失敗の理由）

の **2 通り**を、同じ型で扱える設計です。
Java の標準ライブラリにはありませんが、第27章のシールドクラスとレコードを使えば、自前で**かんたんに書けます**。

```java
public sealed interface Result<T, E>
    permits Result.Success, Result.Failure {

    record Success<T, E>(T value) implements Result<T, E> {}
    record Failure<T, E>(E error) implements Result<T, E> {}

    static <T, E> Result<T, E> success(T value) { return new Success<>(value); }
    static <T, E> Result<T, E> failure(E error) { return new Failure<>(error); }
}
```

`sealed interface` で「成功と失敗のどちらか」を表現しています。
これを返すと、**型に失敗の可能性が表れる**ので、呼び出し側がそれを意識せざるを得なくなります。

```java
public Result<User, AuthError> authenticate(String email, String password) {
    User user = userRepository.findByEmail(email);
    if (user == null) {
        return Result.failure(AuthError.USER_NOT_FOUND);
    }
    if (!user.matchesPassword(password)) {
        return Result.failure(AuthError.WRONG_PASSWORD);
    }
    return Result.success(user);
}

public enum AuthError { USER_NOT_FOUND, WRONG_PASSWORD, ACCOUNT_LOCKED }
```

呼び出し側は、第26章の**パターンマッチング**で受けます。

```java
Result<User, AuthError> result = authService.authenticate("a@example.com", "pw");

String message = switch (result) {
    case Result.Success<User, AuthError>(User user) ->
        "ようこそ、" + user.getName() + " さん";
    case Result.Failure<User, AuthError>(AuthError err) ->
        switch (err) {
            case USER_NOT_FOUND   -> "ユーザーが見つかりません";
            case WRONG_PASSWORD   -> "パスワードが違います";
            case ACCOUNT_LOCKED   -> "アカウントがロックされています";
        };
};
```

この書き方の良さは、

- **型で失敗が表現**される
- **網羅性チェック**がコンパイラに任せられる（`sealed` のおかげ）
- **例外を投げる必要がない**ので、トランザクションの予期しないロールバックが起きない

ということです。

---

## Result 型 vs 例外 ― いつどちらを使うか

| 状況 | 推奨 |
|---|---|
| 想定外のエラー（DB 切断、メモリ不足） | **例外**（非チェック） |
| ビジネス的に意味のある失敗（在庫不足、認証失敗） | **Result 型**または**ドメイン例外** |
| 「ある or ない」 | **`Optional<T>`** |
| API の境界での処理 | **例外**（`@RestControllerAdvice` で集約） |

Result 型は、

- **失敗の種類が複数**ある
- **業務フローの一部**として失敗を扱いたい

ようなときに、特に有効です。

---

## Result 型のチェーン

Optional と同じく、Result 型も**メソッドチェーン**で書けるようにすると、ぐっと書きやすくなります。
たとえば、次のような `map` や `flatMap` を追加すると、

```java
default <U> Result<U, E> map(Function<T, U> mapper) {
    return switch (this) {
        case Success<T, E>(T value) -> Result.success(mapper.apply(value));
        case Failure<T, E> fail     -> Result.failure(fail.error());
    };
}
```

このように使えます。

```java
Result<String, AuthError> message = authService
    .authenticate("a@example.com", "pw")
    .map(user -> "ようこそ、" + user.getName());
```

Java の標準ライブラリにはないので、`vavr` などのライブラリを使うか、自前で書きます。
**自前**でも 50 行くらいで実装できるので、業務システムでよく見ます。

---

## 関数型エラーハンドリングの考え方

Result 型を多用する設計は、**関数型エラーハンドリング**と呼ばれます。

- エラーが**値**として扱える
- 関数の合成が**型安全**
- 例外を投げず、ふつうの戻り値で**流れる**

Java 以外では、

- Rust の **`Result<T, E>`**
- Haskell / Scala の **`Either[E, A]`**

など、各言語で同様の概念が標準として組み込まれています。
Java は今のところ標準にはないので、**自前か Vavr**を使うことになります。

---

## どこまで取り入れるか?

「業務システム全部を Result 型で書く」のは、Java の慣例とは違うので、おすすめしません。
**現実的なアプローチ**は、

- 大部分は**例外**で書き
- 「複数の失敗を区別したい・トランザクションをロールバックさせたくない」ところだけ **Result 型**

くらいでよいでしょう。
たとえば、

- バリデーション結果 → Result 型（複数のエラーを返す）
- 認証 → Result 型（複数の失敗種類）
- DB アクセス → 例外
- 業務サービス → 例外（ドメイン例外）

など、**場面ごとに使い分ける**のがバランスのよい設計です。

---

## まとめ

- **`Optional<T>`** は「**ある or ない**」を表す標準的な型
- **Result 型**は「**成功 or 失敗（理由つき）**」を表す
- Result 型は、**`sealed interface` + record**で自前実装できる
- 例外と Result 型は、**目的に応じて使い分ける**
- ふつうは例外、**業務的に失敗の種類が複数ある**ときに Result 型
- 関数型エラーハンドリングは、**Java 以外の言語では標準的**

次の節は、第38章でも触れた**エラーレスポンス設計**を、もう少し深く掘り下げます。

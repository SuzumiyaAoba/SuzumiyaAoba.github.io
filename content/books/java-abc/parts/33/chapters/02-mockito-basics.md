---
title: Mockito の基本
llm: true
co-author: ["Claude Opus 4.7"]
---

## Mockito の基本

それでは、Mockito でモックを作って、テストを書いていきます[^mockito]。

---

## テスト対象のおさらい

第1節で出てきた `UserService` を、もう一度載せておきます。
これから、このクラスのテストを書きます。

```java
public class UserService {
    private final UserRepository repository;
    private final MailSender mailSender;

    public UserService(UserRepository repository, MailSender mailSender) {
        this.repository = repository;
        this.mailSender = mailSender;
    }

    public void notifyUser(long id, String message) {
        User user = repository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("ユーザーが見つかりません: " + id));
        mailSender.send(user.email(), "お知らせ", message);
    }
}
```

依存先である `UserRepository` と `MailSender` は、次のようなインターフェースです。

```java
public interface UserRepository {
    Optional<User> findById(long id);
    void save(User user);
}

public interface MailSender {
    void send(String to, String subject, String body);
}

public record User(long id, String name, String email) {}
```

---

## 方法1 ― `mock()` で手作業で作る

もっとも基本的な書き方です。

```java
package com.example.order;

import org.junit.jupiter.api.Test;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserServiceTest {

    @Test
    void sendsMailToFoundUser() {
        // 1. モックを作る
        UserRepository repository = mock(UserRepository.class);
        MailSender mailSender    = mock(MailSender.class);

        // 2. スタブを仕込む
        User taro = new User(1L, "Taro", "taro@example.com");
        when(repository.findById(1L)).thenReturn(Optional.of(taro));

        // 3. テスト対象に注入する
        UserService service = new UserService(repository, mailSender);

        // 4. 実行
        service.notifyUser(1L, "ご注文ありがとうございます");

        // 5. 呼び出しを検証
        verify(mailSender).send("taro@example.com", "お知らせ", "ご注文ありがとうございます");
    }
}
```

### `mock(クラス.class)` ― 空っぽのモックを作る

```java
UserRepository repository = mock(UserRepository.class);
```

これで、`UserRepository` インターフェースを実装した**何もしない偽物**ができます。
何も仕込まなければ、

- 戻り値が `Optional` … `Optional.empty()` が返る
- 戻り値が `int` などのプリミティブ … `0` が返る
- 戻り値が `void` … 何も起きない
- 戻り値がオブジェクト … `null` が返る

という、デフォルト挙動になります。
**呼んでも、本物の処理は何ひとつ走りません**。

### `when(...).thenReturn(...)` ― 振る舞いを仕込む（スタブ）

```java
when(repository.findById(1L)).thenReturn(Optional.of(taro));
```

「`findById(1L)` が呼ばれたら、`Optional.of(taro)` を返してね」と仕込んでいます。
これを**スタブ**（stub）と呼びます。詳しくは次節で扱います。

### `verify(...)` ― 呼ばれたことを確認する

```java
verify(mailSender).send("taro@example.com", "お知らせ", "ご注文ありがとうございます");
```

「`mailSender.send` が、これらの引数で**ちゃんと呼ばれたか**」を確認しています。
呼ばれていなければ、テスト失敗です。詳しくは第4節で扱います。

---

## 方法2 ― `@Mock` と `@InjectMocks` で短く書く

毎回 `mock(...)` を書くと長くなります。
JUnit 5 と組み合わせて、**アノテーションで一気に作る**書き方が、現場の定番です。

```java
package com.example.order;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepository repository;       // モックを作る
    @Mock MailSender mailSender;            // モックを作る
    @InjectMocks UserService service;       // モックを差し込んでテスト対象を作る

    @Test
    void sendsMailToFoundUser() {
        User taro = new User(1L, "Taro", "taro@example.com");
        when(repository.findById(1L)).thenReturn(Optional.of(taro));

        service.notifyUser(1L, "ご注文ありがとうございます");

        verify(mailSender).send("taro@example.com", "お知らせ", "ご注文ありがとうございます");
    }
}
```

ポイントを順番に見ていきます。

### `@ExtendWith(MockitoExtension.class)` ― Mockito を JUnit に組み込む

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest { ... }
```

JUnit 5 の**拡張機能**として Mockito を有効化するアノテーションです。
これを書いておくと、`@Mock` / `@InjectMocks` のフィールドを、テストの実行前に**自動で組み立て**てくれます。

### `@Mock` ― モックを作る

```java
@Mock UserRepository repository;
```

`mock(UserRepository.class)` を 1 行で書ける、というだけのものです。
ただし、フィールドに付ける必要があります。

### `@InjectMocks` ― モックを注入したテスト対象を作る

```java
@InjectMocks UserService service;
```

`@InjectMocks` は、

1. `UserService` のコンストラクタ・セッター・フィールドを見て
2. そこに合いそうな**モックフィールドを自動で探し出し**
3. それらを引数にして `new UserService(...)` してくれる

という、便利アノテーションです。
コンストラクタ注入（`UserService(UserRepository, MailSender)`）で書かれていれば、勝手にちょうどよく差し込んでくれます。

---

## 実行する

`mvn test` でテストを実行すると、こんな出力が得られます。

```text
[INFO] Running com.example.order.UserServiceTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

実機検証済みなので、コードをコピペすればそのまま動きます。

---

## どっちで書くか ― 短いほうがやさしい

方法1（`mock()` 直接呼び出し）と、方法2（アノテーション）は、どちらでも動きます。
**何が起きているかの理解**は方法1のほうが分かりやすく、**実務での書きやすさ**は方法2が優れています。

入門段階としては、

- 最初は方法1で「何が起きているか」を理解する
- 慣れたら方法2に乗り換える

という順番が、おすすめです。
以降の節では、見やすさのため**方法2のアノテーション形式**で書いていきます。

---

## モックの基本3ステップ

ここまで見てきたコードは、いつも**同じ3ステップ**でできています。

1. **モックを作る** … `@Mock` または `mock(...)`
2. **振る舞いを仕込む** … `when(...).thenReturn(...)`
3. **呼び出しを検証する** … `verify(...)`

このうち、2 と 3 をそれぞれ深掘りしていくのが、次節以降のテーマです。

---

## まとめ

- Mockito では、**`mock(クラス.class)` または `@Mock`** でモックが作れます
- `@ExtendWith(MockitoExtension.class)` を付けると、アノテーションでまとめて準備できます
- `@InjectMocks` は、モックを**自動で注入したテスト対象**を作ってくれます
- モックのテストは、いつも「**作る → 仕込む → 検証する**」の3ステップ

次の節では、「**振る舞いを仕込む**」スタブの書き方を、もっと詳しく見ていきます。

[^mockito]: Mockito Framework, [https://site.mockito.org/](<https://site.mockito.org/>)。Java で広く使われるモッキングライブラリで、`mock()`／`when(...).thenReturn(...)`／`verify()` などの簡潔な API を提供する。Java SE と JUnit／TestNG 等のテストフレームワークと併用される。

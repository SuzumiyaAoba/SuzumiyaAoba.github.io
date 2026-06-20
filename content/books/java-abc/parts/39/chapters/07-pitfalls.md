---
title: よくあるつまずき
llm: true
---

## よくあるつまずき

エラーハンドリングで、現場でハマりやすいポイントを整理します。

---

## 1. 例外の握りつぶし

これが最頻出のアンチパターンです。

```java
try {
    doSomething();
} catch (Exception e) {
    // 何もしない or System.out.println だけ
}
```

これは、

- 問題の**証拠が消える**
- バグの調査が**極めて困難**
- 本番障害の**原因解明に何時間も**かかる

という、業務システムの**いちばんの敵**です。

### 対処

- ログに**例外オブジェクト `e`** を必ず渡す
- それ以外の場面では、`catch` を書かない

---

## 2. `e.getMessage()` だけログに書く

```java
log.error("失敗: " + e.getMessage());   // △
```

`getMessage()` だけだと、**スタックトレースが残りません**。
原因が、別のクラスの別の例外だった場合、まったく追えなくなります。

### 対処

```java
log.error("失敗", e);   // ◯ 例外オブジェクトを最後の引数に
```

SLF4J（第40章）のロガーは、最後の引数に **`Throwable`** を取ると、自動でスタックトレースを出力します。

---

## 3. `printStackTrace()` で済ます

```java
} catch (Exception e) {
    e.printStackTrace();   // △
}
```

`printStackTrace()` は、**標準エラー出力**にスタックトレースをそのまま出します。

- ログ基盤に**乗らない**（ファイルや監視に流れない）
- レベル制御（INFO / ERROR）が**できない**
- **本番ではほぼ役に立たない**

### 対処

- 必ず `log.error(...)` を使う
- `printStackTrace` は、**学習中の `main` だけ**にとどめる

---

## 4. ログの二重出力

```java
try {
    doSomething();
} catch (Exception e) {
    log.error("失敗", e);
    throw e;
}
```

このコードは、

- ここで `ERROR` ログ
- 上層の `@RestControllerAdvice` でもまた `ERROR` ログ

―― と、**同じ例外で 2 回ログ**が出ます。
量だけ多くて、情報量はゼロです。

### 対処

- 「**最終的に処理する場所**」だけでログを残す
- 途中で**ラップして throw**するなら、ログは書かない

---

## 5. 不要に `Exception` をキャッチ

```java
try {
    repository.save(book);
} catch (Exception e) {
    log.error("保存失敗", e);
    throw new RuntimeException(e);
}
```

ここで `Exception` をキャッチする意味はありません。
そのまま投げれば、上の `@RestControllerAdvice` が捕まえて、適切なレスポンスを返してくれます。

### 対処

- `catch (Exception)` を**むやみに書かない**
- 「**ここで何かする理由があるか?**」を考える

---

## 6. ドメイン例外なのに `IllegalArgumentException` を投げる

```java
if (stock < quantity) {
    throw new IllegalArgumentException("在庫不足");   // △
}
```

これは、「**呼び出し側のパラメータが悪い**」のではなく、「**業務的に成立しない**」状況です。
`IllegalArgumentException` を使うと、

- 呼び出し側は「**自分のバグだ**」と思ってしまう
- 上層で**区別がつかない**
- API レスポンスを **400 か 422 か**判断できない

### 対処

- **ドメイン例外**を作る（第2節）
- 「形式エラー」と「業務エラー」を**型で分ける**

---

## 7. チェック例外を `RuntimeException` でラップしっぱなし

```java
try {
    file.read();
} catch (IOException e) {
    throw new RuntimeException(e);   // △ 中身が伝わらない
}
```

これでは、

- 上層でハンドリングしようとしても**型で分岐できない**
- どんなエラーなのかが**メッセージ頼り**

になります。

### 対処

- **ドメイン例外でラップ**する（例: `FileReadException`）
- そうすれば、上層で**意味のあるハンドリング**ができる

---

## 8. `try-with-resources` を使わずにリソースリーク

```java
BufferedReader reader = new BufferedReader(...);
String line = reader.readLine();
// reader.close() を忘れる
```

第30章で学んだ **`try-with-resources`** を使えば、自動でクローズされます。

```java
try (BufferedReader reader = new BufferedReader(...)) {
    String line = reader.readLine();
}
```

リソースリーク（ファイルディスクリプタや DB 接続の枯渇）は、本番でじわじわ効いてきます。

---

## 9. 失敗時にトランザクションを戻し忘れる

```java
@Service
public class OrderService {

    public void placeOrder(Order order) {        // ← @Transactional がない
        orderRepository.save(order);
        try {
            mailSender.send(...);
        } catch (Exception e) {
            // メール失敗を握りつぶし
        }
    }
}
```

- `@Transactional` が**ない**なら、`save` は即コミット
- メールが失敗しても、注文は**コミット済み**
- 「メールは届いていないが、注文だけ通った」状態が残る

### 対処

- **`@Transactional`** を付けて、メール失敗時にロールバックさせる
- あるいは、メールは**非同期キュー**に切り出して、本トランザクションから外す（**結果整合性**）

---

## 10. 例外メッセージに機密情報を入れる

```java
throw new RuntimeException("DB 接続失敗: " + connectionString);  // △
```

`connectionString` に**パスワード**が含まれていることがあります。
このまま例外が上に伝播すると、

- ログに**パスワード**が残る
- 場合によっては、**API レスポンス**に出てしまう

### 対処

- メッセージには、**機密情報を入れない**
- 接続失敗なら「DB 接続失敗」だけにする
- 詳しい情報は、**安全な場所**にしまう（個別ロガーの DEBUG など）

---

## 11. リトライ無限ループ

```java
while (true) {
    try {
        callExternalApi();
        break;
    } catch (IOException e) {
        // 永遠にリトライ
    }
}
```

外部 API が**完全に死んでいる**ときに、無限にリクエストを送り続けます。

### 対処

- **回数制限** + **指数バックオフ**
- **Resilience4j** などのライブラリで宣言的に書く

```java
for (int i = 0; i < 3; i++) {
    try { return callExternalApi(); }
    catch (IOException e) {
        if (i == 2) throw new ServiceUnavailableException(e);
        Thread.sleep(1000L * (1L << i));
    }
}
```

---

## 12. すべてを `RuntimeException` 1 つで扱う

```java
throw new RuntimeException("いろいろ失敗");
```

これだと、上層で**何が起きたか分からない**。
ハンドリング側は「とりあえず 500 を返す」しかなくなります。

### 対処

- **業務エラーは、ドメイン例外で**
- インフラエラーは、できるだけ**意味のあるラッパー**を作る（`DataAccessException` 階層など）

---

## まとめ

- **握りつぶし禁止**。例外オブジェクトを必ずログに渡す
- `getMessage()` だけ・`printStackTrace()` は**ダメ**
- ログは**1 回だけ**、捕まえた場所で
- **`catch (Exception)`** をむやみに書かない
- **ドメイン例外**を作って、業務エラーを表現する
- チェック例外は、**意味のあるラッパー**でラップする
- リソースは **`try-with-resources`**
- メール送信などは、**トランザクションの責任範囲**を意識
- 機密情報を**例外メッセージに入れない**
- リトライは**回数制限 + バックオフ**

次は、この章で学んだ言葉を、用語集としてまとめます。

---
title: よくあるつまずき
llm: true
---

## よくあるつまずき

ロギングで、初心者と中堅以上の両方がはまるポイントを整理します。

---

## 1. `System.out.println` でログを出す

第1節で説明したとおり、**業務システムでは絶対に避けましょう**。

```java
System.out.println("注文受付: " + orderId);   // △
```

### 対処

```java
private static final Logger log = LoggerFactory.getLogger(OrderService.class);

log.info("注文受付: orderId={}", orderId);   // ◯
```

レベル制御、出力先の切り替え、性能、すべての観点でメリットしかありません。

---

## 2. `+` で文字列を連結する

```java
log.debug("詳細: " + heavyData.toString());   // △
```

ログが**実際に出ない**ときも、`heavyData.toString()` が**毎回**実行されます。
ログ呼び出しごとに何ミリ秒の損失でも、積もると性能を侵食します。

### 対処

```java
log.debug("詳細: {}", heavyData);   // ◯
```

`{}` 記法だと、ログが出るときだけ `toString()` が呼ばれます。

---

## 3. 例外を `.getMessage()` でだけ出す

第39章でも触れた、**いちばんよくある**アンチパターン。

```java
log.error("失敗: " + e.getMessage());   // △ スタックトレースが消える
```

### 対処

```java
log.error("失敗", e);   // ◯ 例外オブジェクトを最後の引数に
```

`{}` の数と引数の数が一致していなくても、**最後の `Throwable`** は自動でスタックトレースとして処理されます。

---

## 4. 大量のループでログを出す

```java
for (Item item : items) {
    log.info("処理中: itemId={}", item.id());   // △ 100 万件ループで地獄
}
```

100 万件のループの中で `log.info` を呼ぶと、

- ログファイルが**数百 MB に膨れる**
- ディスクが**埋まる**
- ログ集約システムが**詰まる**

### 対処

- ループ内は **`DEBUG`** にする（本番では出ない）
- 「**N 件処理した**」の**進捗ログ**だけ INFO で残す

```java
int count = 0;
for (Item item : items) {
    log.debug("処理中: itemId={}", item.id());
    if (++count % 10000 == 0) {
        log.info("進捗: {} / {}", count, items.size());
    }
}
log.info("完了: 全 {} 件", count);
```

---

## 5. 個人情報・パスワードをログに出す

```java
log.info("ユーザー認証: email={}, password={}", email, password);   // △ 漏洩
```

ログには、

- パスワード・認証トークン
- クレジットカード番号
- マイナンバー

を**絶対に書かない**のが、業務システムの大原則です。

### 対処

- パスワードは**書かない**
- メールアドレスは**マスキング**（`a***@example.com`）
- ID は**ハッシュ化**

業務によっては、**ログ自体の暗号化**や**アクセス制限**も必要です。

---

## 6. 二重・三重にログが出る

```java
try {
    process();
} catch (Exception e) {
    log.error("処理失敗", e);
    throw e;   // ← 上層でもログが出る
}
```

ログが**2 回**出力されます。
量だけ多く、情報量はゼロです。

### 対処

- 「**最終的に処理する場所**」だけでログを出す
- ラップして再 throw する箇所では、ログを出さない

---

## 7. `printStackTrace()` で済ます

```java
} catch (Exception e) {
    e.printStackTrace();   // △
}
```

第39章でも繰り返した点ですが、ここでも改めて。

- **標準エラー出力に直接**出るので、ログ基盤に乗らない
- レベル制御・MDC・パターン整形が**できない**
- ファイルに残らない

### 対処

```java
} catch (Exception e) {
    log.error("失敗", e);
}
```

---

## 8. ログを出すか判断にコストをかける

```java
String summary = buildHeavySummary(data);   // ← 毎回実行
log.debug("詳細: {}", summary);
```

`buildHeavySummary` の中身が重いと、DEBUG が無効でも処理が走ります。

### 対処

```java
if (log.isDebugEnabled()) {
    log.debug("詳細: {}", buildHeavySummary(data));
}
```

`isDebugEnabled` で**メッセージ組み立て自体**を抑制します。
ふつうの `{}` 引数では、ガード節は不要ですが、**メッセージ生成が重い場合**だけ必要です。

---

## 9. MDC の `clear` を忘れる

```java
MDC.put("traceId", traceId);
process();   // 例外で抜けたら、clear されない
MDC.clear();
```

例外で抜けたとき、`clear` が呼ばれません。
次に**同じスレッドが**別のリクエストを処理するとき、**前の traceId が混入**します。

### 対処

```java
MDC.put("traceId", traceId);
try {
    process();
} finally {
    MDC.clear();
}
```

業務システムでは、**フィルタで `try-finally` を必ず書く**のが定石です。

---

## 10. ログがファイルにあふれて、ディスクが埋まる

ローテーションを設定しなかったり、`maxHistory` を入れ忘れると、

- 何ヶ月分ものログが**残り続ける**
- ディスクが**埋まり**、アプリ自体が動かなくなる

「本番でディスクフル → アプリ停止」は、最も悲しい原因のひとつです。

### 対処

- `RollingFileAppender` + **`maxHistory`** + **`totalSizeCap`** を必ず設定
- 監視で**ディスク使用率**にアラートを設定

---

## 11. 構造化ログにメッセージを詰め込む

```java
log.info("注文受付 orderId=" + orderId + ", userId=" + userId);
```

これだと、

- メッセージが**長い**
- 構造化ログの良さが**まったく活きない**
- 検索でもパースが必要

### 対処

```java
log.info("注文受付", kv("orderId", orderId), kv("userId", userId));
```

メッセージは「**何が起きた**」だけ。値は **フィールド**として持ち回ります。

---

## 12. ログレベルの意味を**チームでブラさない**

「INFO で出すべきか、DEBUG にすべきか」が、人によって違うと、

- 「**WARN ばっかり**」のシステム
- 「**ERROR が業務エラーで埋もれている**」システム

になってしまいます。

### 対処

- チームで **ログレベルのガイドライン**を作る
- 第3節の表のような基準を、**チームの README** に書く
- レビューで「**このログ、レベル違うんじゃない?**」と指摘し合う

---

## まとめ

- **`System.out.println`** ではなく**ロガー**を使う
- 文字列 `+` 連結ではなく **`{}` プレースホルダ**
- 例外は**オブジェクトのまま**最後の引数に
- ループの中で**ログを大量に出さない**
- 個人情報・機密は**ログに残さない**
- ログは「**最終的な場所で 1 回だけ**」
- MDC は **`try-finally` で必ず `clear`**
- ローテーションを必ず設定（**`maxHistory` + `totalSizeCap`**）
- 構造化ログは**メッセージとフィールドを分離**
- レベルの基準は**チームで揃える**

次の節は、本書最終の用語集と、「おわりに」です。

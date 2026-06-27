---
title: データベースアクセスの効率
llm: true
---

## データベースアクセスの効率

Web アプリの遅さの**8 割**は、データベースアクセスにあります。
JVM のチューニングよりも、SQL とアクセスパターンの見直しのほうが、**桁違い**に効きます。
第37章で扱った Spring Data JPA の実践として、性能改善のポイントを整理します。

---

## N+1 問題

最頻出の罠が、**N+1 問題**です。

```java
List<User> users = userRepository.findAll();
for (User user : users) {
    System.out.println(user.getOrders().size());   // ← 各 user に対し SQL が走る
}
```

`findAll()` で 1 回 SQL → 1 user ごとに `getOrders()` で N 回 SQL ―― 合計 **N+1 回**の SQL です。
**100 user なら 101 SQL**、これでパフォーマンスが詰みます。

### 解決1: `@EntityGraph`

```java
@EntityGraph(attributePaths = {"orders"})
List<User> findAll();
```

これで、`User` と `Order` を JOIN した SQL が **1 回**で走ります。

### 解決2: `JOIN FETCH` の JPQL

```java
@Query("SELECT u FROM User u LEFT JOIN FETCH u.orders")
List<User> findAllWithOrders();
```

`JPQL` で `JOIN FETCH` を書く。
複雑な条件があるなら、こちらが柔軟。

### 解決3: 必要なデータだけ取る DTO

```java
@Query("SELECT new com.example.UserSummary(u.id, u.name, COUNT(o)) FROM User u JOIN u.orders o GROUP BY u")
List<UserSummary> findUserSummaries();
```

エンティティを丸ごと取らずに、**集計やプロジェクション**で必要なデータだけ取る。
最終的にはこれが最も速いことが多いです。

---

## ページネーション

「**1000 件返す API**」は、**常に遅い**です。
ページネーションは、データを**少しずつ**返すための基本テクニック。

Spring Data JPA なら、

```java
Page<User> findAll(Pageable pageable);

// 呼び出し側
PageRequest page = PageRequest.of(0, 20, Sort.by("createdAt").descending());
Page<User> users = userRepository.findAll(page);
```

これで「**最新 20 件**」だけ取得します。

### `count` の負荷

`Page` は内部で**`count(*)` クエリ**も実行します。
大きなテーブルでは、これ自体が重いです。
件数を正確に知る必要がないなら、**`Slice`** を使うほうが軽量:

```java
Slice<User> findByActive(boolean active, Pageable pageable);
```

`Slice` は `count` をしないので、「**次のページがあるか**」だけ分かります。
無限スクロール UI には、こちらが適切です。

---

## バッチ更新

`save()` を 1 万回呼ぶより、**バッチ更新**のほうが、はるかに速いです。

```java
// 遅い
for (User u : newUsers) {
    userRepository.save(u);
}

// 速い
userRepository.saveAll(newUsers);
```

Spring Data JPA の `saveAll` は、**バッチサイズに分けて INSERT** を一括発行します。
ただし、`hibernate.jdbc.batch_size` の設定が必要です:

```properties
spring.jpa.properties.hibernate.jdbc.batch_size=50
spring.jpa.properties.hibernate.order_inserts=true
spring.jpa.properties.hibernate.order_updates=true
```

これで、複数の INSERT が**1 つのバッチ**にまとまります。

---

## トランザクション境界

トランザクションは、**短く**しましょう。

```java
// NG: トランザクション内で外部 API
@Transactional
public void process() {
    User u = userRepository.findById(id).orElseThrow();
    String result = httpClient.send(...);   // ← トランザクション内で I/O
    u.setStatus(result);
}
```

トランザクション中は、DB のロックを握り続けます。
その間に外部 API が遅延すると、**他のリクエストが待たされる**。

```java
// OK: トランザクションは最後に
public void process() {
    User u = userRepository.findById(id).orElseThrow();
    String result = httpClient.send(...);   // トランザクション外
    updateUserStatus(u.getId(), result);
}

@Transactional
public void updateUserStatus(Long id, String status) {
    User u = userRepository.findById(id).orElseThrow();
    u.setStatus(status);
}
```

「**読む → 計算 → 書く**」のうち、**書く部分だけトランザクションに**する設計が原則です。

---

## コネクションプール

DB 接続は、**毎回作っていたら遅すぎます**。コネクションプールが必須。
Spring Boot は HikariCP がデフォルト。

```properties
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=10000
```

「**プールサイズが少なすぎる**」と、リクエストが**接続待ち**で詰まります。
「**多すぎる**」と、DB 側の接続数上限を圧迫します。

目安は:

- **小さな Web アプリ**: 20〜30
- **大きなアプリ**: 50〜100
- 必ず**DB 側のmax_connections**より少なく

そして、HikariCP の作者は「**プールサイズは多すぎる傾向にある**」と何度も警告しています。
適正なサイズは、**実測で**決めましょう。

---

## インデックス

SQL チューニングの根幹は、**インデックス**です。
頻繁に WHERE 句に使うカラム、JOIN キー、ORDER BY のカラムには、インデックスを張る。

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
```

ですが、**インデックスは無料ではありません**:

- **INSERT/UPDATE が遅くなる**（インデックスも更新する必要）
- **ディスクを使う**
- **メモリを使う**（バッファプール）

**書き込みが多いテーブル**には、インデックスを最小限に。
**読み込みが多い**なら、いくつでも張れます。

JPA / Hibernate を使うときは、自動生成された SQL を**ログで確認**して、想定したインデックスが使われているか確認しましょう。

```properties
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
logging.level.org.hibernate.SQL=DEBUG
```

---

## 「**読みが多い**」なら**キャッシュ**

頻繁に同じデータを読むなら、キャッシュが効きます ―― ですが、それは**次の節**のテーマです。

---

## まとめると

- **N+1 問題**: `@EntityGraph`・`JOIN FETCH`・DTO で解決
- **ページネーション**: `Page` か **`Slice`**（軽量）
- **バッチ更新**: `saveAll` + `hibernate.jdbc.batch_size`
- **トランザクションは短く** ―― I/O はトランザクション外で
- **コネクションプール**は、適正サイズを実測
- **インデックス**は、読み多いカラムに最小限
- **遅い SQL は、まず**EXPLAIN**を見る** ―― 鉄則

次の節では、データベースアクセスを**そもそも減らす**ための **キャッシュ戦略** を扱います。

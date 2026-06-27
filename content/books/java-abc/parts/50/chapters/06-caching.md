---
title: キャッシュ戦略
llm: true
---

## キャッシュ戦略

「**最速のクエリは、走らないクエリ**」 ―― キャッシュは、性能改善で最も効果が大きい手段の 1 つです。
ですが、間違って使うと、データの不整合・メモリリーク・複雑性の増大を招きます。
この節では、Java で実用的なキャッシュ戦略を整理します。

---

## キャッシュの 3 階層

Web アプリで使われるキャッシュは、おおむね 3 階層に分けられます。

```text
[クライアント]
    │
    │ ① CDN / ブラウザキャッシュ
    │
[ロードバランサ]
    │
    │ ② 共有キャッシュ（Redis、Memcached）
    │
[アプリサーバー]
    │
    │ ③ ローカルキャッシュ（Caffeine、ConcurrentHashMap）
    │
[データベース]
```

それぞれの特徴:

| 階層 | 速さ | スケール | 適した用途 |
|---|---|---|---|
| ① CDN | 最速 | 大規模 | 静的コンテンツ、画像、JS |
| ② Redis | 速い | 中〜大 | セッション、共有データ |
| ③ ローカル | **最速**（メモリ内） | 単一インスタンス | 頻繁に読まれる小さなデータ |

「**自分のアプリにどの階層が必要か**」は、データの**共有要件**と**規模**で決まります。

---

## ローカルキャッシュ ―― Caffeine

Java で最も使われるローカルキャッシュは、**Caffeine** です。

```java
import com.github.benmanes.caffeine.cache.*;

Cache<String, User> cache = Caffeine.newBuilder()
    .maximumSize(10_000)
    .expireAfterWrite(Duration.ofMinutes(10))
    .build();

User u = cache.get(userId, id -> userRepository.findById(id).orElseThrow());
```

特徴:

- **`maximumSize`**: 件数制限（W-TinyLFU アルゴリズム）
- **`expireAfterWrite`**: 書き込みからの寿命
- **`expireAfterAccess`**: アクセスからの寿命
- **`refreshAfterWrite`**: 期限切れ前にバックグラウンドで更新

Spring Boot との統合も簡単:

```java
@Cacheable("users")
public User findUser(Long id) { ... }
```

`@Cacheable` を付けるだけで、Caffeine が裏で動く。

---

## 共有キャッシュ ―― Redis

複数のアプリインスタンスでキャッシュを共有したい、セッションを共有したい ―― そんなときは Redis。

```java
@Cacheable(value = "users", key = "#id")
public User findUser(Long id) { ... }
```

Spring Boot で `spring-boot-starter-data-redis` を入れて、`@EnableCaching` を付ければ、`@Cacheable` の保存先が Redis になります。

ローカルキャッシュより遅い（ネットワークホップが入る）ですが、**全インスタンスで一貫した値**が見えるのが大きな利点です。

---

## キャッシュの**失効戦略**

キャッシュには、**何をいつ捨てるか**の戦略が必要です。

### TTL（Time To Live）

「**書いてから N 分**で消える」ようにする。
最もシンプル。データが**多少古くてもよい**用途に向きます。

### LRU（Least Recently Used）

「**最近使われていない**ものから消す」。
件数制限と組み合わせて使う。Caffeine が使うアルゴリズム。

### Write-Through / Write-Behind

書き込み時にキャッシュも更新するか、書き込みは DB に通すだけにするか。

| | キャッシュ | DB |
|---|---|---|
| Write-Through | **同時更新** | 同時更新 |
| Write-Behind | キャッシュに書く | **後で**まとめて DB へ |
| Cache-Aside | アプリ側で**読み書き両方**を管理 | アプリが直接更新 |

業務コードで最も一般的なのは、**Cache-Aside** パターンです:

```java
public User findUser(Long id) {
    User cached = cache.getIfPresent(id);
    if (cached != null) return cached;
    User u = repository.findById(id).orElseThrow();
    cache.put(id, u);
    return u;
}

public void updateUser(User u) {
    repository.save(u);
    cache.invalidate(u.getId());   // ← キャッシュも破棄
}
```

---

## キャッシュの**罠**

キャッシュは、扱いを間違えると致命的なバグを生みます。

### 罠1: スタンピード（cache stampede）

キャッシュが**期限切れ**になった瞬間、大量のリクエストが**同時にDB に問い合わせ**ます。
DB は一気に過負荷。

対策:

- **再生成のロック**: 1 リクエストだけが DB を叩き、他は待つ
- **`refreshAfterWrite`** で、**期限前**にバックグラウンド更新
- ランダムな**ジッター**を加えて、期限切れタイミングをずらす

### 罠2: キャッシュの不整合

DB を更新したが、キャッシュを更新し忘れた → ユーザーに**古いデータ**が返る。

対策:

- 更新時は、必ずキャッシュも **invalidate** または **更新**
- **Pub/Sub**（Redis の `publish`）でキャッシュ無効化を全インスタンスに通知

### 罠3: メモリリーク

「**期限なし・上限なし**」のキャッシュは、**事故の素**です。
- `maximumSize` を必ず設定
- `expireAfter*` も必ず設定

`HashMap<String, Object>` を「キャッシュ」と呼んで運用するのは、**やめましょう**。
ちゃんとした Caffeine か Redis を使うのが正解です。

---

## 「**何をキャッシュするか**」の判断

すべてをキャッシュすべきではありません。

| 種類 | キャッシュ? |
|---|---|
| **読みが多い・書きが少ない** | **YES**（ユーザープロファイル、設定） |
| **読みも書きも頻繁** | **慎重に**（在庫数など、不整合リスク） |
| **大きく変化する** | NO |
| **個人情報** | **慎重に**（セキュリティ、TTL を短く） |
| **計算結果**（重い処理） | YES |

「**キャッシュしてよいか**」を、**業務的な意味**から考えるのが第一歩です。

---

## 「キャッシュの**外側**」も忘れない

キャッシュをいくら効率化しても、**裏の DB がスケールしない**なら限界があります。
本格的な性能改善では、

- **読み取り**: 読み取り専用レプリカ、Read replicas
- **書き込み**: シャーディング、CQRS（コマンドとクエリの分離）

など、**アーキテクチャ**の改善が必要になることもあります。
本書の範囲を超えますが、「**キャッシュは万能ではない**」ことだけ覚えておきましょう。

---

## まとめると

- キャッシュは性能改善の**強力な手段**だが、罠も多い
- 3 階層: **CDN・共有キャッシュ・ローカルキャッシュ**
- Java では **Caffeine**（ローカル）、**Redis**（共有）が定番
- 失効戦略: **TTL・LRU・Write-Through・Cache-Aside**
- 必ず **`maximumSize`** と **`expireAfter*`** を設定する
- **スタンピード・不整合・リーク**の罠に注意
- 「**何をキャッシュするか**」を、業務的意味から判断する

これで、性能改善のための具体的な手法は出揃いました。
次の節では、本書全体を振り返り、**これからの学び**を整理します。
